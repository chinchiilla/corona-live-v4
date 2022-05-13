import React, { useEffect, useMemo, useRef, useState } from "react";

import { rem } from "polished";
import dayjs, { Dayjs } from "dayjs";
import { max, bisector } from "d3-array";
import { transition } from "d3-transition";
import { line, curveLinear } from "d3-shape";
import { useTranslation } from "react-i18next";
import { select, pointers } from "d3-selection";
import { scaleTime, scaleLinear } from "d3-scale";
import { axisBottom, axisLeft, axisRight } from "d3-axis";

import useChartSize from "@hooks/useChartSize";
import { isArrayEqual } from "@utils/array-util";
import { styled, theme } from "@styles/stitches.config";

import Row from "@components/Row";

import type { ChartMode } from "@features/chart/chart-type";
import Render from "@components/Render";

export type ChartType = "line" | "bar";
export type YAxisPosition = "left" | "right";
export type ChartLineType = "linear" | "cardinal";

export interface ChartConfig {
  type: ChartType;

  lineColor?: string;
  lineThickness?: number;
  lineType?: ChartLineType;

  barColor?: string;
  barThickness?: number;
  activeBarColor?: string;

  showPoints?: boolean;
  pointColor?: string;
  pointRadius?: number;

  showLabel?: boolean;
  labelFormat?: (value: number) => string;

  tooltipLabel: string;
  tooltipUnit?: string;
  tooltipFormat: (value: number) => string;

  zIndex?: number;
  isStack?: boolean;
  statLabel?: string;
  legendColor: string;
  yAxisPosition: YAxisPosition;
  info?: string | React.ReactNode;
}

export interface ChartData {
  data: Record<string, number>;
  config: ChartConfig;
}

export interface ChartYAxis {
  id: string;
  position?: YAxisPosition;
  format?: (value: number) => string;
  beginAtZero?: boolean;
  visibility?: "hidden" | "visible";
}

export interface ChartXAxis {
  scaleType: "linear" | "date";
  format: (value: Dayjs | string) => string;
  tooltipFormat: (value: Dayjs | string) => string;
}

export interface ChartVisualiserData {
  dataSet: ChartData[];
  yAxis: { left?: ChartYAxis; right?: ChartYAxis };
  xAxis: ChartXAxis;
  dataSource?: {
    text: string;
    url?: string;
  };
}

const TRANSITION_DURATION = 400;
const DEFAULT_CHART_BAR_THICKNESS = 9;

const getYAxisStepSize = (maxY) => {
  let stepSize = `${Math.ceil(maxY / 4)}`;
  let firstDigit = Number(stepSize[0]) + 1;
  let zeros = stepSize.length - 1;

  if (zeros === 0) return Number(stepSize);

  return firstDigit * 10 ** zeros;
};

const getYAxisTickValues = (
  dataSet: ChartData[],
  yAxisPosition: YAxisPosition
) => {
  const currentDataset = dataSet.filter(
    ({ config }) => config.yAxisPosition === yAxisPosition
  );

  const isStack = currentDataset.every(({ config }) => config.isStack);

  let maxY;

  if (isStack) {
    maxY = max(
      Object.keys(currentDataset[0].data).map((date) => {
        let sum = currentDataset.reduce(
          (val, data) => val + data.data[date],
          0
        );
        return sum;
      })
    );
  } else {
    maxY = max(
      currentDataset.reduce(
        (array, data) => [...array, ...Object.values(data.data)],
        []
      )
    );
  }

  const stepSize = getYAxisStepSize(maxY);
  const stepLength = Math.ceil(maxY / stepSize) || 0;
  return [...Array(stepLength + 1)].map((_, i) => i * stepSize);
};

const getXAxisTickValues = (range, xParser) => {
  const ticksInterval =
    range.length < 20
      ? Math.ceil(range.length / (range.length > 8 ? 6 : 8))
      : Math.floor(range.length / (range.length > 8 ? 6 : 8));
  const R = range.length;
  return range.reduce((arr, val, i) => {
    if ((R - i - 1) % ticksInterval === 0) arr.push(xParser(val));
    return arr;
  }, []);
};

interface Props extends ChartVisualiserData {
  mode: ChartMode;
  selectedX: string;
  setSelectedX: (value) => void;
  resetSelectedX: () => void;
  lastIndex?: boolean;
}

const ChartVisualiser: React.FC<Props> = ({
  dataSet,
  xAxis,
  yAxis,
  mode,
  dataSource,
  selectedX,
  setSelectedX,
  resetSelectedX,
  lastIndex,
}) => {
  const { t } = useTranslation();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevChartTypes = useRef<Array<ChartType>>([]);

  const { width, height } = useChartSize({ mode });

  const [titleAlignment, setTitleAlignment] = useState<"left" | "right">(
    "left"
  );

  const { xValues, xParser, xScale, yScales, margin } = useMemo(() => {
    let margin = { left: 20, right: 20, top: 16, bottom: 20 };

    if (!dataSet?.[0]) return { margin };

    const xValues = Object.keys(dataSet[0].data);

    const xParser = (value) => {
      return xAxis.scaleType === "date" ? dayjs(value) : value;
    };

    if (yAxis?.left?.visibility === "visible") {
      margin.left = 50;
    }
    if (yAxis?.right?.visibility === "visible") {
      margin.right = 40;
    }

    const xScale = (
      xAxis.scaleType === "date" ? scaleTime().clamp(true) : scaleLinear()
    )
      .domain([xParser(xValues[0]), xParser(xValues[xValues.length - 1])])
      .range([margin.left, width - margin.right]);

    const yScales = (Object.keys(yAxis) as Array<YAxisPosition>).reduce(
      (obj, yAxisPosition) => {
        const tickValues = getYAxisTickValues(dataSet, yAxisPosition);

        let extraPaddingTop = dataSet.some(({ config }) => config.showLabel)
          ? 20
          : 0;
        obj[yAxisPosition] = scaleLinear()
          .domain([0, tickValues[tickValues.length - 1]])
          .range([height - margin.bottom, margin.top + extraPaddingTop]);

        return obj;
      },
      {} as any
    );

    return { xAxis, xValues, xParser, xScale, yScales, margin };
  }, [dataSet, width, height, xAxis, yAxis]);

  useEffect(() => {
    if (!dataSet?.[0] || width === undefined || height === undefined) return;

    const $svg = select(svgRef.current);
    const $container = select(containerRef.current);

    const t = transition().duration(TRANSITION_DURATION);
    ($svg as any)?.transition();

    const chartTypes = dataSet.map(({ config }) => config.type);
    const shouldRepaintSvg =
      prevChartTypes.current.length !== 0 &&
      isArrayEqual(prevChartTypes.current, chartTypes) === false;

    if (shouldRepaintSvg) {
      prevChartTypes.current.map((_, i) => {
        const group = $svg.select(`.group-${i}`);
        group.selectAll(`.area-${i}`).remove();
        group.selectAll(".bar").remove();
        group.selectAll(`.points-${i}`).remove();
        group.remove();
      });
    }

    prevChartTypes.current = chartTypes;

    const drawAxis = () => {
      const drawYAxis = () => {
        (Object.keys(yAxis) as Array<YAxisPosition>).forEach(
          (yAxisPosition) => {
            const { format, visibility } = yAxis[yAxisPosition];
            const isLeft = yAxisPosition === "left";
            const yAxisClassname = isLeft ? ".y-axis-left" : ".y-axis";

            if (visibility === "visible") {
              const yScale = yScales[yAxisPosition];
              const tickValues = getYAxisTickValues(dataSet, yAxisPosition);

              const yAxisTranslateX = isLeft
                ? margin.left
                : width - margin.right;

              const tickX = isLeft ? -36 : 40;

              const yAxisGenerator = (
                isLeft ? axisRight(yScale) : axisLeft(yScale)
              )
                .tickSize(width - margin.left - margin.right)
                .tickValues(tickValues)
                .tickFormat(format);

              $svg
                .select(yAxisClassname)
                .attr("opacity", 1)
                .attr("transform", `translate(${yAxisTranslateX}, 0)`)
                .call((g) =>
                  g
                    .call(yAxisGenerator)
                    .call((g) =>
                      g
                        .selectAll(".tick:first-of-type line")
                        .attr("stroke-opacity", isLeft ? 0 : 0.08)
                    )
                    .call((g) =>
                      g
                        .selectAll(".tick:not(:first-of-type) line")
                        .attr("stroke-opacity", isLeft ? 0 : 0.08)
                    )
                    .call((g) =>
                      g.selectAll(".tick text").attr("x", tickX).attr("dy", 4)
                    )
                );
            } else {
              $svg.select(yAxisClassname).attr("opacity", 0);
            }
          }
        );
      };

      const drawXAxis = () => {
        $svg
          .select(".x-axis")
          .attr("transform", `translate(0, ${height - margin.bottom})`)
          .call((g) =>
            g
              .attr("class", "x-axis")
              .call(
                axisBottom()
                  .scale(xScale)
                  .tickValues(getXAxisTickValues(xValues, xParser))
                  .tickFormat(xAxis.format)
              )
          );
      };

      drawYAxis();
      drawXAxis();
    };
    drawAxis();

    dataSet.map(({ data, config }, i) => {
      const { type, showPoints, isStack, zIndex, yAxisPosition } = config;
      const yScale = yScales[yAxisPosition];

      const groupClassName = `group-${i}`;
      let group = $svg
        .select(`.${groupClassName}`)
        .style("z-index", zIndex ?? 1);

      const shouldInitGroup = (group as any)._groups[0][0] === undefined;
      if (shouldInitGroup) {
        $svg.append("g").attr("class", groupClassName);
        group = $svg.select(`.${groupClassName}`).style("z-index", zIndex ?? 1);
      }

      const drawChart = () => {
        const drawLabel = () => {
          const { showLabel, labelFormat } = config;
          if (showLabel) {
            const labelTop = (x) => {
              if (isStack) {
                return (
                  yScale(
                    dataSet
                      .filter(({ config }) => config.isStack)
                      .reduce((total, { data }) => total + data[x], 0)
                  ) - 10
                );
              } else {
                return yScale(data[x]) - 10;
              }
            };

            const labelValue = (x) => {
              let value;
              if (isStack) {
                value = dataSet
                  .filter(({ config }) => config.isStack)
                  .reduce((total, { data }) => total + data[x], 0);
              } else {
                value = data[x];
              }
              return labelFormat ? labelFormat(value) : value;
            };

            group
              .selectAll(".label-background")
              .data(xValues)
              .join((enter) =>
                enter
                  .append("rect")
                  .attr("class", `bar`)
                  .attr("width", 10)
                  .attr("height", 16)
                  .attr("fill", theme.colors.white)
                  .attr("class", "label-background")
                  .attr("x", (x) => xScale(xParser(x)))
                  .attr("y", labelTop)
              )
              .attr("width", 10)
              .attr("height", 16)
              .attr("fill", theme.colors.white)
              .attr("class", "label-background")
              .attr("x", (x) => xScale(xParser(x)) - 5)
              .attr("y", (x) => labelTop(x) - 12);

            group
              .selectAll(".label")
              .data(xValues)
              .join((enter) =>
                enter
                  .append("text")
                  .text(labelValue)
                  .attr("class", "label")
                  .attr("text-anchor", "middle")
                  .attr("x", (x) => xScale(xParser(x)))
                  .attr("y", labelTop)
              )
              .transition(t)
              .text(labelValue)
              .attr("x", (x) => xScale(xParser(x)))
              .attr("y", labelTop);
          } else {
            group.selectAll(".label").remove();
            group.selectAll(".label-background").remove();
          }
        };

        const drawBars = () => {
          const { activeBarColor, barColor } = config;

          const barThickness = Number(
            Math.min(
              DEFAULT_CHART_BAR_THICKNESS,
              (width / xValues.length) * 0.5
            ).toFixed(2)
          );

          const barRadius = barThickness / 2.2;

          const barHeight = (x) => {
            const value = height - margin.bottom - yScale(data[x]);

            return value;
          };

          const barLeft = (x) => {
            const value = xScale(xParser(x)) - barThickness / 2;

            return value;
          };

          const barTop = (x) => {
            let value;
            if (isStack && i > 0) {
              value =
                yScale(dataSet[0].data[x]) -
                dataSet
                  .slice(1, i + 1)
                  .reduce(
                    (sum, { data: _data }) =>
                      sum + (height - margin.bottom - yScale(_data[x])),
                    0
                  );
            } else {
              value = yScale(data[x]);
            }
            return value;
          };

          group
            .selectAll(".bar")
            .data(xValues)
            .join((enter) =>
              enter
                .append("rect")
                .attr("class", `bar`)
                .attr("width", barThickness)
                .attr("height", barHeight)
                .attr("fill", (x) => {
                  return selectedX === x ? activeBarColor : barColor;
                })
                .attr("opacity", (x) => (selectedX === x ? 1 : 0.6))
                .attr("x", barLeft)
                .attr("y", (x) => barTop(x))
                .attr("rx", barRadius)
                .attr("ry", barRadius)
            )
            .transition(t)
            .attr("width", barThickness)
            .attr("height", (x) => height - margin.bottom - yScale(data[x]))
            .attr("fill", (x) => (selectedX === x ? activeBarColor : barColor))
            .attr("opacity", (x) => (selectedX === x ? 1 : 0.6))
            .attr("x", barLeft)
            .attr("y", (x) => barTop(x))
            .attr("rx", barRadius)
            .attr("ry", barRadius);
        };

        const drawLines = () => {
          const { lineThickness, lineColor } = config;

          const linePath = line()
            .curve(curveLinear)
            .x((x) => xScale(xParser(x)))
            .y((x) => yScale(data[x]));

          const mainGradient = group
            .selectAll(`defs-${i}`)
            .data([0])
            .enter()
            .append("defs")
            .attr("id", `defs-${i}`)
            .append("linearGradient")
            .attr("id", `mainGradient-${i}`)
            .attr("x2", "0%")
            .attr("y2", "100%");

          const color = (lineColor as any).token.match(/[^\d]+/)[0];

          mainGradient
            .append("stop")
            .attr("style", `stop-color:${theme.colors[`${color}A050`]}`)
            .attr("offset", "0");

          mainGradient
            .append("stop")
            .attr("style", `stop-color:${theme.colors[`${color}A000`]}`)
            .attr("offset", "0.3");
          mainGradient
            .append("stop")
            .attr("style", `stop-color:${theme.colors[`${color}A000`]}`)
            .attr("offset", "1");

          const extraX = width * 3;
          const extraY = height * 3;

          group
            .selectAll(`.area-${i}`)
            .data([xValues])
            .join(
              (enter) =>
                enter
                  .append("path")
                  .attr("class", `area-${i}`)
                  .attr("stroke", lineColor)
                  .attr("stroke-width", lineThickness)
                  .attr("clip-path", `url(#maskClipPath)`)
                  .attr("d", (a) => {
                    return (
                      linePath(a) +
                      `L ${extraX} 0 L ${extraX} ${extraY} L -${extraY} ${extraY}`
                    );
                  })
                  .attr("fill", `url(#mainGradient-${i})`),
              (update) =>
                update.transition(t).attr("d", (a) => {
                  return (
                    linePath(a) +
                    `L ${extraX} 0 L ${extraX} ${extraY} L -${extraY} ${extraY}`
                  );
                })
            );
        };

        const drawPoints = () => {
          const { pointRadius, pointColor } = config;

          group
            .selectAll(`.points-${i}`)
            .data(xValues)
            .join(
              (enter) =>
                enter
                  .append("circle")
                  .attr("class", `points-${i}`)
                  .attr("fill", pointColor)
                  .attr("r", pointRadius)
                  .attr("cx", (x) => xScale(xParser(x)))
                  .attr("cy", (x) => yScale(data[x])),

              (update) =>
                update
                  .transition(t)
                  .attr("cx", (x) => xScale(xParser(x)))
                  .attr("cy", (x) => yScale(data[x]))
            );
        };

        drawLabel();
        if (type === "bar") drawBars();
        if (type === "line") drawLines();
        if (showPoints) drawPoints();
      };
      drawChart();
    });

    function mousemove(event) {
      const xm = pointers(event)[0][0];

      const x = xScale.invert(xm);

      if (!isNaN(x)) {
        const bisectDate = bisector((x) => xParser(x)).left;
        const index = bisectDate(xValues, x, 1);
        const xLeft = xValues[index - 1];
        const xRight = xValues[index];
        const newSelectedX =
          x - xParser(xLeft) < xParser(xRight) - x ? xLeft : xRight;
        setSelectedX(newSelectedX || selectedX);
      }
    }

    function touchcancel() {
      resetSelectedX();
    }

    $container.selectAll("*").attr("pointer-events", "none");
    $container
      .on("mousemove", mousemove)
      .on("touchmove", mousemove)
      .on("touchend", touchcancel);
  }, [svgRef, dataSet, yScales]);

  useEffect(() => {
    if (!dataSet?.[0]) return;

    const t = transition().duration(TRANSITION_DURATION);

    const $svg = select(svgRef.current);
    const $container = select(containerRef.current);

    const chartTooltipContainer = $container.select(".chart-tooltip-container");
    const tooltipLine = $container.select(".chart-tooltip-line");
    const tooltipDate = $container.select(".chart-tooltip-date");

    if (Object.is(NaN, xScale(xParser(selectedX)))) {
      chartTooltipContainer.style("opacity", 0);
      tooltipLine.style("opacity", 0);
      tooltipDate.style("opacity", 0);

      return;
    }

    const updateTooltip = () => {
      const { width: containerWidth, height: containerHeight } =
        chartTooltipContainer.node().getBoundingClientRect();
      let translateX = xScale(xParser(selectedX)) - containerWidth / 2;
      if (translateX < 0) {
        translateX = 0;
      } else if (translateX + containerWidth > width - margin.right + 10) {
        translateX = width - margin.right - containerWidth + 10;
      }

      chartTooltipContainer
        .style("opacity", 1)
        .style("right", rem(width - translateX - containerWidth));

      tooltipLine
        .style("opacity", 1)
        .style("left", rem(xScale(xParser(selectedX))))
        .style("top", rem(containerHeight))
        .style("height", rem(mode === "DEFAULT" ? height - 18 : height));

      const updateTooltipDate = () => {
        const xValue = xAxis?.format(
          xAxis.scaleType === "linear" &&
            selectedX === xValues[xValues.length - 1]
            ? t("now")
            : xParser(selectedX)
        );

        tooltipDate.html(xValue);
        const { width: w } = tooltipDate.node().getBoundingClientRect();
        tooltipDate
          .style("opacity", selectedX && mode === "EXPANDED" ? 1 : 0)
          .style("left", `${xScale(xParser(selectedX)) - w / 2}px`)
          .style("bottom", rem(0));
      };

      if (mode === "EXPANDED") {
        updateTooltipDate();
      } else {
        tooltipDate.style("opacity", 0);
      }
    };

    if (
      dataSet
        .map(({ data }) => data[selectedX])
        .every((value) => value !== undefined)
    ) {
      setTimeout(() => {
        updateTooltip();
      }, 0);
    }

    setTitleAlignment(
      xScale(xParser(selectedX)) > width / 2 ? "left" : "right"
    );

    dataSet.forEach(({ data, config }, i) => {
      const yScale = yScales[config.yAxisPosition];

      const groupClassName = `group-${i}`;
      let group = $svg.select(`.${groupClassName}`);

      const { showPoints, type, isStack } = config;

      const drawPoints = () => {
        const { pointColor, pointRadius, lineColor } = config;

        const color = (pointColor as any).token.match(/[^\d]+/)[0];

        group
          .selectAll(`.points-${i}-box-shadow`)
          .data(xValues)
          .join(
            (enter) =>
              enter
                .append("circle")
                .attr("class", `points-${i}-box-shadow`)
                .attr("fill", pointColor)
                .attr("r", showPoints ? pointRadius : 4)
                .attr("stroke", theme.colors[`${color}A050`].computedValue)
                .attr("stroke-width", showPoints ? pointRadius * 3 : 10)
                .attr("opacity", (x) => (x === selectedX ? 1 : 0))

                .attr("cx", (x) => xScale(xParser(x)))
                .attr("cy", (x) => yScale(data[x])),
            (update) =>
              update
                .attr("cx", (x) => xScale(xParser(x)))
                .attr("cy", (x) => yScale(data[x]))
                .attr("opacity", (x) => (x === selectedX ? 1 : 0))
          );
      };

      const drawBars = () => {
        const { activeBarColor, barColor } = config;

        const barThickness = Number(
          Math.min(
            DEFAULT_CHART_BAR_THICKNESS,
            (width / xValues.length) * 0.5
          ).toFixed(2)
        );

        const barRadius = barThickness / 2.2;

        const barHeight = (x) => {
          const value = height - margin.bottom - yScale(data[x]);

          return value;
        };

        const barLeft = (x) => {
          const value = xScale(xParser(x)) - barThickness / 2;

          return value;
        };

        const barTop = (x) => {
          let value;
          if (isStack && i > 0) {
            value =
              yScale(dataSet[0].data[x]) -
              dataSet
                .slice(1, i + 1)
                .reduce(
                  (sum, { data: _data }) =>
                    sum + (height - margin.bottom - yScale(_data[x])),
                  0
                );
          } else {
            value = yScale(data[x]);
          }
          return value;
        };

        group
          .selectAll(".bar")
          .data(xValues)
          .join((enter) =>
            enter
              .append("rect")
              .attr("class", `bar`)
              .attr("width", barThickness)
              .attr("height", barHeight)
              .attr("fill", (x) => {
                return selectedX === x ? activeBarColor : barColor;
              })
              .attr("opacity", (x) => (selectedX === x ? 1 : 0.6))
              .attr("x", barLeft)
              .attr("y", (x) => barTop(x))
              .attr("rx", barRadius)
              .attr("ry", barRadius)
          )
          .attr("opacity", (x) => (selectedX === x ? 1 : 0.6))
          .transition(t)
          .attr("width", barThickness)
          .attr("height", (x) => height - margin.bottom - yScale(data[x]))
          .attr("fill", (x) => (selectedX === x ? activeBarColor : barColor))
          .attr("x", barLeft)
          .attr("y", (x) => barTop(x))
          .attr("rx", barRadius)
          .attr("ry", barRadius);
      };

      if (type === "line") drawPoints();
      if (type === "bar") drawBars();
    });
  }, [svgRef, selectedX, yScales, dataSet]);

  const xValue = xParser ? xScale(xParser(selectedX)) : 0;
  const xLabelValue = xAxis?.tooltipFormat(
    xAxis.scaleType === "linear" && selectedX === xValues[xValues.length - 1]
      ? t("now")
      : xParser(selectedX)
  );

  return (
    <div ref={containerRef}>
      <Wrapper
        last={lastIndex}
        borderBottom={mode === "EXPANDED" && lastIndex === false}
      >
        {mode === "EXPANDED" && xValue !== undefined && dataSet !== undefined && (
          <ChartTitleContainer key={titleAlignment} alignment={titleAlignment}>
            <Row centeredY>
              <ChartTitleText>{dataSet[0].config.statLabel}</ChartTitleText>
              {dataSet[0].config.info && titleAlignment === "left" && (
                <ChartTitleInfo>{dataSet[0].config.info}</ChartTitleInfo>
              )}
            </Row>
            {dataSource && (
              <DataSource>
                {t("chart.data_source")} - {dataSource.text}
              </DataSource>
            )}
          </ChartTitleContainer>
        )}

        <Render if={mode === "DEFAULT" && !!dataSource}>
          <DataSource absolute={true}>
            {t("chart.data_source")} - {dataSource?.text}
          </DataSource>
        </Render>

        <ChartTooltipPosition>
          <ChartTooltip
            expanded={mode === "EXPANDED"}
            className="chart-tooltip-container"
            style={{
              visibility: xValue === undefined ? "hidden" : "visible",
            }}
          >
            <Render if={mode === "DEFAULT"}>
              <TooltipXLabel>{xLabelValue}</TooltipXLabel>
            </Render>

            <Row>
              {dataSet &&
                dataSet.map(
                  ({ config, data }, index) =>
                    config.tooltipLabel !== null && (
                      <TooltipContainer key={index}>
                        <TooltipLegend
                          css={{
                            background: config.barColor ?? config.lineColor,
                          }}
                        />
                        <Render if={mode === "DEFAULT"}>
                          <TooltipLabel>{config.tooltipLabel}</TooltipLabel>
                        </Render>

                        <TooltipValue>
                          {config.tooltipFormat(data[selectedX])}
                          <span>{config?.tooltipUnit}</span>
                        </TooltipValue>
                      </TooltipContainer>
                    )
                )}
            </Row>
          </ChartTooltip>
        </ChartTooltipPosition>

        <TooltipLine className="chart-tooltip-line" />
        <TooltipDate className="chart-tooltip-date" />

        <Svg
          ref={svgRef}
          viewBox={`0 0 ${width ?? 0} ${height ?? 0}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: rem(width), height: rem(height) }}
        >
          <g className="x-axis"></g>
          <g className="y-axis"></g>
          <g className="y-axis-left"></g>
          <defs>
            <clipPath id={`maskClipPath`}>
              <rect
                height={Number(height - margin.top - margin.bottom + 2) || 0}
                width={Number(width - margin.left - margin.right) || 0}
                x={margin.left}
                y={margin.top}
              ></rect>
            </clipPath>
          </defs>
        </Svg>
      </Wrapper>
    </div>
  );
};

const TooltipDate = styled("div", {
  body3: true,
  opacity: 0,
  rowCenteredY: true,
  position: "absolute",
  background: "$shadowBackground1",
  boxShadow: `${rem(-1)} ${rem(1)} ${rem(12)} ${rem(-2)} #0000001f`,
  color: "$gray900",
  borderRadius: rem(16),
  paddingY: rem(1),
  paddingX: rem(8),
  zIndex: 2,
  border: `${rem(1)} solid $gray300`,
  height: rem(20),
  transform: `translateY(${rem(-9)})`,
  letterSpacing: rem(-0.5),
  fontWeight: 700,
  whiteSpace: "nowrap",

  "@md": {
    height: rem(22),
    transform: `translateY(${rem(-8)})`,
  },
});

const Wrapper = styled("div", {
  position: "relative",
  zIndex: 1,

  variants: {
    borderBottom: {
      true: {
        "&:before": {
          content: "",
          background: "$gray300",
          left: 0,
          right: 0,
          bottom: 0,
          position: "absolute",
          width: "100%",
          transform: "scaleX(2)",
          height: rem(1),
        },
        paddingBottom: rem(6),
      },
    },
    last: {
      true: {
        [`& ${TooltipDate}`]: {
          transform: `translateY(${rem(-2)})`,
          "@md": {
            height: rem(22),
            transform: `translateY(${rem(-2)})`,
          },
        },
      },
    },
  },
});

const Svg = styled("svg", {
  zIndex: 2,

  "& text": {
    body3: true,

    fill: "$gray800",
    letterSpacing: rem(-0.5),
    position: "relative",
  },

  "& .label": {
    zIndex: 100,
  },

  "& .label-background": {
    zIndex: 0,
  },

  "& .x-axis": {
    "& text": {
      fill: "$gray900",
      body3: true,

      "@md": {
        body2: true,
      },
    },
    "& > .domain, line": {
      visibility: "hidden",
    },
  },

  "& .y-axis": {
    "& > .domain": {
      visibility: "hidden",
    },
  },

  "& .y-axis-left": {
    "& > .domain": {
      visibility: "hidden",
    },
  },

  "& g, path, rect": {
    zIndex: 2,
  },
});

const ChartTitleContainer = styled("div", {
  column: true,
  fadeIn: 300,
  position: "absolute",

  "@md": {},

  variants: {
    alignment: {
      left: {
        left: rem(10),
        right: null,
      },
      right: {
        right: rem(32),
        left: null,
        alignItems: "flex-end",
      },
    },
  },
});

const ChartTitleText = styled("div", {
  position: "relative",

  heading3: true,
  color: "$gray900",
  borderRadius: rem(6),
  whiteSpace: "nowrap",

  "& span": {
    fontWeight: 400,
    marginLeft: rem(6),
  },

  "@md": {
    heading2: true,
  },
});

const ChartTitleInfo = styled("div", {
  body3: true,
  marginLeft: rem(6),
  color: "$gray700",
});

const ChartTooltipPosition = styled("div", {
  width: "100%",
  height: rem(50),
  marginTop: rem(12),
  marginBottom: rem(2),
  position: "relative",

  "@md": {
    height: rem(54),
    marginTop: rem(16),
  },
});

const ChartTooltip = styled("div", {
  position: "absolute",
  opacity: 0.2,
  height: rem(50),
  transition: "opacity 50ms",
  top: 0,
  width: "fit-content",
  columnCenteredY: true,
  borderRadius: rem(12),
  background: "$shadowBackground1",
  boxShadow: `${rem(-1)} ${rem(1)} ${rem(12)} ${rem(-2)} #0000001f`,
  overflow: "hidden",
  paddingX: rem(12),
  paddingY: rem(6),
  zIndex: 1,

  "@md": {
    height: rem(54),
    border: `${rem(1)} solid $sectionBorder`,
  },

  variants: {
    expanded: {
      true: {
        height: "auto",
        paddingY: rem(4),
        borderRadius: rem(10),

        "@md": {
          height: "auto",
          paddingY: rem(6),
          borderRadius: rem(12),
        },
      },
    },
  },
});

const TooltipXLabel = styled("div", {
  body3: true,
  color: "$gray800",
  whiteSpace: "nowrap",

  fontWeight: 500,
});

const TooltipContainer = styled("div", {
  rowCenteredY: true,
  marginRight: rem(8),

  "&:last-of-type": {
    marginRight: 0,
  },
});

const TooltipValue = styled("div", {
  subtitle2: true,

  "& > span": {
    fontWeight: 400,
  },

  "@md": {
    subtitle1: true,
  },
});

const TooltipLabel = styled("div", {
  body1: true,

  rowCenteredY: true,
  marginRight: rem(4),
});

const TooltipLegend = styled("div", {
  background: "var(--tooltip-value-color)",
  display: "flex",
  marginRight: rem(6),
  height: rem(8),
  width: rem(8),
  borderRadius: rem(3),
});

const TooltipLine = styled("div", {
  position: "absolute",
  width: rem(0),
  borderLeft: `${rem(2)} dotted $gray500`,
  transform: `translate(${rem(-1)},0)`,
  zIndex: -1,
});

const DataSource = styled("div", {
  zIndex: 0,
  rowCenteredY: true,
  body3: true,
  textDecoration: "none",
  wordBreak: "keep-all",
  color: "$gray700",
  whiteSpace: "nowrap",

  "@md": {
    left: rem(8),
    body2: true,
  },

  variants: {
    absolute: {
      true: {
        position: "absolute",
        left: rem(6),
        top: rem(5),
      },
    },
  },
});

export default ChartVisualiser;
