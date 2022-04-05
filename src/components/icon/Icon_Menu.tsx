import React from "react";

import Icon from "./Icon";

import type { IconProps } from "@_types/icon-type";

const MenuIcon: React.FC<IconProps> = React.memo((props) => (
  <Icon {...props}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24px"
      height="24px"
    >
      <path d="M2 11H22V13H2zM2 5H22V7H2zM2 17H22V19H2z" />
    </svg>
  </Icon>
));

export default MenuIcon;
