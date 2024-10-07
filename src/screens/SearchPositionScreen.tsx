import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';

type RouteParams = {
  position: {
    id: string;
    name: string;
    startTime: number;
    endTime: number;
    duration: number;
  };
  onUpdate: (updatedPosition: {
    id: string;
    name: string;
    startTime: number;
    endTime: number;
    duration: number;
  }) => void;
};

const allPositions = [
  'Guard', 'Half Guard', 'Side Control', 'Mount', 'Back Control',
  'North-South', 'Turtle', 'Knee on Belly', 'X-Guard', 'Butterfly Guard',
  'De La Riva Guard', 'Spider Guard', 'Lasso Guard', 'Rubber Guard',
  'Closed Guard', 'Open Guard', 'Deep Half Guard', 'Inverted Guard',
  'Single Leg X', 'Reverse De La Riva', '50/50', 'Berimbolo',
  'Crucifix', 'Truck', 'Twister', 'Crab Ride', 'Lapel Guard',
  'Worm Guard', 'Sitting Guard', 'Donkey Guard', 'Lockdown'
];

const SearchPositionScreen = () => {
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { position, onUpdate } = route.params;
  const navigation = useNavigation();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPositions, setFilteredPositions] = useState(allPositions);

  useEffect(() => {
    const filtered = allPositions.filter(pos => 
      pos.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPositions(filtered);
  }, [searchTerm]);

  const handlePositionSelect = (newPosition: string) => {
    const updatedPosition = {
      ...position,
      name: newPosition
    };
    onUpdate(updatedPosition);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search positions..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <FlatList
        data={filteredPositions}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.positionItem}
            onPress={() => handlePositionSelect(item)}
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  positionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default SearchPositionScreen;