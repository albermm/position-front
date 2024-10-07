import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';

type RootStackParamList = {
  SearchPosition: {
    position: Position;
    onUpdate: (updatedPosition: Position) => void;
  };
  PositionValidation: { jobId: string; fileType: 'image' | 'video'; userId: string };
};

type SearchPositionScreenRouteProp = RouteProp<RootStackParamList, 'SearchPosition'>;
type SearchPositionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SearchPosition'>;

type Position = {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
};

const API_URL = 'https://sflkpf7ivf.execute-api.us-east-1.amazonaws.com/testing';

const SearchPosition: React.FC = () => {
  const route = useRoute<SearchPositionScreenRouteProp>();
  const navigation = useNavigation<SearchPositionScreenNavigationProp>();
  const { position, onUpdate } = route.params;

  const [searchTerm, setSearchTerm] = useState('');
  const [positions, setPositions] = useState<string[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<string[]>([]);

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    const filtered = positions.filter(pos => 
      pos.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPositions(filtered);
  }, [searchTerm, positions]);

  const fetchPositions = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_positions`);
      setPositions(response.data.positions);
    } catch (error) {
      console.error('Error fetching positions:', error);
      Alert.alert('Error', 'Failed to fetch positions. Please try again.');
    }
  };

  const handleSelectPosition = (newName: string) => {
    const updatedPosition = { ...position, name: newName };
    onUpdate(updatedPosition);
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleSelectPosition(item)}>
      <Text>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Position</Text>
      <TextInput
        style={styles.input}
        placeholder="Search for a position"
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <FlatList
        data={filteredPositions}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  list: {
    flex: 1,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default SearchPosition;