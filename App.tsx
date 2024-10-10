import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext'; 
import AuthScreen from './src/screens/AuthScreen';
import UploadScreen from './src/screens/UploadScreen';
import JobStatusScreen from './src/screens/JobStatusScreen';
import PositionValidationScreen from './src/screens/PositionValidationScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';

export type RootStackParamList = {
  Auth: undefined;
  Upload: undefined;
  JobStatus: { jobId: string; userId: string };
  PositionValidation: { jobId: string; userId: string; fileType: string };
  Analysis: { userId: string; jobId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen name="Upload" component={UploadScreen} />
            <Stack.Screen name="JobStatus" component={JobStatusScreen} />
            <Stack.Screen name="PositionValidation" component={PositionValidationScreen} />
            <Stack.Screen name="Analysis" component={AnalysisScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppProvider>
  );
};

export default App;