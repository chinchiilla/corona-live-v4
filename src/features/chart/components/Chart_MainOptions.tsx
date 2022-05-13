import React from "react";

import { rem } from "polished";

import { css } from "@styles/stitches.config";
import { Tab, TabProps, Tabs } from "@components/Tabs";
import { useTranslation } from "react-i18next";

interface Props<T> {
  value: T;
  onChange: (value: T) => void;
  mainOptions: Array<TabProps>;
}

const ChartMainOptions = <T extends string>(props: Props<T>) => {
  const { value, onChange, mainOptions } = props;
  const { i18n } = useTranslation();

  return (
    <Tabs
      {...{
        css: tabsCss,
        tabCss: css({
          paddingX: rem(i18n.resolvedLanguage === "en" ? 8 : 12),
         ...tabCss
        }),
        tabTextCss,
        activeTabTextCss,
        tabIndicatorCss,
      }}
      scrollable
      value={value}
      onChange={onChange}
      tabIndicatorType="underline"
      tabIndicatorLengthType="text"
    >
      {mainOptions.map(({ text, value }) => (
        <Tab key={value} value={value} text={text} />
      ))}
    </Tabs>
  );
};

const tabsCss = css({
  paddingTop: rem(12),
  paddingBottom: rem(10),

  "@md": {
    width: "auto",
    justifyContent: "flex-start",
  },
});

const tabCss = css({
  paddingX: rem(12),
  "&:first-of-type": {
    paddingLeft: rem(20),
  },
  "&:last-of-type": {
    paddingRight: rem(20),
  },
});

const tabTextCss = css({
  subtitle2: true,
  color: "$gray900",
  opacity: 0.5,
  transition: "opacity 300ms",
  whiteSpace: "nowrap",

  "@md": {
    subtitle1: true,
  },
});

const activeTabTextCss = css({
  subtitle2: true,
  color: "$gray900",
  whiteSpace: "nowrap",

  "@md": {
    subtitle1: true,
  },
});

const tabIndicatorCss = css({
  height: `${rem(3)}!important`,
  background: "$gray900",
  borderRadius: rem(2),
  "@md": {
    height: `${rem(3)}!important`,
  },
});

export default ChartMainOptions;
