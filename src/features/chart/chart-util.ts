import { t } from "i18next";

import {
  ChartConfig,
  ChartData,
  ChartVisualiserData,
} from "@features/chart/components/Chart_Visualiser";

import { theme } from "@styles/stitches.config";

import {
  dayjs,
  getDaysInMonth,
  generateDatesBetweenTwoDates,
} from "@utils/date-util";
import { formatObjectValues } from "@utils/object-util";
import { koreanNumberFormat, numberWithCommas } from "@utils/number-util";

import type {
  OptionValue,
  ChartCondition,
  ChartOptions,
  ChartRangeOptionValue,
  ChartTypeOptionValue,
  ChartDefaultSubOption,
} from "@features/chart/chart-type";

import type { Dayjs } from "dayjs";

export const generateChartTypeSubOptions = (config?: {
  omit?: Array<ChartTypeOptionValue>;
  pick?: Array<ChartTypeOptionValue>;
  disable?: Array<ChartTypeOptionValue>;
}): Partial<Record<ChartTypeOptionValue, OptionValue>> => {
  const { omit = [], disable = [], pick } = config ?? {};

  const options: Partial<Record<ChartTypeOptionValue, OptionValue>> = {
    daily: {
      label: t("chart.option.daily"),
    },
    weekly: {
      label: t("chart.option.weekly"),
    },
    monthly: {
      label: t("chart.option.monthly"),
    },
    accumulated: {
      label: t("chart.option.accumulated"),
    },
    live: {
      label: t("chart.option.live"),
    },
  };

  omit.forEach((key) => delete options[key]);
  disable.forEach((key) => (options[key].disabled = true));

  if (pick !== undefined)
    return pick.reduce(
      (obj, value) => ((obj[value] = options[value]), obj),
      {}
    );

  return options;
};

export const generateChartRangeSubOptions = (config?: {
  omit?: Array<ChartRangeOptionValue>;
  pick?: Array<ChartRangeOptionValue>;
  disable?: Array<ChartRangeOptionValue>;
}): Partial<Record<ChartRangeOptionValue, OptionValue>> => {
  const { omit = [], disable = [], pick } = config ?? {};

  const options: Partial<Record<ChartRangeOptionValue, OptionValue>> = {
    oneWeek: {
      label: t("chart.option.one_week"),
    },
    oneMonth: {
      label: t("chart.option.one_month"),
    },
    threeMonths: {
      label: t("chart.option.three_months"),
    },
    all: {
      label: t("chart.option.all_time"),
    },
  };

  omit.forEach((key) => delete options[key]);
  disable.forEach((key) => (options[key].disabled = true));

  if (pick !== undefined)
    return pick.reduce(
      (obj, value) => ((obj[value] = options[value]), obj),
      {}
    );

  return options;
};

export const getInvalidRangeSubOptionsByTypeSubOption = (
  type: ChartTypeOptionValue
): Array<ChartRangeOptionValue> => {
  switch (type) {
    case "accumulated":
      return ["oneWeek", "oneMonth", "threeMonths"];
    case "monthly":
      return ["oneWeek", "oneMonth", "threeMonths"];
    case "weekly":
      return ["oneWeek"];
    default:
      return [];
  }
};

interface CreateChartOptions<
  MainOption extends string,
  SubOption extends string
> {
  create: <Config extends {}>(
    config: ChartOptions<MainOption, SubOption, Config>
  ) => any;
}

export const createChartOptions = <
  MainOption extends string,
  SubOption extends string
>() => {
  const create: CreateChartOptions<MainOption, SubOption>["create"] = (
    config
  ) => {
    const stats = Object.keys(config) as Array<MainOption>;
    return stats.reduce((obj, stat) => {
      const { options } = config[stat];
      const overrideOptionsIf = config[stat]?.overrideOptionsIf;

      const rangeOptions = Object.keys(
        options.range
      ) as ChartRangeOptionValue[];
      const typeOptions = Object.keys(options.type) as ChartTypeOptionValue[];

      obj[stat] = {
        ...config[stat],
        overrideOptionsIf: [
          ...(overrideOptionsIf ?? []),
          ...(options.type
            ? typeOptions
                .filter((type) => type !== "live")
                .map((type) => {
                  return {
                    type,
                    options: {
                      range: generateChartRangeSubOptions({
                        pick: rangeOptions,
                        disable: getInvalidRangeSubOptionsByTypeSubOption(
                          type
                        ).concat(
                          rangeOptions?.filter(
                            (range) => options.range[range].disabled === true
                          ) || []
                        ),
                      }),
                    },
                  } as ChartCondition<{}, ChartDefaultSubOption>;
                })
            : []),
        ],
      };
      return obj;
    }, {} as typeof config);
  };
  return create;
};

const rangeTypeLabel: Record<ChartTypeOptionValue, string> = {
  weekly: t("chart.label.range.weekly"),
  monthly: t("chart.label.range.monthly"),
  accumulated: t("chart.label.range.accumulated"),
  daily: t("chart.label.range.daily"),
  live: t("chart.label.range.live"),
};

export const getDefaultChartConfig = (
  options: {
    type?: ChartTypeOptionValue;
    range?: ChartRangeOptionValue;
  },
  config?: {
    chartType?: "line" | "bar";
    color?: any;
    tooltipLabel?: string;
  } & Partial<ChartConfig>
): ChartConfig => {
  const { type, range } = options;
  const {
    chartType: _chartType,
    tooltipLabel,
    color = theme.colors.blue500,
    ...chartConfig
  } = config ?? {};

  const chartType =
    _chartType ??
    ((range === "all" && type === "daily") || type === "accumulated"
      ? "line"
      : "bar");

  return {
    type: chartType,
    ...(chartType === "line" && {
      lineColor: color,
      lineThickness: type === "live" ? 1 : 2,
      lineType: "linear",
    }),

    ...(chartType === "bar" && {
      barColor: color,
      activeBarColor: color,
      barThickness: 10,
    }),

    pointColor: color,
    pointRadius: 6,

    showLabel:
      range === "oneWeek" || (range === "oneMonth" && type === "weekly"),
    labelFormat: (value) => numberWithCommas(value),
    legendColor: color,

    tooltipFormat: (value) => numberWithCommas(value),
    tooltipLabel: tooltipLabel ?? rangeTypeLabel[type],
    tooltipUnit: t("stat.unit"),
    yAxisPosition: "right",

    ...chartConfig,
  };
};

export const getDefaultChartXAxis = (
  config: {
    type?: ChartTypeOptionValue;
    range?: ChartRangeOptionValue;
  },
  override?: Partial<ChartVisualiserData["xAxis"]>
): ChartVisualiserData["xAxis"] => {
  const { type } = config;

  return {
    format: (value) => {
      switch (type) {
        case "live":
          return Number(value) && Number(value) !== 0
            ? `${value}${t("time.unit")}`
            : value.toString();

        case "weekly": {
          const weekNumber = Math.ceil((value as Dayjs).date() / 7);
          return `${dayjs(value).format("MMM")} ${t("date.week.prefix")}${weekNumber}${t("date.week.suffix")}`;
        }

        case "monthly":
          return dayjs(value).format("MMM");

        default:
          return dayjs(value).format("MM.DD");
      }
    },
    tooltipFormat: (value) => {
      override?.tooltipFormat?.(value);
      switch (type) {
        case "live":
          return Number(value) && Number(value) !== 0
            ? `${value}${t("time.unit")}`
            : value?.toString();

        case "weekly": {
          const weekNumber = Math.ceil((value as Dayjs).date() / 7);

          return `${dayjs(value).format("YYYY MMM")} ${t("date.week.prefix")}${weekNumber}${t("date.week.suffix")}`;
        }

        case "monthly":
          return dayjs(value).format("YYYY MMM");

        case "daily":
          return `${dayjs(value).format("YYYY.MM.DD (ddd)")}`;

        default:
          return dayjs(value).format("YYYY.MM.DD");
      }
    },
    scaleType: type === "live" ? "linear" : "date",
  };
};

export const getDefaultChartYAxis = (
  options: {
    type: ChartTypeOptionValue;
    range: ChartRangeOptionValue;
  },
  override?: ChartVisualiserData["yAxis"]
): ChartVisualiserData["yAxis"] => {
  const { range, type } = options;
  return {
    right: {
      beginAtZero: true,
      format: (value) => koreanNumberFormat(value),
      position: "right",
      visibility:
        range === "oneWeek" || (range === "oneMonth" && type === "weekly")
          ? "hidden"
          : "visible",
      ...override?.right,
    },
    ...(override?.left ? { left: override?.left } : {}),
  };
};

export const getChartRangeSlug = (value: ChartRangeOptionValue) => {
  switch (value) {
    case "oneWeek":
      return 7;
    case "oneMonth":
    case "threeMonths":
      return 90;
    default:
      return value;
  }
};

export const getChartRangeLength = (value: ChartRangeOptionValue) => {
  switch (value) {
    case "oneWeek":
      return 7;
    case "twoWeeks":
      return 14;
    case "oneMonth":
      return 30;
    case "threeMonths":
      return 90;
    default:
      return 91;
  }
};

export const transformChartData = (
  _chartData: ChartData["data"],
  {
    type,
    range,
    fractionDigits,
  }: {
    type: ChartTypeOptionValue;
    range: ChartRangeOptionValue;
    fractionDigits?: number;
  }
) => {
  let chartData = _chartData;

  if (type !== "live") {
    chartData = Object.keys(_chartData).reduce((obj, date) => {
      const newDate = dayjs(date).subtract(1, "day").format("YYYY-MM-DD");
      obj[newDate] = _chartData[date];
      return obj;
    }, {});
  }

  const timeperiods =
    range === "all"
      ? Object.keys(chartData)
      : Object.keys(chartData).slice(-getChartRangeLength(range));

  let today = dayjs(timeperiods[timeperiods.length - 1]);

  switch (type) {
    case "daily":
      return timeperiods.reduce(
        (obj, date) => ((obj[date] = chartData[date]), obj),
        {}
      );

    case "weekly":
      let currentDate;

      return formatObjectValues(
        timeperiods.reduce((obj, date) => {
          const day = dayjs(date).day();
          if (day === 0) currentDate = date;

          if (currentDate !== undefined) {
            obj[currentDate] = (obj[currentDate] || 0) + chartData[date];
          }

          return obj;
        }, {}),
        (value, date) => {
          const diff = today.diff(date, "day");
          const divider = Math.min(7, diff + 1);

          return Number((value / divider).toFixed(fractionDigits ?? 0));
        }
      );

    case "monthly":
      return formatObjectValues(
        timeperiods.reduce((obj, date) => {
          let yearMonth = date.match(/\d{4}-\d{2}/)[0];
          if (yearMonth != "2020-01") {
            obj[`${yearMonth}-01`] =
              (obj[`${yearMonth}-01`] || 0) + chartData[date];
          }
          return obj;
        }, {}),
        (value, date: string) => {
          const [year, month] = date.split("-").map(Number);
          const daysInMonth = getDaysInMonth(year, month);
          const diff = today.diff(date, "day");
          const divider = Math.min(daysInMonth, diff + 1);
          return Number((value / divider).toFixed(fractionDigits ?? 0));
        }
      );

    case "accumulated":
      return timeperiods.reduce((obj, date, index) => {
        let prevDate = timeperiods[index - 1];
        obj[date] = (obj[prevDate] || 0) + chartData[date];
        return obj;
      }, {});

    case "live":
    default:
      return chartData;
  }
};

export interface CompressedChartData {
  from: string;
  to: string;
  data: Array<string | number>;
  stats?: Array<string>;
  type: "CHART_SINGLE" | "CHART_MULTI";
}

export const parseCompressedChartData = ({
  data,
  from,
  to,
  type,
  stats,
}: CompressedChartData) => {
  const dates = generateDatesBetweenTwoDates(from, to);

  let result = {};

  if (type === "CHART_MULTI") {
    stats.forEach((stat) => (result[stat] = {}));
  }

  for (let dateIndex = 0; dateIndex < dates.length; dateIndex++) {
    const date = dates[dateIndex];
    if (type === "CHART_SINGLE") {
      result[date] = data[dateIndex];
    } else {
      const dataSet = data[dateIndex].toString().split(",");
      for (let statIndex = 0; statIndex < stats.length; statIndex++) {
        let stat = stats[statIndex];
        result[stat][date] = Number(dataSet[statIndex]);
      }
    }
  }

  return result;
};
