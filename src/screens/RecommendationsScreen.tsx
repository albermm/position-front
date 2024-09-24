import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import axios from 'axios';

type PositionData = {
  position: string;
  count: number;
  total_duration: number;
};

type AnalyticsData = {
  recent: PositionData[];
  total: PositionData[];
};

const RecommendationsScreen = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPositionData();
  }, []);

  const fetchPositionData = async () => {
    try {
      const response = await axios.post('YOUR_API_GATEWAY_ENDPOINT', {
        user_id: 'USER_ID',  // Replace with actual user ID
        job_id: 'RECENT_JOB_ID'  // Replace with the ID of the recently processed video
      });
      setAnalyticsData(response.data.body);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching position data:', error);
      setLoading(false);
    }
  };

  const renderBarChart = (data: PositionData[], title: string) => {
    const chartData = {
      labels: data.map(item => item.position),
      datasets: [{
        data: data.map(item => item.count)
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <BarChart
          data={chartData}
          width={300}
          height={220}
          yAxisLabel=""
          chartConfig={{
            backgroundColor: '#e26a00',
            backgroundGradientFrom: '#fb8c00',
            backgroundGradientTo: '#ffa726',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#ffa726"
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
      </View>
    );
  };

  const renderPositionList = (data: PositionData[], title: string) => (
    <View style={styles.listContainer}>
      <Text style={styles.listTitle}>{title}</Text>
      {data.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={styles.position}>{item.position}</Text>
          <Text>Count: {item.count}</Text>
          <Text>Total Duration: {(item.total_duration / 60).toFixed(2)} minutes</Text>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View style={styles.container}>
        <Text>No data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Position Analytics</Text>
      
      {renderBarChart(analyticsData.recent, "Recent Video Positions")}
      {renderPositionList(analyticsData.recent, "Recent Video Positions")}
      
      {renderBarChart(analyticsData.total, "All-Time Positions")}
      {renderPositionList(analyticsData.total, "All-Time Positions")}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listContainer: {
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  position: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecommendationsScreen;