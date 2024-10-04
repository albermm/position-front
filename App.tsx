import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import axios from 'axios';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext'; // Import AppProvider

import AuthScreen from './src/screens/AuthScreen';
import UploadScreen from './src/screens/UploadScreen';
import PositionValidationScreen from './src/screens/PositionValidationScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';

type RootStackParamList = {
  Auth: undefined;
  Upload: { setUserId: (id: string) => void; setJobId: (id: string) => void };
  PositionValidation: { jobId: string; userId: string; fileType: string };
  Analysis: { userId: string; jobId: string };
};

const Stack = createStackNavigator<RootStackParamList>();
const API_URL = 'https://sflkpf7ivf.execute-api.us-east-1.amazonaws.com/testing';

const AppContent = () => {
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    if (jobId && userId) {
      const intervalId = setInterval(checkJobStatus, 5000);
      return () => clearInterval(intervalId);
    }
  }, [jobId, userId]);

  const checkJobStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_job_status/${jobId}?user_id=${userId}`);
      setJobStatus(response.data.status);

      if (response.data.status === 'COMPLETED') {
        navigateToPositionValidation(jobId!, userId!, response.data.file_type);
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  };

  const navigateToPositionValidation = (jobId: string, userId: string, fileType: string) => {
    navigationRef.current?.navigate('PositionValidation', {
      jobId,
      userId,
      fileType
    });
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen}
          options={{ headerShown: false }}
        />        
        <Stack.Screen 
          name="Upload" 
          component={UploadScreen} 
          initialParams={{ setUserId, setJobId }}
        />
        <Stack.Screen 
          name="PositionValidation" 
          component={PositionValidationScreen} 
        />
        <Stack.Screen 
          name="Analysis" 
          component={AnalysisScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppProvider>
  );
};

export default App;