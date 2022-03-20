import React, { useMemo } from "react";

import create from "zustand";
import { useTranslation } from "react-i18next";

import useApi from "@hooks/useApi";
import { theme } from "@styles/stitches.config";
import useUpdateEffect from "@hooks/useUpdatedEffect";
import { KDCA_DATA_SOURCE } from "@constants/constants";

import Section from "@components/Section";

import {
  generateChartRangeSubOptions,
  generateChartTypeSubOptions,
  createChartOptions,
  getDefaultChartConfig,
  getDefaultChartXAxis,
  getDefaultChartYAxis,
  transformChartData,
} from "@features/chart/chart-util";

import Chart, { ChartSkeleton } from "@features/chart/components/Chart";
import useCachedChartData from "@features/chart/hooks/useCachedChartData";

import DomesticApi from "@features/domestic/domestic-api";
import { useShowDomesticLiveChart } from "@features/domestic/hooks/useShowDomesticLiveChart";

import type {
  ChartDefaultSubOptionValues,
  ChartMode,
  ChartProps,
} from "@features/chart/chart-type";
import type {
  ChartConfig,
  ChartData,
} from "@features/chart/components/Chart_Visualiser";

type DomesticMainOption =
  | "confirmed"
  | "deceased"
  | "tested"
  | "confirmed-critical";

type ChartCompareOptionValue =
  | "yesterday"
  | "weekAgo"
  | "monthAgo"
  | "twoWeeksAgo";

interface DomesticSubOptionValues extends ChartDefaultSubOptionValues {
  compare: ChartCompareOptionValue;
}

type DomesticSubOption = keyof DomesticSubOptionValues;

interface State {
  shoulUpdate: number;
  forceUpdate: () => void;
}

export const useDomesticChartForceUpdateStore = create<State>((set) => ({
  shoulUpdate: 0,
  forceUpdate: () => {
    set((state) => ({ shoulUpdate: state.shoulUpdate + 1 }));
  },
}));

export const DomesticChartSection: React.FC = () => {
  const { getCachedChartData } =
    useCachedChartData<DomesticMainOption>("domestic");
  const { data: domesticLiveData } = useApi(DomesticApi.live);
  const { forceUpdate, shoulUpdate } = useDomesticChartForceUpdateStore(
    ({ forceUpdate, shoulUpdate }) => ({ forceUpdate, shoulUpdate })
  );
  const { t, i18n } = useTranslation();

  const showDomesticLiveChart = useShowDomesticLiveChart();

  useUpdateEffect(() => {
    forceUpdate();
  }, [domesticLiveData]);

  const chartOptions = useMemo(
    () =>
      createChartOptions<DomesticMainOption, DomesticSubOption>()({
        confirmed: {
          label: t("stat.confirmed"),
          options: {
            type: generateChartTypeSubOptions({ omit: ["accumulated"] }),
            range: generateChartRangeSubOptions(),
            compare: null,
          },

          defaultOptions: { type: showDomesticLiveChart ? "live" : "daily" },

          overrideOptionsIf: [
            {
              type: "live",
              options: {
                compare: {
                  yesterday: {
                    label: t("chart.option.yesterday"),
                  },
                  weekAgo: {
                    label: t("chart.option.one_week_ago"),
                  },
                },
                range: null,
              },
            },
          ],
        },
        "confirmed-critical": {
          label: t("stat.confirmed_critical"),
          options: {
            type: generateChartTypeSubOptions({
              omit: ["live", "accumulated", "monthly"],
            }),
            range: generateChartRangeSubOptions({ disable: ["all"] }),
          },
        },
        deceased: {
          label: t("stat.deceased"),

          options: {
            type: generateChartTypeSubOptions({
              omit: ["live", "accumulated"],
            }),
            range: generateChartRangeSubOptions(),
          },
        },
        tested: {
          label: t("stat.tested"),
          options: {
            type: generateChartTypeSubOptions({
              omit: ["live", "accumulated", "monthly"],
            }),
            range: generateChartRangeSubOptions({ disable: ["all"] }),
          },
        },
      }),
    [shoulUpdate, i18n.resolvedLanguage, showDomesticLiveChart]
  );

  const statLabel: Partial<Record<DomesticMainOption, string>> = useMemo(
    () => ({
      tested: t("stat.tested"),
      deceased: t("stat.deceased"),
      confirmed: t("stat.confirmed"),
      "confirmed-critical": t("stat.confirmed_critical"),
    }),
    [i18n.resolvedLanguage]
  );

  const getChartData: ChartProps<
    DomesticMainOption,
    DomesticSubOption
  >["getChartData"] = async (
    mainOption,
    subOptions,
    { mode, shouldInvalidate }
  ) => {
    let dataSet: ChartData[] = [];

    const { range, type, compare } = subOptions as DomesticSubOptionValues;

    const xAxis = getDefaultChartXAxis({ range, type });
    const yAxis = getDefaultChartYAxis({ range, type });

    const testedPositiveRatesChartConfig = getDefaultChartConfig(subOptions, {
      tooltipUnit: "%",
      tooltipLabel: "",
      info: t("stat.tested_positive_rates.info"),
      statLabel: t("stat.tested_positive_rates"),
    });

    if (mode === "EXPANDED") {
      const mainOptions = [
        "confirmed",
        "confirmed-critical",
        "deceased",
        "tested",
      ] as Array<DomesticMainOption>;

      const data = await getCachedChartData({
        mainOptions,
        apiName: "all",
        range: "oneMonth",
        isCompressed: true,
        shouldInvalidate,
      });

      return mainOptions.map((chartMainOption) => ({
        dataSet: [
          {
            data: transformChartData(data[chartMainOption], {
              type,
              range,
              fractionDigits:
                chartMainOption === "tested-positive-rates" ? 2 : 0,
            }),
            config: getDefaultChartConfig(
              subOptions,
              chartMainOption === "tested-positive-rates"
                ? testedPositiveRatesChartConfig
                : {
                    statLabel: statLabel[chartMainOption],
                  }
            ),
          },
        ],
        xAxis,
        yAxis,
        dataSource: KDCA_DATA_SOURCE(),
      }));
    } else {
      if (mainOption === "confirmed" && type === "live") {
        const today = domesticLiveData.hourlyLive["today"];
        const compared = domesticLiveData.hourlyLive[compare];

        const liveLabel: Record<ChartCompareOptionValue, string> = {
          yesterday: t("live.yesterday"),
          weekAgo: t("live.one_week_ago"),
          twoWeeksAgo: t("live.two_weeks_ago"),
          monthAgo: t("live.four_weeks_ago"),
        };

        dataSet = [
          {
            data: compared,
            config: getDefaultChartConfig(subOptions, {
              color: theme.colors.gray400,
              tooltipLabel: liveLabel[compare],
              chartType: "line",
              showPoints: true,
            }),
          },
          {
            data: today,
            config: getDefaultChartConfig(subOptions, {
              color: theme.colors.blue500,
              tooltipLabel: t("live.today"),
              chartType: "line",
              showPoints: true,
            }),
          },
        ];
      } else {
        const data = await getCachedChartData({
          mainOptions: [mainOption],
          range,
          isCompressed: range === "all",
          shouldInvalidate,
        });

        dataSet = [
          {
            data: transformChartData(data, {
              type,
              range,
              fractionDigits: mainOption === "tested-positive-rates" ? 2 : 0,
            }),
            config: getDefaultChartConfig(
              subOptions,
              mainOption === "tested-positive-rates" &&
                testedPositiveRatesChartConfig
            ),
          },
        ];
      }

      return {
        dataSet,
        xAxis,
        yAxis,
        dataSource: type !== "live" && KDCA_DATA_SOURCE(),
      };
    }
  };

  const defaultChartMode: ChartMode = showDomesticLiveChart
    ? "DEFAULT"
    : "EXPANDED";

  return (
    <Section>
      <Chart
        enableExpandMode
        defaultMode={defaultChartMode}
        {...{ chartOptions, getChartData, forceUpdate: shoulUpdate }}
      />
    </Section>
  );
};

export const DomesticChartSectionSkeleton = () => {
  const showDomesticLiveChart = useShowDomesticLiveChart();
  const chartMode: ChartMode = showDomesticLiveChart ? "DEFAULT" : "EXPANDED";

  return (
    <Section>
      <ChartSkeleton tabs={5} mode={chartMode} charts={5} />
    </Section>
  );
};

export default DomesticChartSection;
