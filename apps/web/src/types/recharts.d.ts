// Stub declarations to satisfy TypeScript until `npm install recharts` is run.
// These types are replaced by the real recharts package at runtime.
declare module "recharts" {
  import type { ReactNode, FC, CSSProperties } from "react";

  type DataKey = string | number | ((item: unknown) => number | string);

  interface CommonProps {
    className?: string;
    style?: CSSProperties;
  }

  interface ResponsiveContainerProps extends CommonProps {
    width?: string | number;
    height?: string | number;
    children?: ReactNode;
  }
  export const ResponsiveContainer: FC<ResponsiveContainerProps>;

  interface BarChartProps extends CommonProps {
    data?: unknown[];
    barCategoryGap?: string | number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    children?: ReactNode;
  }
  export const BarChart: FC<BarChartProps>;

  interface BarProps extends CommonProps {
    dataKey?: DataKey;
    radius?: number | [number, number, number, number];
    children?: ReactNode;
  }
  export const Bar: FC<BarProps>;

  interface CellProps extends CommonProps {
    fill?: string;
    stroke?: string;
    key?: string;
  }
  export const Cell: FC<CellProps>;

  interface AreaChartProps extends CommonProps {
    data?: unknown[];
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    children?: ReactNode;
  }
  export const AreaChart: FC<AreaChartProps>;

  interface AreaProps extends CommonProps {
    type?: string;
    dataKey?: DataKey;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    dot?: boolean | object;
    activeDot?: boolean | object;
  }
  export const Area: FC<AreaProps>;

  interface XAxisProps extends CommonProps {
    dataKey?: DataKey;
    tick?: object | boolean;
    axisLine?: boolean;
    tickLine?: boolean;
  }
  export const XAxis: FC<XAxisProps>;

  interface YAxisProps extends CommonProps {
    tick?: object | boolean;
    axisLine?: boolean;
    tickLine?: boolean;
    width?: number;
    tickFormatter?: (value: number) => string;
  }
  export const YAxis: FC<YAxisProps>;

  interface TooltipProps extends CommonProps {
    content?: ReactNode | FC<unknown>;
    cursor?: boolean | object;
  }
  export const Tooltip: FC<TooltipProps>;

  interface CartesianGridProps extends CommonProps {
    strokeDasharray?: string;
    stroke?: string;
    vertical?: boolean;
    horizontal?: boolean;
  }
  export const CartesianGrid: FC<CartesianGridProps>;
}
