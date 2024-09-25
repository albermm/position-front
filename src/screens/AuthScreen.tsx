import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input, Button, Text } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  CognitoUserPool, 
  CognitoUser, 
  AuthenticationDetails, 
  CognitoUserSession 
} from 'amazon-cognito-identity-js';
import { CognitoIdentityClient, GetIdCommand } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { useAppContext } from '../context/AppContext';
import Config from '../config';
type RootStackParamList = {
  Auth: undefined;
  Upload: undefined;
};

type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

// Use Config values
const IDENTITY_POOL_ID = Config.IDENTITY_POOL_ID;
const USER_POOL_ID = Config.USER_POOL_ID;
const CLIENT_ID = Config.CLIENT_ID;
const REGION = Config.REGION;

// Check if UserPoolId and ClientId are set
if (!USER_POOL_ID || !CLIENT_ID) {
  throw new Error('UserPoolId and ClientId must be set in the config file');
}

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
});


const AuthScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [changePasswordRequired, setChangePasswordRequired] = useState(false);
  const [cognitoUser, setCognitoUser] = useState<CognitoUser | null>(null);

  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { setUser, setIsLoading, setError } = useAppContext();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    setIsLoading(true);
    try {
      const currentUser = userPool.getCurrentUser();
      if (currentUser) {
        const session = await new Promise<CognitoUserSession | null>((resolve, reject) => {
          currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
            if (err) reject(err);
            else resolve(session);
          });
        });

        if (session && session.isValid()) {
          setCognitoUser(currentUser);
          setIsAuthenticated(true);
          setUser({ id: currentUser.getUsername(), username: currentUser.getUsername() });
          navigation.navigate('Upload');
        }
      }
    } catch (error) {
      handleError(error, 'Error checking auth state');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      const user = new CognitoUser({
        Username: username,
        Pool: userPool,
      });

      await new Promise<void>((resolve, reject) => {
        user.authenticateUser(authenticationDetails, {
          onSuccess: (session) => {
            setCognitoUser(user);
            setIsAuthenticated(true);
            setUser({ id: username, username });
            navigation.navigate('Upload');
            resolve();
          },
          onFailure: (err) => {
            console.error('Error signing in:', err);
            Alert.alert('Error', 'Failed to sign in');
            reject(err);
          },
          newPasswordRequired: (userAttributes, requiredAttributes) => {
            setCognitoUser(user);
            setChangePasswordRequired(true);
            resolve();
          },
        });
      });
    } catch (error) {
      handleError(error, 'Error signing in');
    } finally {
      setIsLoading(false);
    }
  };

  const completeNewPasswordChallenge = async () => {
    if (!cognitoUser) {
      setError('No user found');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        cognitoUser.completeNewPasswordChallenge(
          newPassword,
          {},
          {
            onSuccess: (session: CognitoUserSession) => {
              setIsAuthenticated(true);
              setChangePasswordRequired(false);
              setUser({ id: username, username });
              navigation.navigate('Upload');
              resolve();
            },
            onFailure: reject,
          }
        );
      });
    } catch (error) {
      handleError(error, 'Error changing password');
    } finally {
      setIsLoading(false);
    }
  };

  const getCredentials = async (): Promise<{ identityId: string; token: string }> => {
    if (!cognitoUser) {
      throw new Error('User not authenticated');
    }
  
    const session = await new Promise<CognitoUserSession>((resolve, reject) => {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err) reject(err);
        else if (session) resolve(session);
        else reject(new Error('No session found'));
      });
    });
    const idToken = session.getIdToken().getJwtToken();

    const cognitoIdentityClient = new CognitoIdentityClient({
      region: REGION,
    });
  
    const getIdCommand = new GetIdCommand({
      IdentityPoolId: IDENTITY_POOL_ID,
      Logins: {
        [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: idToken,
      },
    });
  
    try {
      const { IdentityId } = await cognitoIdentityClient.send(getIdCommand);
  
      if (!IdentityId) {
        throw new Error('Failed to get Identity ID');
      }
  
      return {
        identityId: IdentityId,
        token: idToken
      };
    } catch (error) {
      console.error('Error getting credentials:', error);
      throw error;
    }
  };
  
  const handleError = (error: unknown, context: string) => {
    console.error(`${context}:`, error);
    if (error instanceof Error) {
      setError(`${context}: ${error.message}`);
    } else {
      setError(`An unknown error occurred during ${context.toLowerCase()}`);
    }
  };

  if (changePasswordRequired) {
    return (
      <View style={styles.container}>
        <Text h3 style={styles.title}>Change Password</Text>
        <Input
          placeholder="New Password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          accessibilityLabel="New password input"
        />
        <Button 
          title="Set New Password" 
          onPress={() => completeNewPasswordChallenge().catch(error => handleError(error, 'Error setting new password'))}
          disabled={!newPassword}
          accessibilityLabel="Set new password button"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text h3 style={styles.title}>Login</Text>
      <Input
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        accessibilityLabel="Username input"
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Password input"
      />
      <Button 
        title="Sign In" 
        onPress={() => signIn().catch(error => handleError(error, 'Error signing in'))}
        disabled={!username || !password}
        accessibilityLabel="Sign in button"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
});

export default AuthScreen;