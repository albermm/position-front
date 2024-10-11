import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext'; 

type JobStatusScreenRouteProp = RouteProp<RootStackParamList, 'JobStatus'>;
type JobStatusScreenNavigationProp = StackNavigationProp<RootStackParamList, 'JobStatus'>;

type JobStatusScreenProps = {
  route: JobStatusScreenRouteProp;
  navigation: JobStatusScreenNavigationProp;
};

const API_URL = 'https://sflkpf7ivf.execute-api.us-east-1.amazonaws.com/testing';

const JobStatusScreen: React.FC<JobStatusScreenProps> = ({ route, navigation }) => {
  const { jobId, userId } = route.params;
  const [jobStatus, setJobStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const { getCredentials } = useAuth();

  useEffect(() => {
    const checkProcessingStatus = async () => {
      try {
        const credentials = await getCredentials();
        const response = await axios.get(`${API_URL}/get_job_status/${jobId}`, {
          params: { user_id: userId },
          headers: {
            'Authorization': `Bearer ${credentials.token}`
          }
        });
        const { status, progress, file_type, processed_video_s3_path, s3_path } = response.data;
        setJobStatus(status);

        if (status === 'PROCESSING') {
          setProgress(progress || 0);
        } else if (status === 'COMPLETED') {
          setProcessedVideoUrl(processed_video_s3_path);
          navigation.navigate('PositionValidation', { 
            jobId, 
            userId, 
            fileType: file_type,
            processedVideoUrl: processed_video_s3_path
          });
        } else if (status === 'FAILED') {
          Alert.alert('Processing Failed', 'The file processing has failed. Please try uploading again.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error checking processing status:', error);
        Alert.alert('Error', 'Failed to check processing status. Please try again.');
      }
    };

    const intervalId = setInterval(checkProcessingStatus, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [jobId, userId, navigation, getCredentials]);

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>Job Status: {jobStatus}</Text>
      {jobStatus === 'PROCESSING' && (
        <View>
          <Text style={styles.progressText}>Progress: {progress.toFixed(2)}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    marginBottom: 10,
  },
  progressText: {
    fontSize: 16,
    marginBottom: 5,
  },
  progressBar: {
    width: '100%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
});

export default JobStatusScreen;