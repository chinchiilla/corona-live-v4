import React, { useMemo, useState } from "react";

import { rem } from "polished";
import { useTranslation } from "react-i18next";

import { styled } from "@styles/stitches.config";
import { useInterval } from "@hooks/useInterval";
import { numberWithCommas } from "@utils/number-util";
import { chunkArray, createEmptyArray } from "@utils/array-util";

import Space from "./Space";
import Column from "./Column";
import Skeleton from "./Skeleton";
import DeltaTag from "./DeltaTag";
import { SubSection } from "./Section";
import {
  LiveUpdatesRow,
  ILiveUpdatesRow,
  LiveUpdatesRowSkeleton,
} from "./live-updates/LiveUpdates_Row";

export interface LiveBoardComparedValue {
  label: string;
  delta: number;
}

interface Props {
  currentValue: number;
  currentValueLabel: string;
  comparedValues: Array<LiveBoardComparedValue>;
  updates: Array<ILiveUpdatesRow>;
  updatesModalTrigger?: React.ReactNode;
}

export const LiveBoard: React.FC<Props> = ({
  currentValueLabel,
  currentValue,
  comparedValues,
  updates,
  updatesModalTrigger,
}) => {
  const { t } = useTranslation();

  const [activeUpdateId, setActiveUpdateId] = useState(0);

  useInterval(
    () => {
      setActiveUpdateId((prev) => (prev + 1) % updates.length);
    },
    5000,
    []
  );

  const chunckedComparedValues = useMemo(
    () => chunkArray(comparedValues, 2),
    [comparedValues]
  );

  const isLargeValue = `${currentValue}`.length > 5;

  return (
    <Wrapper>
      <StatsContainer>
        <CurrentValueContainer>
          <CurrentValueLabel largeValue={isLargeValue}>
            {currentValueLabel}
          </CurrentValueLabel>
          <CurrentValue largeValue={isLargeValue}>
            {numberWithCommas(currentValue)}
            <span>{t("stat.unit")}</span>
          </CurrentValue>
        </CurrentValueContainer>
        {chunckedComparedValues.map((column, index) => (
          <Column key={index}>
            {column.map(({ delta, label }) => (
              <ComparedValueContainer key={label}>
                <ComparedValueLabel>{label}</ComparedValueLabel>
                <DeltaTag delta={delta} small />
              </ComparedValueContainer>
            ))}
          </Column>
        ))}
      </StatsContainer>

      {updates?.length > 0 ? (
        React.cloneElement(updatesModalTrigger as JSX.Element, {
          children: (
            <LiveUpdatesContainer>
              {updates.map(
                (update, index) =>
                  activeUpdateId === index && (
                    <LiveUpdatesRow
                      key={update.date}
                      fadeInUp
                      type="preview"
                      {...update}
                    />
                  )
              )}
            </LiveUpdatesContainer>
          ),
        })
      ) : (
        <LiveUpdatesContainer>
          <MockLiveUpdatesRow>추가 확진자가 없어요</MockLiveUpdatesRow>
        </LiveUpdatesContainer>
      )}
    </Wrapper>
  );
};

export const LiveBoardSkeleton: React.FC<{ columns: number }> = ({
  columns,
}) => {
  return (
    <Wrapper>
      <StatsContainer>
        <CurrentValueContainer>
          <CurrentValueLabel>
            <Skeleton w={42} h={17} />
          </CurrentValueLabel>
          <Space h={8} />
          <CurrentValue>
            <Skeleton w={75} h={28} />
          </CurrentValue>
        </CurrentValueContainer>
        {createEmptyArray(columns, 2).map((column, index) => (
          <Column key={index}>
            {column.map((_, index) => (
              <ComparedValueContainer key={index}>
                <Skeleton w={50} h={20} />
                <Space w={6} />
                <Skeleton w={60} h={20} />
              </ComparedValueContainer>
            ))}
          </Column>
        ))}
      </StatsContainer>
      <LiveUpdatesRowSkeleton type="preview" />
    </Wrapper>
  );
};

const Wrapper = styled("div", {
  column: true,
  overflow: "hidden",
});

const StatsContainer = styled(SubSection, {
  rowCenteredY: true,
  paddingY: rem(12),
  justifyContent: "space-evenly",
});

const CurrentValueContainer = styled("div", {
  columnCenteredX: true,
});
const CurrentValueLabel = styled("div", {
  body3: true,
  whiteSpace: "nowrap",
  color: "$gray900",
  opacity: 0.8,
  paddingTop: rem(2),

  variants: {
    largeValue: {
      true: {
        paddingTop: rem(4),
        "@md": {
          padding: rem(2),
        },
      },
    },
  },

  "@md": {
    body3: true,

    opacity: 0.9,
  },
});
const CurrentValue = styled("div", {
  heading1: true,
  color: "$gray900",
  lineHeight: rem(36),

  variants: {
    largeValue: {
      true: {
        fontSize: rem(24),
        "@md": {
          heading1: true,
        },
      },
    },
  },

  "& span": {
    display: "none",
    fontWeight: 400,
  },

  "@md": {
    lineHeight: rem(38),

    "& span": {
      display: "initial",
    },
  },
});

const MockLiveUpdatesRow = styled("div", {
  body2: true,
  centered: true,

  height: rem(50),
  color: "$gray900",
});

const ComparedValueContainer = styled("div", {
  rowCenteredY: true,
  marginY: rem(5),
});

const ComparedValueLabel = styled("div", {
  body3: true,

  color: "$gray900",
  marginRight: rem(2),
  minWidth: rem(50),
  maxWidth: rem(50),

  "&:before": {
    content: "vs",
    marginRight: rem(4),
    color: "$gray700",
  },
});

const LiveUpdatesContainer = styled("div", {});
