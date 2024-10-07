declare module 'react-native-table-component' {
    import { ReactElement } from 'react';
    import { ViewStyle, TextStyle } from 'react-native';
  
    export interface TableProps {
      style?: ViewStyle;
      borderStyle?: ViewStyle;
    }
  
    export interface RowProps {
      data: (string | number | ReactElement)[];
      style?: ViewStyle;
      textStyle?: TextStyle;
    }
  
    export class Table extends React.Component<TableProps> {}
    export class Row extends React.Component<RowProps> {}
  }