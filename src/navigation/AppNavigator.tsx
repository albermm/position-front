// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import AuthScreen from '../screens/AuthScreen';
import UploadScreen from '../screens/UploadScreen';
import PositionValidationScreen from '../screens/PositionValidationScreen';
//import AnalysisScreen from '../screens/AnalysisScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';

// Define the type for the navigation parameters
export type RootStackParamList = {
  Auth: undefined;
  Upload: undefined;
  PositionValidation: undefined;
  Analysis: undefined;
  Recommendations: undefined;
};

// Create a type for the navigation prop
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

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
