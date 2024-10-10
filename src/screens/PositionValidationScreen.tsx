import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, ViewStyle } from 'react-native';
import Video, { OnLoadData, OnProgressData, VideoRef } from 'react-native-video';
import Slider from '@react-native-community/slider';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { Table, Row, TableProps } from 'react-native-table-component';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type Position = {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
};

type PositionValidationScreenRouteProp = RouteProp<RootStackParamList, 'PositionValidation'>;
type PositionValidationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PositionValidation'>;

const API_URL = 'https://sflkpf7ivf.execute-api.us-east-1.amazonaws.com/testing';

const PositionValidationScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'PositionValidation'>>();
  const { jobId, fileType, userId, s3Path, processingEndTime, videoUrl, positions: initialPositions } = route.params;
  const navigation = useNavigation<PositionValidationScreenNavigationProp>();
  const { getCredentials } = useAuth();

  const [mediaUrl, setMediaUrl] = useState<string | null>(videoUrl || null);
  const [positions, setPositions] = useState<Position[]>(initialPositions || []);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<VideoRef>(null);

  const fetchProcessedData = async () => {
    console.log('Fetching processed data...');
    setIsLoading(true);
    setError(null);
    try {
      const credentials = await getCredentials();
      const response = await axios.get(`${API_URL}/get_processed_data`, {
        params: { 
          user_id: userId,
          job_id: jobId,
          s3_path: s3Path
        },
        headers: {
          'Authorization': `Bearer ${credentials.token}`
        }
      });
      console.log('API response:', response.data);
      const { video_url, positions } = response.data;

      console.log('Setting mediaUrl:', video_url);
      setMediaUrl(video_url);
      console.log('Setting positions:', positions);
      setPositions(positions);
    } catch (error) {
      console.error('Error fetching processed data:', error);
      setError('Failed to fetch processed data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('PositionValidationScreen mounted');
    fetchProcessedData();
  }, []);



  const handleSliderChange = (value: number) => {
    setCurrentTime(value);
    if (videoRef.current) {
      videoRef.current.seek(value);
    }
    updateCurrentPosition(value);
  };

  const updateCurrentPosition = (time: number) => {
    const position = positions.find(p => time >= p.startTime && time <= p.endTime);
    setCurrentPosition(position || null);
  };

  const handleEditPosition = (position: Position) => {
    navigation.navigate('SearchPosition', {
      position,
      onUpdate: (updatedPosition: Position) => {
        const updatedPositions = positions.map(p => 
          p.id === updatedPosition.id ? updatedPosition : p
        );
        setPositions(updatedPositions);
        updateBackend(updatedPosition);
      }
    });
  };

  const updateBackend = async (updatedPosition: Position) => {
    try {
      await axios.post(`${API_URL}/update_position`, {
        jobId,
        userId,
        positionId: updatedPosition.id,
        newName: updatedPosition.name,
      });
      Alert.alert('Success', 'Position updated successfully');
    } catch (error) {
      console.error('Error updating position:', error);
      Alert.alert('Error', 'Failed to update position. Please try again.');
    }
  };

  const renderPositionMarkers = () => {
    return positions.map((position, index) => (
      <View
        key={index}
        style={[
          styles.positionMarker,
          {
            left: `${(position.startTime / duration) * 100}%`,
            width: `${((position.endTime - position.startTime) / duration) * 100}%`,
          },
        ]}
      />
    ));
  };

  const renderPositionTable = () => {
    const tableHead = ['Position', 'Start Time', 'End Time', 'Duration', 'Edit'];
    const tableData = positions.map(position => [
      position.name,
      position.startTime.toFixed(2),
      position.endTime.toFixed(2),
      position.duration.toFixed(2),
      <TouchableOpacity key={position.id} onPress={() => handleEditPosition(position)}>
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    ]);

    const tableProps: TableProps = {
      borderStyle: {borderWidth: 1, borderColor: '#C1C0B9'}
    };

    return (
      <Table {...tableProps}>
        <Row data={tableHead} style={styles.head as ViewStyle} textStyle={styles.text}/>
        {
          tableData.map((rowData, index) => (
            <Row
              key={index}
              data={rowData}
              style={[styles.row, index % 2 ? {backgroundColor: '#F7F6E7'} : {}] as ViewStyle}
              textStyle={styles.text}
            />
          ))
        }
      </Table>
    );
  };

  const handleVideoError = (e: {
    error: {
      errorString?: string;
      errorCode?: string;
      error?: string;
      code?: number;
      domain?: string;
    };
  }) => {
    console.error('Video playback error:', e.error);
    setError(`Error playing video: ${e.error.errorString || e.error.error || 'Unknown error'}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchProcessedData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('Rendering main content');
  console.log('fileType:', fileType);
  console.log('mediaUrl:', mediaUrl);

  return (
    <ScrollView style={styles.container}>
      {fileType === 'video' && mediaUrl ? (
        <View>
          <Video
            ref={videoRef}
            source={{ uri: mediaUrl }}
            style={styles.media}
            resizeMode="contain"
            onLoad={(data: OnLoadData) => {
              console.log('Video loaded. Duration:', data.duration);
              setDuration(data.duration);
            }}
            onProgress={(data: OnProgressData) => setCurrentTime(data.currentTime)}
            onError={(e) => {
              console.error('Video error:', e);
              setError(`Error playing video: ${e.error.errorString || e.error.error || 'Unknown error'}`);
            }}
            paused={!isPlaying}
          />
          <View style={styles.videoControls}>
            <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)}>
              <Text>{isPlaying ? 'Pause' : 'Play'}</Text>
            </TouchableOpacity>
            <View style={styles.sliderContainer}>
              {renderPositionMarkers()}
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={currentTime}
                onValueChange={handleSliderChange}
              />
            </View>
          </View>
        </View>
      ) : (
        <Text>No video available</Text>
      )}

      <View style={styles.positionInfo}>
        <Text style={styles.positionTitle}>Current Position:</Text>
        <Text style={styles.positionName}>{currentPosition?.name || 'Unknown'}</Text>
      </View>

      <View style={styles.positionList}>
        <Text style={styles.positionListTitle}>Detected Positions:</Text>
        {positions.length > 0 ? renderPositionTable() : <Text>No positions detected</Text>}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  media: {
    width: '100%',
    height: 200,
  },
  videoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  sliderContainer: {
    flex: 1,
    marginLeft: 10,
  },
  slider: {
    width: '100%',
  },
  positionMarker: {
    position: 'absolute',
    height: 5,
    backgroundColor: 'red',
    opacity: 0.5,
  },
  positionInfo: {
    marginTop: 20,
  },
  positionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positionName: {
    fontSize: 16,
    marginTop: 5,
  },
  positionList: {
    marginTop: 20,
  },
  positionListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  head: { 
    height: 40, 
    backgroundColor: '#f1f8ff' 
  },
  text: { 
    margin: 6 
  },
  row: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF1C1' 
  },
  editButtonText: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PositionValidationScreen;