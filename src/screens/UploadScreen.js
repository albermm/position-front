// src/screens/UploadScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAppContext } from '../context/AppContext';
import { uploadMedia } from '../utils/api';

const UploadScreen = ({ navigation }) => {
  const [mediaUri, setMediaUri] = useState(null);
  const { setIsLoading, setError } = useAppContext();

  const handleMediaPick = async (type) => {
    const options = {
      mediaType: type,
      quality: 1,
    };

    try {
      const result = type === 'photo' 
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (result.assets && result.assets.length > 0) {
        setMediaUri(result.assets[0].uri);
      }
    } catch (error) {
      setError('Error picking media: ' + error.message);
    }
  };

  const handleUpload = async () => {
    if (!mediaUri) return;

    setIsLoading(true);
    setError(null);

    try {
      await uploadMedia(mediaUri);
      navigation.navigate('PositionValidation');
    } catch (error) {
      setError('Error uploading media: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text h3 style={styles.title}>Upload Media</Text>
      <Button title="Take Photo" onPress={() => handleMediaPick('photo')} />
      <Button title="Record Video" onPress={() => handleMediaPick('video')} />
      <Button title="Choose from Library" onPress={() => handleMediaPick('mixed')} />
      {mediaUri && (
        <>
          <Image source={{ uri: mediaUri }} style={styles.preview} />
          <Button title="Upload" onPress={handleUpload} />
        </>
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
    marginVertical: 20,
  },
});

export default UploadScreen;