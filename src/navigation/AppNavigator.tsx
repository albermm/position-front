import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from '../screens/AuthScreen';
import UploadScreen from '../screens/UploadScreen';
import PositionValidationScreen from '../screens/PositionValidationScreen';
import SearchPositionScreen from '../screens/SearchPositionScreen';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Auth: undefined;
  Upload: undefined;
  PositionValidation: { jobId: string; fileType: 'image' | 'video'; userId: string };
  SearchPosition: { 
    position: { 
      id: string; 
      name: string; 
      startTime: number; 
      endTime: number; 
      duration: number; 
    }; 
    onUpdate: (updatedPosition: { 
      id: string; 
      name: string; 
      startTime: number; 
      endTime: number; 
      duration: number; 
    }) => void; 
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Upload" component={UploadScreen} />
            <Stack.Screen name="PositionValidation" component={PositionValidationScreen} />
            <Stack.Screen name="SearchPosition" component={SearchPositionScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;