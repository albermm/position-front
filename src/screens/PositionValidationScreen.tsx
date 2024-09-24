import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import Slider from '@react-native-community/slider';
import { useRoute, RouteProp } from '@react-navigation/native';
import axios from 'axios';

type RouteParams = {
  jobId: string;
  fileType: 'image' | 'video';
  userId: string;
};

type Position = {
  id: string;
  name: string;
  startTime?: number;
  endTime?: number;
};

const API_URL = 'https://sflkpf7ivf.execute-api.us-east-1.amazonaws.com/testing';

const PositionValidationScreen = () => {
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { jobId, fileType, userId } = route.params;

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const videoRef = useRef<VideoRef>(null);

  useEffect(() => {
    fetchProcessedData();
  }, []);

  const fetchProcessedData = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_job_status/${jobId}?user_id=${userId}`);
      const { status, image_url, video_url, positions } = response.data;

      if (status === 'COMPLETED') {
        setMediaUrl(fileType === 'image' ? image_url : video_url);
        setPositions(positions);
      } else {
        Alert.alert('Error', 'Processing not completed yet. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching processed data:', error);
      Alert.alert('Error', 'Failed to fetch processed data. Please try again.');
    }
  };

  const handleSliderChange = (value: number) => {
    setCurrentTime(value);
    if (videoRef.current) {
      videoRef.current.seek(value);
    }
    updateCurrentPosition(value);
  };


  const updateCurrentPosition = (time: number) => {
    const position = positions.find(p => time >= (p.startTime || 0) && time <= (p.endTime || duration));
    setCurrentPosition(position || null);
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
  };

  const handleSavePosition = async () => {
    if (!editingPosition) return;

    try {
      await axios.post(`${API_URL}/update_position`, {
        jobId,
        userId,
        positionId: editingPosition.id,
        newName: editingPosition.name,
      });

      setPositions(positions.map(p => p.id === editingPosition.id ? editingPosition : p));
      setEditingPosition(null);
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
            left: `${((position.startTime || 0) / duration) * 100}%`,
            width: `${(((position.endTime || duration) - (position.startTime || 0)) / duration) * 100}%`,
          },
        ]}
      />
    ));
  };

  return (
    <ScrollView style={styles.container}>
      {/* ... (other JSX remains the same) */}
      {fileType === 'video' && mediaUrl && (
        <View>
          <Video
            ref={videoRef}
            source={{ uri: mediaUrl }}
            style={styles.media}
            resizeMode="contain"
            onLoad={(data) => setDuration(data.duration)}
            onProgress={(data) => setCurrentTime(data.currentTime)}
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
      )}

      <View style={styles.positionInfo}>
        <Text style={styles.positionTitle}>Current Position:</Text>
        <Text style={styles.positionName}>{currentPosition?.name || 'Unknown'}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => currentPosition && handleEditPosition(currentPosition)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {editingPosition && (
        <View style={styles.editForm}>
          <TextInput
            style={styles.input}
            value={editingPosition.name}
            onChangeText={(text) => setEditingPosition({ ...editingPosition, name: text })}
            placeholder="Enter new position name"
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSavePosition}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.positionList}>
        <Text style={styles.positionListTitle}>All Detected Positions:</Text>
        {positions.map((position, index) => (
          <View key={index} style={styles.positionItem}>
            <Text>{position.name}</Text>
            {fileType === 'video' && (
              <Text>
                {`${position.startTime?.toFixed(2)}s - ${position.endTime?.toFixed(2)}s`}
              </Text>
            )}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditPosition(position)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  media: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  videoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    top: 10,
  },
  positionInfo: {
    marginBottom: 20,
  },
  positionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positionName: {
    fontSize: 16,
    marginTop: 5,
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  editButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  editForm: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#4CD964',
    padding: 10,
    borderRadius: 5,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  positionList: {
    marginTop: 20,
  },
  positionListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  positionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
});

export default PositionValidationScreen;