declare module 'react-native-table-component' {
  import { ReactElement, ReactNode } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  export interface TableProps {
    style?: ViewStyle;
    borderStyle?: ViewStyle;
    children?: ReactNode;
  }

  export interface RowProps {
    data: (string | number | ReactElement)[];
    style?: ViewStyle;
    textStyle?: TextStyle;
  }

  export interface RowsProps {
    data: (string | number | ReactElement)[][];
    style?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle;
  }

  export class Table extends React.Component<TableProps> {}
  export class Row extends React.Component<RowProps> {}
  export class Rows extends React.Component<RowsProps> {}
}