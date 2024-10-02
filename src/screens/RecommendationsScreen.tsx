import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { BarChart, ChartConfig } from 'react-native-chart-kit';
import axios from 'axios';
import { CognitoUserPool, CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';

const API_ENDPOINT = 'https://sflkpf7ivf.execute-api.us-east-1.amazonaws.com/testing/get_job_status';
const USER_POOL_ID = 'us-east-1_QJJ74aa1b';
const CLIENT_ID = '6m04urkdq3o76k6gjah9jm99p9';

interface PositionData {
  position: string;
  count: number;
  total_duration: number;
}

interface ApiResponse {
  recent: PositionData[];
  total: PositionData[];
}

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
});

const RecommendationsScreen: React.FC = () => {
  const [recentData, setRecentData] = useState<PositionData[]>([]);
  const [totalData, setTotalData] = useState<PositionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPositionData();
  }, []);

  const getAuthToken = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser != null) {
        cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
          if (err) {
            reject(err);
          } else if (session) {
            resolve(session.getIdToken().getJwtToken());
          } else {
            reject(new Error('No valid session'));
          }
        });
      } else {
        reject(new Error('No current user'));
      }
    });
  };

  const fetchPositionData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const cognitoUser = userPool.getCurrentUser();
      
      if (!cognitoUser) {
        throw new Error('No authenticated user');
      }

      const userId = cognitoUser.getUsername();

      // This call will trigger the Lambda function to fetch the latest job ID and position data
      const response = await axios.get(`${API_ENDPOINT}/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && response.data.position_data) {
        const positionData: ApiResponse = response.data.position_data;
        setRecentData(positionData.recent);
        setTotalData(positionData.total);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error fetching position data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (data: PositionData[], title: string) => {
    const chartConfig: ChartConfig = {
      backgroundGradientFrom: '#fb8c00',
      backgroundGradientTo: '#ffa726',
      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      strokeWidth: 2,
      barPercentage: 0.5,
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <BarChart
          data={{
            labels: data.map(item => item.position),
            datasets: [{
              data: data.map(item => item.count)
            }]
          }}
          width={300}
          height={220}
          yAxisLabel=""
          chartConfig={chartConfig}
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text style={styles.errorText}>Error: {error}</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      {renderChart(recentData, 'Recent Video Positions')}
      {renderChart(totalData, 'All-Time Positions')}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default RecommendationsScreen;