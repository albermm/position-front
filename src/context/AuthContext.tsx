import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import Config from '../config';

const IDENTITY_POOL_ID = Config.IDENTITY_POOL_ID;
const USER_POOL_ID = Config.USER_POOL_ID;
const CLIENT_ID = Config.CLIENT_ID;
const REGION = Config.REGION;

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
});

type AuthContextType = {
  isAuthenticated: boolean;
  cognitoUser: CognitoUser | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  getCredentials: () => Promise<{ identityId: string; token: string }>;
  checkAuthState: () => Promise<void>;
  completeNewPasswordChallenge: (newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cognitoUser, setCognitoUser] = useState<CognitoUser | null>(null);

  const checkAuthState = async () => {
    try {
      const currentUser = userPool.getCurrentUser();
      if (currentUser) {
        currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
          if (err) {
            setIsAuthenticated(false);
          } else if (session && session.isValid()) {
            setCognitoUser(currentUser);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        });
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsAuthenticated(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      const user = new CognitoUser({
        Username: username,
        Pool: userPool,
      });

      user.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          setCognitoUser(user);
          setIsAuthenticated(true);
          resolve();
        },
        onFailure: (err) => {
          console.error('Error signing in:', err);
          reject(err);
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          setCognitoUser(user);
          reject(new Error('New password required'));
        },
      });
    });
  };

  const completeNewPasswordChallenge = async (newPassword: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!cognitoUser) {
        reject(new Error('No user found'));
        return;
      }

      cognitoUser.completeNewPasswordChallenge(
        newPassword,
        {},
        {
          onSuccess: (session: CognitoUserSession) => {
            setIsAuthenticated(true);
            resolve();
          },
          onFailure: (err: any) => {
            console.error('Error changing password:', err);
            reject(err);
          },
        }
      );
    });
  };

  const signOut = () => {
    if (cognitoUser) {
      cognitoUser.signOut();
      setCognitoUser(null);
      setIsAuthenticated(false);
    }
  };

  const getCredentials = async (): Promise<{ identityId: string; token: string }> => {
    if (!cognitoUser) {
      throw new Error('User not authenticated');
    }

    return new Promise((resolve, reject) => {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err) {
          reject(err);
          return;
        }

        if (!session) {
          reject(new Error('No session found'));
          return;
        }

        const cognitoIdentityClient = new CognitoIdentityClient({
          credentials: fromCognitoIdentityPool({
            clientConfig: { region: REGION },
            identityPoolId: IDENTITY_POOL_ID,
            logins: {
              [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: session.getIdToken().getJwtToken(),
            },
          }),
        });

        cognitoIdentityClient.config.credentials().then((credentials: any) => {
          if (typeof credentials.identityId === 'string') {
            resolve({
              identityId: credentials.identityId,
              token: session.getIdToken().getJwtToken()
            });
          } else {
            reject(new Error('Invalid credentials format'));
          }
        }).catch(reject);
      });
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, cognitoUser, signIn, signOut, getCredentials, checkAuthState, completeNewPasswordChallenge }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};