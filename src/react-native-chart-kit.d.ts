declare module 'react-native-chart-kit' {
    import { ViewStyle } from 'react-native';
    import React from 'react';
  
    export interface ChartConfig {
      backgroundColor?: string;
      backgroundGradientFrom?: string;
      backgroundGradientTo?: string;
      color?: (opacity: number) => string;
      strokeWidth?: number;
      barPercentage?: number;
      useShadowColorFromDataset?: boolean;
      // Add other properties as needed
    }
  
    export interface ChartData {
      labels: string[];
      datasets: {
        data: number[];
        color?: string | ((opacity: number) => string);
        strokeWidth?: number;
      }[];
    }
  
    export interface BarChartProps {
      data: ChartData;
      width: number;
      height: number;
      yAxisLabel?: string;
      yAxisSuffix?: string;
      chartConfig: ChartConfig;
      style?: ViewStyle;
      // Add other properties as needed
    }
  
    export class BarChart extends React.Component<BarChartProps> {}
  
    // Add other chart types as needed
  }