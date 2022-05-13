import { useMemo, useReducer } from "react";

import { ChartReducerAction, ChartReducerState } from "./useChartReducer.type";
import {
  getSubOptions,
  getInitialSelectedSubOptions,
  getValidSelectedSubOptions,
} from "./useChartReducer.utils";

import type { ChartProps } from "@features/chart/chart-type";

const createReducer =
  <MainOption extends string, SubOption extends string>() =>
  (
    state: ChartReducerState<MainOption, SubOption>,
    action: ChartReducerAction<MainOption, SubOption>
  ): ChartReducerState<MainOption, SubOption> => {
    switch (action.type) {
      case "SET_CHART_DATA": {
        const xValues = Object.keys(
          action.payload.chartData[0].dataSet[0].data
        );

        return {
          ...state,
          chartData: action.payload.chartData,
          selectedX: xValues[xValues.length - 1],
        };
      }
      case "RESET_SELECTED_X": {
        const xValues = Object.keys(state.chartData[0].dataSet[0].data);
        return {
          ...state,
          selectedX: xValues[xValues.length - 1],
        };
      }

      case "TOGGLE_MODE": {
        const mode = state.mode === "DEFAULT" ? "EXPANDED" : "DEFAULT";

        const defaultSelectedSubOptionsForExpandedMode = {
          type: "daily",
          range: "oneMonth",
        };

        const selectedSubOptions = (
          mode === "EXPANDED"
            ? defaultSelectedSubOptionsForExpandedMode
            : state.selectedSubOptions
        ) as Record<SubOption, string>;

        const subOptions = getSubOptions({
          mode,
          chartOptions: state.props.chartOptions,
          selectedMainOption: state.selectedMainOption,
          selectedSubOptions,
        });

        return {
          ...state,
          mode,
          subOptions,
          selectedSubOptions,
        };
      }

      case "SET_SUB_OPTION": {
        const selectedSubOptions = getValidSelectedSubOptions(state, {
          selectedSubOptions: {
            ...state.selectedSubOptions,
            [action.payload.optionName]: action.payload.value,
          },
        });

        const subOptions = getSubOptions({
          chartOptions: state.props.chartOptions,
          mode: state.mode,
          selectedMainOption: state.selectedMainOption,
          selectedSubOptions,
        });

        return {
          ...state,
          selectedSubOptions,
          subOptions,
        };
      }

      case "SET_MAIN_OPTION": {
        const selectedMainOption = action.payload.value;

        const selectedSubOptions = getValidSelectedSubOptions(state, {
          selectedMainOption: action.payload.value,
        });

        const subOptions = getSubOptions({
          chartOptions: state.props.chartOptions,
          mode: state.mode,
          selectedMainOption,
          selectedSubOptions,
        });

        return {
          ...state,
          selectedMainOption: action.payload.value,
          subOptions,
          selectedSubOptions,
        };
      }

      case "SET_SELECTEDX":
        return {
          ...state,
          selectedX: action.payload.value,
        };
      case "INIT_OPTIONS": {
        const { chartOptions } = action.payload.props;
        const { mode, selectedMainOption, selectedSubOptions } = state;

        const mainOptions = Object.keys(chartOptions).map((stat) => ({
          value: stat as MainOption,
          text: chartOptions[stat].label,
        }));

        const subOptions = getSubOptions({
          chartOptions,
          mode,
          selectedMainOption,
          selectedSubOptions,
        });

        return {
          ...state,
          mainOptions,
          subOptions,
          props: action.payload.props,
        };
      }
      default:
        throw new Error();
    }
  };

const initReducerState = <MainOption extends string, SubOption extends string>(
  props: ChartProps<MainOption, SubOption>
): ChartReducerState<MainOption, SubOption> => {
  const { chartOptions, defaultMode } = props;

  const mainOptions = Object.keys(chartOptions).map((stat) => ({
    value: stat as MainOption,
    text: chartOptions[stat].label,
  }));

  const selectedMainOption = mainOptions[0].value;
  const selectedSubOptions = getInitialSelectedSubOptions<
    MainOption,
    SubOption
  >(props) as any;

  const mode = defaultMode ?? "DEFAULT";

  const subOptions = getSubOptions({
    chartOptions,
    mode,
    selectedMainOption,
    selectedSubOptions,
  });

  return {
    props,
    mode,
    subOptions,
    mainOptions,
    selectedMainOption,
    selectedSubOptions,

    selectedX: null,
    chartData: [],
  };
};

const useChartReducer = <MainOption extends string, SubOption extends string>(
  props
) => {
  const reducer = useMemo(() => createReducer<MainOption, SubOption>(), []);
  return useReducer(reducer, null, () =>
    initReducerState<MainOption, SubOption>(props)
  );
};

export default useChartReducer;
