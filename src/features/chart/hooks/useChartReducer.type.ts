import type { TabProps } from "@components/Tabs";
import type { ChartProps } from "@features/chart/chart-type";
import type { ChartMode } from "@features/chart/chart-type";
import type { ChartVisualiserData } from "@features/chart/components/Chart_Visualiser";

export interface ChartReducerState<
  MainOption extends string,
  SubOption extends string
> {
  props: ChartProps<MainOption, SubOption>;
  mode: ChartMode;
  chartData: Array<ChartVisualiserData>;
  selectedMainOption: MainOption;
  selectedSubOptions: Record<SubOption, string>;
  subOptions: Record<SubOption, Array<TabProps>>;
  mainOptions: Array<TabProps>;
  selectedX: string | null;
}

export type ChartReducerAction<
  MainOption extends string,
  SubOption extends string
> =
  | {
      type: "INIT_OPTIONS";
      payload: { props: ChartProps<MainOption, SubOption> };
    }
  | { type: "TOGGLE_MODE" }
  | {
      type: "SET_CHART_DATA";
      payload: { chartData: Array<ChartVisualiserData> };
    }
  | {
      type: "SET_SUB_OPTION";
      payload: { optionName: string; value: SubOption };
    }
  | { type: "SET_MAIN_OPTION"; payload: { value: MainOption } }
  | { type: "SET_SELECTEDX"; payload: { value: any } }
  | { type: "RESET_SELECTED_X" };
