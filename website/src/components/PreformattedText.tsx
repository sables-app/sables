import { withProps } from "@sables/framework";

import { Box } from "@chakra-ui/react";
import { ComponentPropsWithoutRef, createContext, useContext } from "react";

const PreformattedTextContext = createContext(false);

const PreBox = withProps(Box, {
  as: "pre",
  background: "codeBlock.background",
  color: "codeBlock.color",
  fontFamily: "pre",
  fontSize: "article.pre",
  overflowX: "auto",
  padding: "4",
  borderRadius: "0.5rem",
  marginTop: "6",
  marginBottom: "6",
});

export function PreformattedText({
  children,
  ...otherProps
}: ComponentPropsWithoutRef<typeof PreBox>) {
  return (
    <PreBox {...otherProps}>
      <PreformattedTextContext.Provider value={true}>
        {children}
      </PreformattedTextContext.Provider>
    </PreBox>
  );
}

export function useIsInsidePreformattedText() {
  return useContext(PreformattedTextContext);
}
