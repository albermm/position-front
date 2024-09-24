// src/screens/PositionValidationScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button, Slider, SearchBar } from '@rneui/themed';
import { useAppContext } from '../context/AppContext';
import { getDetectedPositions, updatePositions } from '../utils/api';

const PositionValidationScreen = ({ navigation }) => {
  const [positions, setPositions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { setIsLoading, setError } = useAppContext();

  useEffect(() => {
    fetchDetectedPositions();
  }, []);

  const fetchDetectedPositions = async () => {
    setIsLoading(true);
    try {
      const detectedPositions = await getDetectedPositions();
      setPositions(detectedPositions);
    } catch (error) {
      setError('Error fetching positions: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfidenceChange = (index, value) => {
    const updatedPositions = [...positions];
    updatedPositions[index].confidence = value;
    setPositions(updatedPositions);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Implement search functionality here
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updatePositions(positions);
      navigation.navigate('Analysis');
    } catch (error) {
      setError('Error updating positions: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPositionItem = ({ item, index }) => (
    <View style={styles.positionItem}>
      <Text>{item.name}</Text>
      <Slider
        value={item.confidence}
        onValueChange={(value) => handleConfidenceChange(index, value)}
        minimumValue={0}
        maximumValue={1}
        step={0.1}
      />
      <Text>{`Confidence: ${(item.confidence * 100).toFixed(0)}%`}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text h3 style={styles.title}>Validate Positions</Text>
      <SearchBar
        placeholder="Search positions..."
        onChangeText={handleSearch}
        value={searchQuery}
      />
      <FlatList
        data={positions}
        renderItem={renderPositionItem}
        keyExtractor={(item) => item.id.toString()}
      />
      <Button title="Save and Continue" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  positionItem: {
    marginBottom: 20,
  },
});

export default PositionValidationScreen;