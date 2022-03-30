import React, { useEffect, useRef, useState } from "react";

import { rem } from "polished";
import { useTranslation } from "react-i18next";
import { CSSProperties } from "@stitches/react";

import useMounted from "@hooks/useMounted";
import { css, styled } from "@styles/stitches.config";

import Child from "./Child";

import type { CssComponent } from "@stitches/react/types/styled-component";

interface TabsProps<T extends any> {
  value: T;
  onChange?: (value: T) => void;
  orientation?: "horizontal" | "vertical";

  tabIndicatorType?: "underline" | "contained";
  tabIndicatorLengthType?: "tab" | "text";
  tabIndicatorTransform?: string;
  children: React.ReactChild[];

  delay?: boolean;
  scrollable?: boolean;
  animation?: boolean;

  css?: CssComponent;
  tabCss?: CssComponent;
  tabTextCss?: CssComponent;
  tabIndicatorCss?: CssComponent;
  activeTabTextCss?: CssComponent;
}

const defaultTabStyle: CSSProperties = {
  cursor: "pointer",
};

const underlinTabCss = {
  css: css({}),
  tabCss: css({}),
  tabTextCss: css({}),
  tabIndicatorCss: css({}),
  activeTabTextCss: css({
    subtitle1: true,
  }),
};

const containedTabCss = {
  css: css({
    background: "$gray100",
    borderRadius: rem(12),
  }),
  tabCss: css({
    flex: 1,
    rowCenteredY: true,
    justifyContent: "center",
    height: rem(40),
  }),
  tabTextCss: css({
    body2: true,
    wordBreak: "keep-all",
    "&[data-disabled=true]": {
      fontSize: rem(1),
    },
  }),
  activeTabTextCss: css({
    subtitle3: true,
    wordBreak: "keep-all",
  }),
  tabIndicatorCss: css({
    borderRadius: rem(12),
    boxShadow: "$subSectionBoxShadow",

    background: "$shadowBackground1",
    border: `${rem(1)} solid $chartOptionBorder`,
  }),
};

const TRANSITION_DURATION = 300; // ms

export const Tabs = <T extends any>({
  value,
  css,
  tabCss,
  tabTextCss,
  activeTabTextCss,
  tabIndicatorCss,
  orientation = "horizontal",
  tabIndicatorType = "underline",
  tabIndicatorLengthType = "tab",
  onChange,
  scrollable,
  children: childrenProps,
  tabIndicatorTransform,
  delay = false,
  animation = true,
}: TabsProps<T>) => {
  const [tabValue, setTabValue] = useState(value);
  const { i18n } = useTranslation();

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabValueToIndex = new Map();
  const mounted = useMounted();

  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({});
  const indicatorStyleInitialised = useRef(false);

  const defaultTabCss =
    tabIndicatorType === "underline" ? underlinTabCss : containedTabCss;

  useEffect(() => {
    setTabValue(value);
  }, [value]);

  const getTabsMeta = () => {
    const tabs = tabsRef.current;
    const tabsDomRect = tabs?.getBoundingClientRect();

    const activeTabChild =
      tabValue !== undefined
        ? tabsRef.current?.children[tabValueToIndex.get(tabValue)]
        : undefined;
    const activeTab =
      tabIndicatorLengthType === "tab"
        ? activeTabChild
        : activeTabChild?.querySelector("div");

    const activeTabDomRect = activeTab?.getBoundingClientRect();

    return {
      tabs,
      activeTab,
      tabsDomRect,
      activeTabDomRect,
    };
  };

  const updateIndicatorStyle = (config?: { init: boolean }) => {
    const { tabsDomRect, activeTabDomRect, activeTab } = getTabsMeta();

    if (activeTabDomRect === undefined) {
      setIndicatorStyle({});
    } else if (activeTabDomRect?.width && activeTabDomRect?.height) {
      const isHorizontal = orientation === "horizontal";

      const lengthProperty = isHorizontal ? "width" : "height";
      const lengthValue = activeTabDomRect?.[lengthProperty];

      const thicknessProperty = isHorizontal ? "height" : "width";
      const thicknessValue = tabIndicatorType === "underline" ? 2 : "100%";

      const posProperty = isHorizontal ? "left" : "top";
      const posValue =
        activeTabDomRect?.[posProperty] - (tabsDomRect?.[posProperty] ?? 0);

      const style: CSSProperties = {
        [lengthProperty]: lengthValue,
        [thicknessProperty]: thicknessValue,
        transform: `translate3d(${posProperty === "left" ? rem(posValue) : 0},${
          posProperty === "top" ? rem(posValue) : 0
        },0) ${tabIndicatorTransform ?? ""}`,
        ...(indicatorStyleInitialised.current && animation === true
          ? {
              transition: `all ${TRANSITION_DURATION}ms ease`,
              transitionProperty: "transform, width, height",
            }
          : {}),
      };

      indicatorStyleInitialised.current = true;

      setIndicatorStyle(style);
    }
  };

  useEffect(() => {
    updateIndicatorStyle();
  }, [tabValue, childrenProps.length]);

  const firstMount = useRef(true);

  useEffect(() => {
    if (firstMount.current === false) {
      setTimeout(() => {
        updateIndicatorStyle();
      }, 0);
    }
    firstMount.current = false;
  }, [i18n.language]);

  const children = React.Children.map(childrenProps, (child, index) => {
    if (!React.isValidElement(child)) {
      return null;
    }
    const childValue = child.props.value ?? index;
    const childStyle = {
      ...defaultTabStyle,
      ...(child.props.style ?? {}),
    };
    tabValueToIndex.set(childValue, index);

    return React.cloneElement(child, {
      onChange: (value) => {
        if (delay) {
          setTabValue(value);
          setTimeout(() => {
            onChange(value);
          }, TRANSITION_DURATION);
        } else {
          onChange(value);
        }
      },
      value: childValue,
      style: childStyle,
      tabCss: tabCss ?? defaultTabCss.tabCss,
      tabTextCss: tabTextCss ?? defaultTabCss.tabTextCss,
      activeTabTextCss: activeTabTextCss ?? defaultTabCss.activeTabTextCss,
      active: childValue === (delay ? tabValue : value),
    });
  });

  return (
    <TabsWrapper scrollable={scrollable}>
      <TabsContainer
        ref={tabsRef}
        orientation={orientation}
        className={(css ?? defaultTabCss.css) as any}
      >
        {children}
      </TabsContainer>
      {mounted && (
        <TabIndicator
          orientation={orientation}
          style={indicatorStyle as any}
          className={(tabIndicatorCss ?? defaultTabCss.tabIndicatorCss) as any}
        />
      )}
    </TabsWrapper>
  );
};

const TabsWrapper = styled("div", {
  position: "relative",

  variants: {
    scrollable: {
      true: {
        overflowX: "auto",
        row: true,
        flexWrap: "nowrap",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      },
    },
  },
});

const TabsContainer = styled("div", {
  variants: {
    orientation: {
      horizontal: {
        row: true,
      },
      vertical: {
        column: true,
      },
    },
  },
});

const TabIndicator = styled("div", {
  position: "absolute",

  willChange: "transform, width, height",

  variants: {
    orientation: {
      horizontal: {
        bottom: 0,
      },
      vertical: {
        top: 0,
      },
    },
  },
});

export interface TabProps<T = any> {
  text?: string;
  icon?: React.ReactNode;
  value?: T;
  onChange?: (value: string) => void;
  tabCss?: CssComponent;
  tabTextCss?: CssComponent;
  activeTabTextCss?: CssComponent;
  indicator?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}

export const Tab: React.FC<TabProps> = ({
  text,
  icon,
  value,
  onChange,
  tabCss,
  tabTextCss,
  activeTabTextCss,
  indicator,
  children,
  active,
  disabled,
  ...props
}) => {
  const handleClick = () => {
    if (!disabled) {
      setTimeout(() => {
        onChange?.(value!);
      }, 0);
    }
  };

  if (!children) {
    return (
      <TabWrapper
        onClick={handleClick}
        className={tabCss as any}
        disabled={disabled}
        active={active}
        {...props}
      >
        {icon}
        <TabText
          className={`${active && activeTabTextCss} ${!active && tabTextCss} `}
        >
          {text}
        </TabText>
      </TabWrapper>
    );
  } else if (React.Children.toArray(children).length === 1) {
    return React.cloneElement(<Child>{children}</Child>, {
      ...props,
      onClick: handleClick,
      value,
    });
  } else {
    return (
      <>
        <TabWrapper
          disabled={disabled}
          onClick={handleClick}
          className={tabCss as any}
          active={active}
          {...props}
        >
          {children}
        </TabWrapper>
        {indicator}
      </>
    );
  }
};

const TabText = styled("div", {
  zIndex: 1,
});

const TabWrapper = styled("div", {
  paddingX: rem(16),
  paddingY: rem(4),
  flexShrink: 0,

  "&, & > *": {
    zIndex: 1,
  },

  "& svg + div": {
    marginLeft: rem(8),
  },

  transition: "opacity 300ms",

  variants: {
    active: {
      true: {
        fontWeight: 700,
        color: "$gray900 ",
      },
    },
    disabled: {
      true: {
        opacity: 0.3,
      },
    },
  },
});

interface TabContainerProps {
  visible?: boolean;
}

export const TabContainer: React.FC<TabContainerProps> = ({
  visible,
  children,
}) => {
  return visible ? <>{children}</> : <></>;
};
