import { withProps } from "@sables/framework";

import { Text } from "@chakra-ui/react";
import { ComponentProps } from "react";

import { useIsInsidePreformattedText } from "./PreformattedText.js";

const CodeBase = withProps(Text, {
  as: "code",
  fontFamily: "pre",
  fontSize: "article.pre",
});

const InlineCode = withProps(CodeBase, {
  backgroundColor: "#352f34",
  borderRadius: "0.25rem",
  color: "tan.200",
  padding: "0.1875rem 0.3rem",
});

export function Code({ children }: ComponentProps<"code">) {
  const isInlineCode = !useIsInsidePreformattedText();
  const Component = isInlineCode ? InlineCode : CodeBase;

  return <Component>{children}</Component>;
}
