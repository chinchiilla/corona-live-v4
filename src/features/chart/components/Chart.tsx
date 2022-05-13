import React, { useEffect, useRef, useState } from "react";

import { rem } from "polished";
import { Presence } from "@radix-ui/react-presence";

import { styled, theme } from "@styles/stitches.config";
import { fadeIn, fadeOut } from "@styles/animations/fade-animation";

import useChartSize from "@hooks/useChartSize";
import useUpdateEffect from "@hooks/useUpdatedEffect";
import useDebounceState from "@hooks/useDebounceState";

import ChartVisualiser from "./Chart_Visualiser";
import ChartSubOptions from "./Chart_SubOptions";
import ChartMainOptions from "./Chart_MainOptions";

import Row from "@components/Row";
import Space from "@components/Space";
import Column from "@components/Column";
import Loader from "@components/Loader";
import Render from "@components/Render";
import Gradient from "@components/Gradient";
import Skeleton from "@components/Skeleton";
import { SubSection } from "@components/Section";
import ExpandIcon from "@components/icon/Icon_Expand";

import useChartReducer from "@features/chart/hooks/useChartReducer";
import type { ChartMode, ChartProps } from "@features/chart/chart-type";
import { useTranslation } from "react-i18next";

const Chart = <MainOption extends string, SubOption extends string>(
  props: ChartProps<MainOption, SubOption>
) => {
  const { getChartData, forceUpdate, enableExpandMode = false } = props;
  const { i18n } = useTranslation();
  const [
    {
      chartData,
      mainOptions,
      subOptions,
      selectedSubOptions,
      selectedMainOption,
      mode: _mode,
      selectedX,
    },
    dispatch,
  ] = useChartReducer<MainOption, SubOption>(props);

  const contentRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState(_mode);
  const [isLoading, setIsLoading] = useDebounceState(false);
  const [wrapperHeight, setWrapperHeight] = useState("auto");

  const setSelectedX = (value) => {
    dispatch({ type: "SET_SELECTEDX", payload: { value } });
  };

  useUpdateEffect(() => {
    dispatch({ type: "INIT_OPTIONS", payload: { props } });
  }, [i18n.resolvedLanguage]);

  useEffect(() => {
    if (props?.defaultMode !== undefined && mode !== props?.defaultMode)
      dispatch({ type: "TOGGLE_MODE" });
  }, [props?.defaultMode]);

  const updateChartData = async (shouldInvalidate: boolean = false) => {
    setIsLoading(true);
    const chartData = await getChartData(
      selectedMainOption,
      selectedSubOptions,
      { mode: _mode, shouldInvalidate }
    );
    if (chartData) {
      dispatch({
        type: "SET_CHART_DATA",
        payload: { chartData: [].concat(chartData) },
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isLoading === false || forceUpdate) {
      updateChartData();
    }
  }, [selectedMainOption, selectedSubOptions, i18n.resolvedLanguage]);

  useUpdateEffect(() => {
    if (isLoading === false || forceUpdate) {
      updateChartData(true);
    }
  }, [forceUpdate]);

  const onOptionChange = (optionName: string, value: SubOption) => {
    dispatch({ type: "SET_SUB_OPTION", payload: { optionName, value } });
  };

  const onStatChange = (value: MainOption) => {
    dispatch({ type: "SET_MAIN_OPTION", payload: { value } });
  };

  const toggleChartMode = async () => {
    dispatch({ type: "TOGGLE_MODE" });
    await updateChartData();
  };

  useEffect(() => {
    if ((_mode === "EXPANDED" && chartData.length > 1) || _mode === "DEFAULT") {
      setTimeout(() => {
        const { height } = contentRef.current.getBoundingClientRect();
        if (height) setWrapperHeight(rem(height));
      }, 0);
      setMode(_mode);
    }
  }, [_mode, chartData, isLoading]);

  const resetSelectedX = () => {
    dispatch({ type: "RESET_SELECTED_X" });
  };

  const chartVisualiserProps = {
    mode,
    selectedX,
    setSelectedX,
    resetSelectedX,
  };

  return (
    <Wrapper style={{ height: wrapperHeight }}>
      <Content ref={contentRef}>
        <Presence present={isLoading}>
          <LoadingContainer data-state={isLoading ? "show" : "hide"}>
            <Loader />
          </LoadingContainer>
        </Presence>

        <ChartHeadingContainer>
          <ChartHeadingOptionsContainer>
            <Render if={mode === "DEFAULT"}>
              <ChartMainOptions
                value={selectedMainOption as any}
                onChange={onStatChange}
                mainOptions={mainOptions}
              />
            </Render>
            <Render if={mode === "EXPANDED"}>
              <Row css={{ paddingY: rem(8), paddingX: rem(8), flex: 1 }}>
                <ChartSubOptions
                  values={selectedSubOptions}
                  onChange={onOptionChange}
                  subOptions={subOptions}
                />
              </Row>
            </Render>
            <ChartHeadingOptionsOverflowGradient show={mode === "DEFAULT"}>
              <Gradient color={theme.colors.white.computedValue} />
            </ChartHeadingOptionsOverflowGradient>
          </ChartHeadingOptionsContainer>

          {enableExpandMode && (
            <ChartModeButtonContainer>
              <ChartModeButton onClick={toggleChartMode}>
                <ExpandIcon
                  stroke={theme.colors.gray900}
                  expanded={_mode === "EXPANDED"}
                />
              </ChartModeButton>
            </ChartModeButtonContainer>
          )}
        </ChartHeadingContainer>

        <ChartVisualiserContainer>
          <Render if={mode === "DEFAULT"}>
            <Space h={{ _: 12, md: 16 }} />
            <ChartSubOptions
              values={selectedSubOptions}
              onChange={onOptionChange}
              subOptions={subOptions}
            />
          </Render>

          <FadeInAnimationContainer key={mode}>
            <Render if={mode === "DEFAULT"}>
              <ChartVisualiser {...chartData[0]} {...chartVisualiserProps} />
            </Render>
            <Render if={mode === "EXPANDED"}>
              {chartData.length > 1 ? (
                chartData.map((data, index) => (
                  <ChartVisualiser
                    key={index}
                    {...data}
                    {...chartVisualiserProps}
                    lastIndex={index === chartData.length - 1}
                  />
                ))
              ) : (
                <div style={{ height: rem(500) }}></div>
              )}
            </Render>
          </FadeInAnimationContainer>
        </ChartVisualiserContainer>
      </Content>
    </Wrapper>
  );
};

const Wrapper = styled("div", {
  position: "relative",
  transition: "200ms ease 0s",
});

const Content = styled("div", {});

const ChartHeadingContainer = styled(SubSection, {
  rowCenteredY: true,
  justifyContent: "flex-end",
});

const ChartHeadingOptionsContainer = styled("div", {
  position: "relative",
  rowCenteredY: true,
  flex: 1,
  overflowX: "auto",
});

const ChartHeadingOptionsOverflowGradient = styled("div", {
  position: "absolute",
  right: 0,
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 1,
  display: "none",

  variants: {
    show: {
      true: {
        display: "block",
      },
    },
  },
});

const ChartModeButtonContainer = styled("div", {
  position: "relative",

  marginLeft: rem(2),
  borderLeft: `${rem(1)} solid rgba($gray900rgb, 0.2)`,

  "& path": {
    stroke: "$gray900",
  },
});

const ChartModeButton = styled("div", {
  paddingRight: rem(24),
  paddingLeft: rem(20),
  "&, & *": {
    cursor: "pointer",
  },
});

const Box = styled("div", {});

const ChartVisualiserContainer = styled("div", {
  columnCenteredX: true,
  padding: rem(10),
  paddingTop: rem(0),
  "@md": {
    padding: rem(12),
    paddingTop: rem(0),
  },
});

const LoadingContainer = styled("div", {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
  background: "$whiteA050",
  centered: true,
  zIndex: 1000,

  '&[data-state="show"]': {
    animation: `${fadeIn} 1000ms cubic-bezier(0.16, 1, 0.3, 1)`,
  },
  '&[data-state="hide"]': {
    animation: `${fadeOut} 1000ms cubic-bezier(0.16, 1, 0.3, 1)`,
  },
});

const FadeInAnimationContainer = styled("div", {
  animation: `${fadeIn} 500ms ease 0s`,
});

export const ChartSkeleton = ({
  tabs,
  mode,
  charts,
}: {
  tabs: number;
  mode?: ChartMode;
  charts?: number;
}) => {
  const { height } = useChartSize({ mode });

  if (mode === "EXPANDED") {
    return (
      <Wrapper>
        <SubSection>
          <Box
            css={{
              overflow: "hidden",
              transform: `translate(${rem(-1)}, ${rem(-1)})`,
              height: rem(52),
              paddingX: rem(12),
              rowCenteredY: true,
            }}
          >
            <Row css={{ justifyContent: "space-between", width: "100%" }}>
              <Skeleton w={{ _: 180, md: 108 }} h={36} />
              <Skeleton w={{ _: 120, md: 200 }} h={36} />
            </Row>
          </Box>
        </SubSection>
        {[...Array(charts)].map((_, index) => (
          <ChartVisualiserContainer key={index}>
            <Space h={12} />
            <Row
              css={{
                justifyContent: "space-between",
                width: "100%",
                paddingLeft: rem(8),
                paddingRight: rem(36),
                height: rem(42),
                "@md": {
                  height: rem(46),
                },
              }}
            >
              <Column>
                <Skeleton w={64} h={30} />
                <Space h={6} />
                <Skeleton w={152} h={12} />
              </Column>
              <Skeleton w={100} h={34} />
            </Row>
            <Space h={12} />
            <Skeleton w={{ _: "100%", md: 460 }} h={height - 8} />
          </ChartVisualiserContainer>
        ))}
      </Wrapper>
    );
  }

  return (
    <Wrapper
      css={{
        height: rem(181 + height),
        "@md": {
          height: rem(195 + height),
        },
      }}
    >
      <SubSection>
        <Box
          css={{
            overflow: "hidden",
            transform: `translate(${rem(-1)}, ${rem(-1)})`,
            height: rem(52),
            rowCenteredY: true,
          }}
        >
          {[...Array(tabs)].map((_, index) => (
            <Box
              key={index}
              css={{
                paddingX: rem(12),
                "&:first-of-type": {
                  paddingLeft: rem(20),
                },
                "&:last-of-type": {
                  paddingRight: rem(20),
                },
              }}
            >
              <Skeleton w={{ _: 38, md: 46 }} h={20} />
            </Box>
          ))}
        </Box>
      </SubSection>

      <ChartVisualiserContainer>
        <Space h={16} />
        <Row css={{ justifyContent: "space-between", width: "100%" }}>
          <Skeleton w={{ _: 180, md: 230 }} h={36} />
          <Skeleton w={{ _: 120, md: 150 }} h={36} />
        </Row>
        <Space h={12} />
        <Row
          css={{
            justifyContent: "flex-end",
            width: "100%",
            paddingRight: rem(42),
            height: rem(42),
            "@md": {
              height: rem(46),
            },
          }}
        >
          <Skeleton w={250} h={{ _: 46, md: 54 }} />
        </Row>
        <Space h={12} />
        <Skeleton w={{ _: "100%", md: 460 }} h={height - 8} />
      </ChartVisualiserContainer>
    </Wrapper>
  );
};

export default Chart;
