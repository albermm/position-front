// src/screens/AuthScreen.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Input, Button, Text } from '@rneui/themed';
import { useAppContext } from '../context/AppContext';
import { signIn, signUp } from '../utils/api';

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setUser, setIsLoading, setError } = useAppContext();

  const handleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authFunction = isLogin ? signIn : signUp;
      const user = await authFunction(username, password);
      setUser(user);
      navigation.replace('Upload');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text h3 style={styles.title}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      <Input
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={isLogin ? 'Login' : 'Sign Up'} onPress={handleAuth} />
      <Button
        title={`Switch to ${isLogin ? 'Sign Up' : 'Login'}`}
        type="clear"
        onPress={() => setIsLogin(!isLogin)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default AuthScreen;