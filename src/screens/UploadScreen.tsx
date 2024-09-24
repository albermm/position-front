// src/screens/UploadScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { launchImageLibrary, ImageLibraryOptions, Asset } from 'react-native-image-picker';
import { useAppContext } from '../context/AppContext';
import axios from 'axios';
import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

const API_URL = 'https://sflkpf7ivf.execute-api.us-east-1.amazonaws.com/testing';
const IDENTITY_POOL_ID = 'us-east-1:fb9b4aa0-5b5d-40fc-97b0-7f51471252e6';
const USER_POOL_ID = 'us-east-1_QJJ74aa1b';
const CLIENT_ID = '6m04urkdq3o76k6gjah9jm99p9';
const REGION = 'us-east-1';

interface Credentials {
  identityId: string;
  token: string;
}

const UploadScreen: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { user, setIsLoading, setError } = useAppContext();

  const getCredentials = async (): Promise<Credentials> => {
    if (!user || !user.cognitoUser) {
      throw new Error('User not authenticated');
    }

    return new Promise((resolve, reject) => {
      (user.cognitoUser as CognitoUser).getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err) {
          reject(err);
          return;
        }

        if (!session) {
          reject(new Error('No session found'));
          return;
        }

        const cognitoIdentityClient = new CognitoIdentityClient({
          credentials: fromCognitoIdentityPool({
            clientConfig: { region: REGION },
            identityPoolId: IDENTITY_POOL_ID,
            logins: {
              [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: session.getIdToken().getJwtToken(),
            },
          }),
        });

        cognitoIdentityClient.config.credentials().then((credentials: any) => {
          if (typeof credentials.identityId === 'string') {
            resolve({
              identityId: credentials.identityId,
              token: session.getIdToken().getJwtToken()
            });
          } else {
            reject(new Error('Invalid credentials format'));
          }
        }).catch(reject);
      });
    });
  };

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
    setCurrentJobId(null);

    try {
      const credentials = await getCredentials();
      console.log('Obtained credentials:', credentials.identityId);
      const mediaType = asset.type?.startsWith('video') ? 'video' : 'image';
      console.log('Requesting upload URL for media type:', mediaType);

      const urlResponse = await axios.get(`${API_URL}/get_upload_url`, {
        params: { 
          user_id: credentials.identityId, 
          file_type: mediaType 
        },
        headers: {
          'Authorization': `Bearer ${credentials.token}`
        }
      });

      console.log('Received upload URL response:', urlResponse.data);

      const { file_name, presigned_post, job_id } = urlResponse.data;

      const actualFileName = file_name;

      const formData = new FormData();
      Object.entries(presigned_post.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      formData.append('file', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: actualFileName,
      } as any);

      console.log(`Uploading file: ${actualFileName}`);

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

      console.log(`File uploaded successfully. File name: ${actualFileName}, Job ID: ${job_id}`);

      setCurrentJobId(job_id);
      if (mediaType === 'video') {
        Alert.alert('Success', 'Video uploaded successfully. Processing may take longer for videos.');
      } else {
        Alert.alert('Success', 'Image uploaded successfully. You can now check the processing status.');
      }
    } catch (error) {
      console.error('Error in uploadMedia:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.data);
        console.error('Axios error status:', error.response?.status);
        console.error('Axios error headers:', error.response?.headers);
      }
      Alert.alert('Error', `Failed to upload media: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text h3 style={styles.title}>Upload Media</Text>
      <Button title="Pick an image or video" onPress={pickMedia} loading={isUploading} />
      {selectedMedia && (
        <Image source={{ uri: selectedMedia }} style={styles.preview} />
      )}
      {currentJobId && (
        <Text>Current Job ID: {currentJobId}</Text>
      )}
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
  preview: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginTop: 20,
  },
});

export default UploadScreen;