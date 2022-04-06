import { rem } from "polished";

import { createTheme } from "@styles/stitches.config";

export const darkTheme = createTheme("dark-theme", {
  colors: {
    /**
     * white
     */
    white: "#191F2C",

    whiteA100: "#191F2CFF",
    whiteA050: "#191F2C80",
    whiteA000: "#191F2C00",

    /**
     * gray
     */

    gray900: "#CFCFCF",
    gray800: "#C8C9CD",
    gray700: "#828284",
    gray600: "#FFFFFF",
    gray500: "#7E8186",
    gray400: "#999999",
    gray300: "#444954",
    gray200: "#2b2f3b",
    gray100: "#272B38",

    grayA100: "#999999FF",
    grayA050: "#99999930",
    grayA000: "#99999900",

    gray900rgb: "207, 207, 207",

    /**
     * blue
     */
    blue500: "#5673EB",
    blue400: "#3D4D8E",
    blue300: "#354684",
    blue200: "#30395C",
    blue100: "#1E253B",

    blueA100: "#5673EBFF",
    blueA050: "#5673EB75",
    blueA000: "#5673EB00",

    /**
     * red
     */
    red500: "#EB5374",
    red100: "#EB537415",

    /**
     * sky
     */
    sky500: "#4A9AE5",
    sky100: "#4A9AE530",

    /**
     * pink
     */
    pink500: "#bf2e70",
    pink100: "#bf2e7030",

    /* */
    background: "#0F1421",
    mobileBackground: "#0F1421",

    shadowBackground1: "#272B38",
    shadowBackground2: "#202633",

    mapStroke: "37498C",
    mapLabelBackground: "#262A37",

    sectionBorder: "#303540",
    subSectionBorder: "#393A3D",

    chartOptionBorder: "#646464",

    donationButtonBorder: "#555555",

    switchBackground: "rgba($gray900rgb,0.1)",
    switchThumbBackground: "#C8C9CD",
  },
  shadows: {
    elevation1: `rgb(0 0 0 / 4%) 0rem ${rem(2)} ${rem(10)} 0rem`,
    elevation2: `rgb(0 0 0 / 3%) ${rem(-1)} ${rem(1)} ${rem(6)}  0rem`,

    subSectionBoxShadow: `rgb(11 12 19 / 70%) ${rem(-1)} ${rem(1)} ${rem(20)}`,
  },
});
