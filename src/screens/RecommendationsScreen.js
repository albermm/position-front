// src/screens/RecommendationsScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { Text, Button, ListItem } from '@rneui/themed';
import { useAppContext } from '../context/AppContext';
import { getRecommendations } from '../utils/api';

const RecommendationsScreen = () => {
  const [recommendations, setRecommendations] = useState([]);
  const { setIsLoading, setError } = useAppContext();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const data = await getRecommendations();
      setRecommendations(data);
    } catch (error) {
      setError('Error fetching recommendations: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: 'Check out my BJJ training recommendations!',
        // You can add more details or a deep link to your app here
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const renderRecommendationGroup = (group) => (
    <View key={group.category}>
      <Text h4 style={styles.categoryTitle}>{group.category}</Text>
      {group.items.map((item, index) => (
        <ListItem key={index} bottomDivider>
          <ListItem.Content>
            <ListItem.Title>{item.title}</ListItem.Title>
            <ListItem.Subtitle>{item.description}</ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text h3 style={styles.title}>Recommendations</Text>
      {recommendations.map(renderRecommendationGroup)}
      <Button title="Share Recommendations" onPress={handleShare} />
    </ScrollView>
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
  categoryTitle: {
    marginTop: 10,
    marginBottom: 5,
  },
});

export default RecommendationsScreen;