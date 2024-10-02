import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert, Button, Text } from 'react-native';
import { launchImageLibrary, ImageLibraryOptions, Asset } from 'react-native-image-picker';
import Video from 'react-native-video';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://sflkpf7ivf.execute-api.us-east-1.amazonaws.com/testing';

type UploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Upload'>;

const UploadScreen: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ mediaUrl: string; positionName: string; mediaType: 'image' | 'video' } | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const navigation = useNavigation<UploadScreenNavigationProp>();
  const { getCredentials, signOut } = useAuth();

  const pickMedia = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'mixed',
      includeBase64: false,
    };

    try {
      const response = await launchImageLibrary(options);
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.uri) {
          setSelectedMedia(asset.uri);
          await uploadMedia(asset);
        }
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const uploadMedia = async (asset: Asset) => {
    if (!asset.uri) return;
    setIsUploading(true);
    setResult(null);
    setCurrentJobId(null);

    try {
      const credentials = await getCredentials();
      const mediaType = asset.type?.startsWith('video') ? 'video' : 'image';

      const urlResponse = await axios.get(`${API_URL}/get_upload_url`, {
        params: { 
          user_id: credentials.identityId, 
          file_type: mediaType 
        },
        headers: {
          'Authorization': `Bearer ${credentials.token}`
        }
      });

      const { file_name, presigned_post, job_id } = urlResponse.data;

      const formData = new FormData();
      Object.entries(presigned_post.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      formData.append('file', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: file_name,
      } as any);

      const uploadResponse = await fetch(presigned_post.url, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      setCurrentJobId(job_id);
      if (mediaType === 'video') {
        Alert.alert('Success', 'Video uploaded successfully. Processing may take longer for videos.');
      } else {
        Alert.alert('Success', 'Image uploaded successfully. You can now check the processing status.');
      }
    } catch (error) {
      console.error('Error in uploadMedia:', error);
      Alert.alert('Error', `Failed to upload media: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const checkProcessingStatus = async () => {
    if (!currentJobId) {
      Alert.alert('Error', 'No job in progress. Please upload an image or video first.');
      return;
    }

    try {
      const credentials = await getCredentials();
      const response = await axios.get(`${API_URL}/get_job_status/${currentJobId}`, {
        params: { user_id: credentials.identityId },
        headers: {
          'Authorization': `Bearer ${credentials.token}`
        }
      });

      const { status, image_url, video_url, position, file_type } = response.data;

      if (status === 'COMPLETED') {
        setResult({
          mediaUrl: file_type === 'image' ? image_url : video_url,
          positionName: position,
          mediaType: file_type as 'image' | 'video'
        });
        Alert.alert('Processing Complete', `Your ${file_type} has been processed. The detected position is: ${position}`);
      } else if (status === 'PROCESSING') {
        Alert.alert('In Progress', 'Your media is still being processed. Please check again later.');
      } else if (status === 'FAILED') {
        Alert.alert('Error', 'Media processing failed. Please try uploading again.');
      } else {
        Alert.alert('Unknown Status', `Current status: ${status}. Please try again later.`);
      }
    } catch (error) {
      console.error('Error checking processing status:', error);
      Alert.alert('Error', 'Failed to check processing status. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image or video" onPress={pickMedia} />
      <Button title="Sign Out" onPress={signOut} />
      {isUploading && <Text>Uploading...</Text>}
      {currentJobId && <Button title="Check Processing Status" onPress={checkProcessingStatus} />}
      {selectedMedia && (
        <Image source={{ uri: selectedMedia }} style={styles.media} />
      )}
      {result && (
        <View>
          <Text style={styles.result}>Predicted Position: {result.positionName}</Text>
          {result.mediaType === 'image' ? (
            <Image source={{ uri: result.mediaUrl }} style={styles.media} />
          ) : (
            <Video 
              source={{ uri: result.mediaUrl }} 
              style={styles.media}
              controls={true}
              resizeMode="contain"
            />
          )}
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
  media: {
    width: 300,
    height: 300,
    marginTop: 20,
  },
  result: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UploadScreen;