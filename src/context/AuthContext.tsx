import React, { createContext, useState, useContext, useEffect } from 'react';
import { CognitoUserPool, CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

const IDENTITY_POOL_ID = 'us-east-1:fb9b4aa0-5b5d-40fc-97b0-7f51471252e6';
const USER_POOL_ID = 'us-east-1_QJJ74aa1b';
const CLIENT_ID = '6m04urkdq3o76k6gjah9jm99p9';
const REGION = 'us-east-1';

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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cognitoUser, setCognitoUser] = useState<CognitoUser | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

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
    // Implement sign in logic here
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
    <AuthContext.Provider value={{ isAuthenticated, cognitoUser, signIn, signOut, getCredentials }}>
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