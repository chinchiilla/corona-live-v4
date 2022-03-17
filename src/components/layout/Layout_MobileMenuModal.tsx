import React from "react";

import { rem } from "polished";
import { useTranslation } from "react-i18next";

import { useTheme } from "@contexts/ThemeContext";
import { css, styled } from "@styles/stitches.config";

import Row from "@components/Row";
import Switch from "@components/Switch";
import Section from "@components/Section";
import { Modal } from "@components/Modal";
import NightIcon from "@components/icon/Icon_Night";
import SendMessageIcon from "@components/icon/Icon_SendMessage";
import ReportModalTrigger from "@components/modal/Modal_Report";

import LayoutFooter from "./Layout_Footer";
import LanguageIcon from "@components/icon/Icon_Language";
import { useSwitchLanguage } from "@hooks/useSwitchLanguage";

interface Props {}

const LayoutMobileMenuModalTrigger: React.FC<Props> = ({ children }) => {
  const { t, i18n } = useTranslation();

  const { colorMode, toggleTheme } = useTheme();

  const switchLanguage = useSwitchLanguage();

  return (
    <Modal
      modalId="menu"
      triggerNode={children}
      title={t("menu")}
      showCloseButton
      className={css({
        width: "85%",
        padding: rem(16),
        background: "$background!important",

        "@md": {
          maxWidth: rem(360),
        },
      })}
      asChild
    >
      <Wrapper>
        <Section border>
          <MenuThemeContainer>
            <Row centeredY>
              <NightIcon />
              <MenuText>{t("menu.dark_mode")}</MenuText>
            </Row>
            <Switch onClick={toggleTheme} checked={colorMode === "dark"} />
          </MenuThemeContainer>

          <MenuThemeContainer >
            <Row centeredY>
              <LanguageIcon size={16} />
              <MenuText>{t(i18n.resolvedLanguage)}</MenuText>
            </Row>
            <LanguageButton onClick={switchLanguage}>
              {t(i18n.resolvedLanguage === "en" ? "ko" : "en")}
            </LanguageButton>
          </MenuThemeContainer>

          <ReportModalTrigger>
            <MenuContainer>
              <SendMessageIcon />
              <MenuText>{t("menu.report")}</MenuText>
            </MenuContainer>
          </ReportModalTrigger>
        </Section>
      </Wrapper>
      <LayoutFooter simplified />
    </Modal>
  );
};

const Wrapper = styled("div", {
  column: true,

  "& button": {
    color: "$gray900",
  },
});

const MenuContainer = styled("div", {
  rowCenteredY: true,
  paddingY: rem(20),
  paddingX: rem(16),
  cursor: "pointer",

  borderTop: `${rem(1)} solid rgba($gray900rgb,0.1)`,

  "&:first-of-type": {
    borderTop: "none",
  },
});

const MenuThemeContainer = styled(MenuContainer, {
  alignItems: "center",
  justifyContent: "space-between",
  flex: 1,
  cursor: "default",
});

const LanguageButton = styled("div", {
  caption1: true,
  background: "$gray200",
  color: "$gray800",
  fontWeight: 500,
  paddingX: rem(8),
  paddingY: rem(2),
  borderRadius: rem(4),
  cursor: "pointer",
});

const MenuText = styled("div", {
  body2: true,
  marginLeft: rem(12),
  whiteSpace: "nowrap",
});

export default LayoutMobileMenuModalTrigger;
