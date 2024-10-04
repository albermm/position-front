import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input, Button, Text } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Config from '../config';

type RootStackParamList = {
  Auth: undefined;
  Upload: undefined;
};

type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

const AuthScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordRequired, setChangePasswordRequired] = useState(false);

  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { setUser, setIsLoading, setError } = useAppContext();
  const { signIn, completeNewPasswordChallenge, checkAuthState } = useAuth();

  useEffect(() => {
    checkAuthState();
  }, []);

  const handleSignIn = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(username, password);
      setUser({ id: username, username });
      navigation.navigate('Upload');
    } catch (error) {
      handleError(error, 'Error signing in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPasswordChallenge = async () => {
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    setIsLoading(true);
    try {
      await completeNewPasswordChallenge(newPassword);
      setUser({ id: username, username });
      navigation.navigate('Upload');
    } catch (error) {
      handleError(error, 'Error changing password');
    } finally {
      setIsLoading(false);
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
          onPress={() => handleNewPasswordChallenge()}
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
        onPress={handleSignIn}
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