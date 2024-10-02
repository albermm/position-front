import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from '../screens/AuthScreen';
import UploadScreen from '../screens/UploadScreen';
import PositionValidationScreen from '../screens/PositionValidationScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';

export type RootStackParamList = {
  Auth: undefined;
  Upload: undefined;
  PositionValidation: { jobId: string; userId: string; fileType: string };
  Recommendations: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen name="Upload" component={UploadScreen} />
        <Stack.Screen name="PositionValidation" component={PositionValidationScreen} />
        <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;