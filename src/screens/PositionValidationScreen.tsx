import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, ViewStyle, Switch } from 'react-native';
import Video, { OnLoadData, OnProgressData, VideoRef } from 'react-native-video';
import Slider from '@react-native-community/slider';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { Table, Row, TableProps } from 'react-native-table-component';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type Position = {
  player_id: string;
  name: string;
  start_time: number;
  end_time: number;
  duration: number;
  video_timestamp: number;
};

type PositionValidationScreenRouteProp = RouteProp<RootStackParamList, 'PositionValidation'>;
type PositionValidationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PositionValidation'>;

const API_URL = 'https://sflkpf7ivf.execute-api.us-east-1.amazonaws.com/testing';

const PositionValidationScreen: React.FC = () => {
  const route = useRoute<PositionValidationScreenRouteProp>();
  const { jobId, fileType, userId } = route.params;
  const navigation = useNavigation<PositionValidationScreenNavigationProp>();
  const { getCredentials } = useAuth();

  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlayer1, setShowPlayer1] = useState(true);
  const [showPlayer2, setShowPlayer2] = useState(true);
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
          job_id: jobId
        },
        headers: {
          'Authorization': `Bearer ${credentials.token}`
        }
      });
      console.log('API response:', response.data);
      const { video_url, positions } = response.data;

      console.log('Setting processedVideoUrl:', video_url);
      setProcessedVideoUrl(video_url);
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
  };

  const handleEditPosition = (position: Position) => {
    navigation.navigate('SearchPosition', {
      position,
      onUpdate: (updatedPosition: Position) => {
        const updatedPositions = positions.map(p => 
          p.player_id === updatedPosition.player_id && p.start_time === updatedPosition.start_time
            ? updatedPosition : p
        );
        setPositions(updatedPositions);
        updateBackend(updatedPosition);
      }
    });
  };

  const updateBackend = async (updatedPosition: Position) => {
    try {
      const credentials = await getCredentials();
      await axios.post(`${API_URL}/update_position`, {
        job_id: jobId,
        user_id: userId,
        position_id: `${updatedPosition.player_id}-${updatedPosition.start_time}`,
        new_name: updatedPosition.name
      }, {
        headers: {
          'Authorization': `Bearer ${credentials.token}`
        }
      });
      Alert.alert('Success', 'Position updated successfully');
    } catch (error) {
      console.error('Error updating position:', error);
      Alert.alert('Error', 'Failed to update position. Please try again.');
    }
  };

  const renderPositionMarkers = () => {
    return positions
      .filter(p => (p.player_id === '1' && showPlayer1) || (p.player_id === '2' && showPlayer2))
      .map((position, index) => (
        <View
          key={`${position.player_id}-${position.start_time}`}
          style={[
            styles.positionMarker,
            {
              left: `${(position.start_time / duration) * 100}%`,
              width: `${((position.end_time - position.start_time) / duration) * 100}%`,
              backgroundColor: position.player_id === '1' ? 'red' : 'blue',
            },
          ]}
        />
      ));
  };

  const renderPositionTable = () => {
    const tableHead = ['Player', 'Position', 'Start Time', 'End Time', 'Duration', 'Edit'];
    const tableData = positions
      .filter(p => (p.player_id === '1' && showPlayer1) || (p.player_id === '2' && showPlayer2))
      .map(position => [
        position.player_id,
        position.name,
        position.start_time.toFixed(2),
        position.end_time.toFixed(2),
        position.duration.toFixed(2),
        <TouchableOpacity key={`${position.player_id}-${position.start_time}`} onPress={() => handleEditPosition(position)}>
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
              style={[
                styles.row,
                { backgroundColor: rowData[0] === '1' ? '#FFE8E8' : '#E8E8FF' }
              ] as ViewStyle}
              textStyle={styles.text}
            />
          ))
        }
      </Table>
    );
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

  return (
    <ScrollView style={styles.container}>
      {fileType === 'video' && processedVideoUrl ? (
        <View>
          <Video
            ref={videoRef}
            source={{ uri: processedVideoUrl }}
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

      <View style={styles.filterContainer}>
        <View style={styles.filterItem}>
          <Text>Player 1</Text>
          <Switch value={showPlayer1} onValueChange={setShowPlayer1} />
        </View>
        <View style={styles.filterItem}>
          <Text>Player 2</Text>
          <Switch value={showPlayer2} onValueChange={setShowPlayer2} />
        </View>
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