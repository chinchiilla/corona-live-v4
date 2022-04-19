import React, { useRef, useState } from "react";

import { rem } from "polished";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { styled, theme } from "@styles/stitches.config";

import {
  EMAIL,
  GITHUB_URL,
  INSTA_URL,
  TWITTER_URL,
} from "@constants/constants";
import { useTimeoutState } from "@hooks/useTimeoutState";
import { fadeInUp } from "@styles/animations/fade-animation";

import EmailIcon from "./icon/Icon_Email";
import CheckIcon from "./icon/Icon_Check";
import GithubIcon from "./icon/Icon_Github";
import TwitterIcon from "./icon/Icon_Twitter";
import InstagramIcon from "./icon/Icon_Instagram";
import useUpdateEffect from "@hooks/useUpdatedEffect";

const IconButton = styled("a", {
  width: rem(34),
  height: rem(34),
  borderRadius: rem(8),
  marginX: rem(8),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
});

export const TwitterIconButton: React.FC = () => (
  <IconButton
    css={{ background: "$sky100" }}
    href={TWITTER_URL}
    target="_blank"
  >
    <TwitterIcon size={14} stroke={theme.colors.sky500} />
  </IconButton>
);

export const EmailIconButton: React.FC = () => {
  const [copied, setCopied] = useTimeoutState(false, 1000);
  const [isUpdated, setIsUpdated] = useState(false);

  useUpdateEffect(() => {
    if (isUpdated === false) {
      setIsUpdated(true);
    }
  }, [copied]);

  return (
    <CopyToClipboard
      text={EMAIL}
      onCopy={() => {
        setCopied(true);
      }}
    >
      <IconButton css={{ background: "$gold100" }}>
        {copied ? (
          <IconContainer key={"copied"} animate={isUpdated}>
            <CheckIcon size={18} fill={theme.colors.gold500} />
          </IconContainer>
        ) : (
          <IconContainer key={"not-copied"} animate={isUpdated}>
            <EmailIcon size={18} fill={theme.colors.gold500} />
          </IconContainer>
        )}
      </IconButton>
    </CopyToClipboard>
  );
};

const IconContainer = styled("div", {
  centered: true,

  variants: {
    animate: {
      true: {
        animation: `${fadeInUp} 350ms`,
      },
    },
  },
});

export const InstagramIconButton: React.FC = () => (
  <IconButton css={{ background: "$pink100" }} href={INSTA_URL} target="_blank">
    <InstagramIcon size={14} />
  </IconButton>
);

export const GithubIconButton: React.FC = () => (
  <IconButton
    css={{ background: "$gray100" }}
    href={GITHUB_URL}
    target="_blank"
  >
    <GithubIcon size={16} />
  </IconButton>
);
