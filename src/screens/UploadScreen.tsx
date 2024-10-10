import React, { useState } from 'react';
import 'react-native-url-polyfill/auto';
import { View, Button, Image, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { launchImageLibrary, ImageLibraryOptions, Asset } from 'react-native-image-picker';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; 
import 'react-native-get-random-values';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type UploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Upload'>;

const API_URL = 'https://sflkpf7ivf.execute-api.us-east-1.amazonaws.com/testing';

const UploadScreen: React.FC = () => {
  const { getCredentials } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const navigation = useNavigation<UploadScreenNavigationProp>();


  
  const handleUpload = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'mixed' });
      if (result.didCancel) return;

      if (!result.assets || result.assets.length === 0) {
        throw new Error('No file selected');
      }

      const file = result.assets[0];
      setIsUploading(true);

      const credentials = await getCredentials();
      console.log('Obtained credentials:', credentials.identityId);
      const userId = credentials.identityId;
      
      // Get upload URL from backend
      const urlResponse = await axios.get(`${API_URL}/get_upload_url`, {
        params: { 
          file_type: file.type?.startsWith('video') ? 'video' : 'image',
          user_id: userId
        },
        headers: {
          'Authorization': `Bearer ${credentials.token}`
        }
      });
      console.log('Received upload URL response:', urlResponse.data);

      const { presigned_post, file_name, job_id } = urlResponse.data;

      // Prepare form data for upload
      const formData = new FormData();
      Object.entries(presigned_post.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file_name,
      } as any);

      console.log(`Uploading file: ${file_name}`);

      // Upload to S3
      await fetch(presigned_post.url, {
        method: 'POST',
        body: formData,
      });

      // Navigate to JobStatusScreen
      navigation.navigate('JobStatus', { jobId: job_id, userId });
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Media</Text>
      <Button 
        title="Select and Upload Media" 
        onPress={handleUpload} 
        disabled={isUploading} 
      />
      {isUploading && <Text>Uploading...</Text>}
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
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
  


export default UploadScreen;