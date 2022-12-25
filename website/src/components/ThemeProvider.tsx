import { ComponentPropsWithoutRef, ReactNode, useRef } from "react";

import { Box, ChakraProvider, extendTheme, useColorMode } from "../../deps.js";

const theme = extendTheme({
  initialColorMode: "dark",
  useSystemColorMode: false,
  styles: {
    global: {
      "html, body": {
        bgColor: "dark.200",
        color: "tan.250",
      },
    },
  },
  fonts: {
    heading: `'Noto Serif KR', serif`,
    body: `'Noto Sans', serif`,
    pre: `'Roboto Mono', monospace`,
  },
  colors: {
    blue: {
      "100": "#2740A8",
      "200": "#4997C8",
      "300": "#6CCCF0",
    },
    dark: {
      "100": "#140F13",
      "150": "#1B181B",
      "200": "#231E22",
      "300": "#322D31",
      "400": "#454351",
      "500": "#5C5A6C",
    },
    grey: {
      "100": "#5B658C",
      "200": "#707C99",
      "300": "#777586",
      "350": "#7e95a4",
      "400": "#ACA9BB",
    },
    red: {
      "100": "#DB454E",
      "200": "#FF636C",
      "300": "#EA868C",
    },
    tan: {
      "100": "#BD8B7D",
      "200": "#F2C4A9",
      "250": "#D3D0CF",
      "300": "#EEE4E5",
    },
    warm: {
      "350": "#FF975A",
    },
    codeBlock: {
      background: "#2e3440",
      color: "#d8dee9",
    },
    tableCode: {
      background: "#495162",
      color: "#eaf1ff",
    },
  },
  fontSizes: {
    article: {
      body: "1.0625rem",
      pre: "0.9375rem",
    },
  },
  sizes: {
    article: {
      aside: "13rem",
      asideWide: "17rem",
      content: "30rem",
    },
    container: {
      wide: "1440px",
    },
  },
  space: {
    article: {
      thickGutter: "3rem",
    },
  },
});

/**
 * Because `ColorModeScript` doesn't work.
 */
function ForceColorModeDark() {
  const { colorMode, toggleColorMode } = useColorMode();
  // Using a ref instead of `useEffect` to perform the
  // toggling before the component tree is mounted.
  const hasRenderedRef = useRef(false);

  if (hasRenderedRef.current) return null;

  hasRenderedRef.current = true;

  if (colorMode === "light" && typeof window == "object") {
    // `queueMicrotask` is necessary to avoid updating the component state
    // of `ChakraProvider` while rendering this component.
    // This is because we're not using `useEffect` for this.
    queueMicrotask(toggleColorMode);
  }

  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider resetCSS theme={theme}>
      <ForceColorModeDark />
      {children}
    </ChakraProvider>
  );
}

export const articleContentGutter = [2, 8, 12, 12, 20];

export const bodyFontProps: ComponentPropsWithoutRef<typeof Box> = {
  fontFamily: "Noto Sans",
  fontWeight: 400,
};
