import React from "react";

import { rem } from "polished";

import { styled } from "@styles/stitches.config";
import { CITY_NAME_LIST } from "@constants/constants";

import Space from "@components/Space";
import Section from "@components/Section";

import LayoutFooter from "./Layout_Footer";
import LayoutDesktopMenu from "./Layout_DesktopMenu";
import LayoutMobileHeader from "./Layout_MobileHeader";

interface Props {
  hideMobileHeader?: boolean;
}

const Layout: React.FC<Props> = ({ children, hideMobileHeader }) => {
  return (
    <Wrapper>
      <LayoutDesktopMenu />
      <Column>
        {hideMobileHeader !== true && <LayoutMobileHeader />}
        <Content>{children}</Content>
        <Section css={{ margin: 0 }}>
          <LayoutFooter />
        </Section>
        <Space h={{ _: 0, md: 20 }} />
      </Column>

      <div className="gnb" style={{ position: "absolute", top: rem(-9999) }}>
        <a href="/">실시간</a>
        <a href="/vaccine">백신</a>
        <a href="/world">세계</a>
        <a href="/city/0">서울</a>
        <a href="/city/8">경기</a>
        <a href="/city/1">부산</a>
      </div>

      <div style={{ position: "absolute", top: rem(-9999) }}>
        {CITY_NAME_LIST.map((cityName, index) => (
          <a key={index} href={`/city/${index}/`}>
            {cityName}
          </a>
        ))}
      </div>
    </Wrapper>
  );
};

const Wrapper = styled("div", {
  rowCenteredX: true,
  background: "$mobileBackground",
  height: "max-content",
  width: "100vw",

  "@md": {
    background: "$background",
    paddingY: rem(40),
  },
});

const Column = styled("div", {
  column: true,
  width: "100%",
  position: "relative",

  "@md": {
    width: rem(500),
  },
});

const Content = styled("main", {
  width: "100%",
  column: true,
  position: "relative",
});

export default Layout;
