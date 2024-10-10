import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from '../screens/AuthScreen';
import UploadScreen from '../screens/UploadScreen';
import JobStatusScreen from '../screens/JobStatusScreen';
import PositionValidationScreen from '../screens/PositionValidationScreen';
import SearchPositionScreen from '../screens/SearchPositionScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import { useAuth } from '../context/AuthContext';

export type Position = {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
};

export type RootStackParamList = {
  Auth: undefined;
  Upload: undefined;
  JobStatus: { jobId: string; userId: string };
  PositionValidation: { 
    jobId: string; 
    userId: string; 
    fileType: string;
    videoUrl?: string;
    positions?: Position[];
    s3Path?: string;
    processingEndTime?: string;
  };
  SearchPosition: {
    position: Position;
    onUpdate: (updatedPosition: Position) => void;
  };
  Analysis: { userId: string; jobId: string };
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
            <Stack.Screen name="JobStatus" component={JobStatusScreen} />
            <Stack.Screen name="PositionValidation" component={PositionValidationScreen} />
            <Stack.Screen name="SearchPosition" component={SearchPositionScreen} />
            <Stack.Screen name="Analysis" component={AnalysisScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;