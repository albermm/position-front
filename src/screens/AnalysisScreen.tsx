// src/screens/AnalysisScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { LineChart } from 'react-native-chart-kit';
import { useAppContext } from '../context/AppContext';
import { getAnalysisData } from '../utils/api';

const AnalysisScreen = ({ navigation }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const { setIsLoading, setError } = useAppContext();

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const fetchAnalysisData = async () => {
    setIsLoading(true);
    try {
      const data = await getAnalysisData();
      setAnalysisData(data);
    } catch (error) {
      setError('Error fetching analysis data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    if (!analysisData || !analysisData.timeInPositions) return null;

    const data = {
      labels: analysisData.timeInPositions.map((item) => item.position),
      datasets: [
        {
          data: analysisData.timeInPositions.map((item) => item.time),
        },
      ],
    };

    return (
      <LineChart
        data={data}
        width={300}
        height={200}
        yAxisLabel="Time (s)"
        chartConfig={{
          backgroundColor: '#e26a00',
          backgroundGradientFrom: '#fb8c00',
          backgroundGradientTo: '#ffa726',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        bezier
        style={styles.chart}
      />
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text h3 style={styles.title}>Analysis</Text>
      {analysisData && (
        <View>
          <Text h4>Time Spent in Positions</Text>
          {renderChart()}
          <Text h4>Detected Techniques</Text>
          {analysisData.detectedTechniques.map((technique, index) => (
            <Text key={index}>{technique}</Text>
          ))}
          <Text h4>Overall Performance</Text>
          <Text>{analysisData.overallPerformance}</Text>
        </View>
      )}
      <Button
        title="View Recommendations"
        onPress={() => navigation.navigate('Recommendations')}
      />
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default AnalysisScreen;