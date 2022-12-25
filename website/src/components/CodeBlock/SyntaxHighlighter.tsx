import { ComponentProps, ReactNode } from "react";
import SyntaxHighlighterBase from "react-syntax-highlighter";
import { nord } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { Box } from "../../../deps.js";
import { Code } from "../Code.js";
import { CopyButton } from "../CopyButton.js";
import { PreformattedText } from "../PreformattedText.js";

const languageByProp: Partial<Record<string, string>> = {
  bash: "sh",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
};

function resolveLanguage(language?: string) {
  return (language && languageByProp[language]) || language;
}

function PreTag({
  children,
  copyText,
}: {
  children: ReactNode;
  copyText: string;
}) {
  return (
    <Box position="relative">
      <CopyButton
        display="block"
        position="absolute"
        right="0.6875rem" // 11px
        text={copyText}
        top="0.6875rem" // 11px
      />
      <PreformattedText>{children}</PreformattedText>
    </Box>
  );
}

/**
 * A component to enable lazy-loading of `react-syntax-highlighter`,
 * because its `highlight.js` dependency is huge.
 *
 * @internal
 */
export default function SyntaxHighlighter({
  language,
  ...otherProps
}: ComponentProps<typeof SyntaxHighlighterBase>) {
  return (
    <SyntaxHighlighterBase
      CodeTag={Code}
      language={resolveLanguage(language)}
      PreTag={PreTag}
      style={nord}
      // This is untyped, but passed to `PreTag`.
      copyText={otherProps.children}
      {...otherProps}
    />
  );
}
