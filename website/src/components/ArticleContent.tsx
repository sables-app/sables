import { withProps } from "@sables/framework";

import { css } from "@emotion/css";
import type { MDXComponents, MDXContent } from "mdx/types.js";
import {
  Children,
  ComponentProps,
  isValidElement,
  ReactNode,
  useMemo,
} from "react";

import {
  Box,
  Table,
  TableContainer,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "../../deps.js";
import { greenCheckboxSrc } from "../assets/mod.js";
import { ArticleHeadingWithAnchor } from "./ArticleHeading.js";
import { Blockquote } from "./Blockquote.js";
import { Code } from "./Code.js";
import { CodeBlock } from "./CodeBlock/mod.js";
import { Link } from "./Link.js";
import { PreformattedText } from "./PreformattedText.js";

function useCodeBlockPropsFromChild(
  children: ReactNode
): ComponentProps<typeof CodeBlock> | undefined {
  return useMemo(() => {
    const childNodes = Children.toArray(children);
    const [firstChildNode] = childNodes;

    if (
      childNodes.length === 1 &&
      isValidElement(firstChildNode) &&
      firstChildNode.type === Code
    ) {
      const { children, className } = firstChildNode.props;
      const language = className?.split("-").pop();

      return {
        children: String(children),
        language,
      };
    }
  }, [children]);
}

function CodeBlockOrPreformattedText(props: ComponentProps<"pre">) {
  const codeBlockProps = useCodeBlockPropsFromChild(props.children);

  if (codeBlockProps) {
    return <CodeBlock {...codeBlockProps} />;
  }

  return <PreformattedText>{props.children}</PreformattedText>;
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <div
      className={css({
        fontSize: "var(--chakra-fontSizes-article-body)",
        "details summary": {
          color: "var(--chakra-colors-tan-200)",
          fontFamily: "Noto Sans",
          fontSize: "0.875rem",
          fontWeight: "700",
          lineHeight: "1.5rem",
          marginBottom: "1.25rem",
          marginTop: "2rem",
          textTransform: "uppercase",
        },
        ".key-features > ul > li": {
          display: "block",
          lineHeight: "2.5rem",
          marginLeft: "0",
          paddingLeft: "0",
          "&:before": {
            backgroundImage: `url("${greenCheckboxSrc}")`,
            content: `""`,
            display: "inline-block",
            height: "1.5rem",
            marginRight: "1rem",
            verticalAlign: "middle",
            width: "1.5rem",
          },
        },
        dl: {
          margin: "2rem 0",
          "> div": {
            margin: "1rem 0",
            padding: "1rem",
            backgroundColor: "#ffffff09",
            borderRadius: "0.25rem",
            border: "1px solid var(--chakra-colors-dark-400)",
            dt: {
              color: "#fff",
              fontWeight: 700,
            },
            dd: {
              marginTop: "0.5rem",
              p: {
                margin: "0.5rem 0 0",
                lineHeight: "1.75rem",
              },
              ul: {
                marginBottom: "0",
                marginTop: "0.5rem",
              },
            },
          },
        },
        ".table-width-tight": {
          "> div": {
            display: "inline-block",
          },
        },
        ".codeblock-with-title": {
          position: "relative",
          background: "var(--chakra-colors-codeBlock-background)",
          borderRadius: "0.5rem",
          "> p": {
            margin: "0",
            padding: "0.5rem 1rem",
            background: "#0000002e",
            borderRadius: "0.5rem 0.5rem 0 0",
            border: "1px solid #ffffff17",
            code: {
              background: "#ffffff14",
              color: "#ffffffc2",
            },
          },
          "> div": {
            position: "static",
            "> button": {
              top: "0.5rem",
              right: "0.5rem",
            },
          },
          pre: {
            margin: 0,
          },
        },
      })}
    >
      {children}
    </div>
  );
}

const components: MDXComponents = {
  wrapper: Wrapper,
  a: Link,
  blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
  pre: (props) => <CodeBlockOrPreformattedText {...props} />,
  /** The h1 heading is rendered by the `MainHeading` component. */
  h1: () => null,
  h2: ({ children }) => (
    <ArticleHeadingWithAnchor as="h2">{children}</ArticleHeadingWithAnchor>
  ),
  h3: ({ children }) => (
    <ArticleHeadingWithAnchor as="h3">{children}</ArticleHeadingWithAnchor>
  ),
  h4: ({ children }) => (
    <ArticleHeadingWithAnchor as="h4">{children}</ArticleHeadingWithAnchor>
  ),
  h5: ({ children }) => (
    <ArticleHeadingWithAnchor as="h5">{children}</ArticleHeadingWithAnchor>
  ),
  h6: ({ children }) => (
    <ArticleHeadingWithAnchor as="h6">{children}</ArticleHeadingWithAnchor>
  ),
  li: ({ children }) => (
    <Text
      as="li"
      lineHeight="8"
      marginLeft="1rem"
      paddingLeft="0.5rem"
      className={css({
        "> ul, > ol": {
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
        },
      })}
    >
      {children}
    </Text>
  ),
  p: ({ children }) => (
    <Text marginBottom="4" marginTop="4" lineHeight="8">
      {children}
    </Text>
  ),
  ul: ({ children }) => (
    <Box as="ul" marginBottom="6" marginTop="6" marginLeft="0.5rem">
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box as="ol" marginBottom="6" marginTop="6" marginLeft="0.5rem">
      {children}
    </Box>
  ),
  code: Code,
  b: ({ children }) => <Text as="b">{children}</Text>,
  i: ({ children }) => <Text as="i">{children}</Text>,
  u: ({ children }) => <Text as="u">{children}</Text>,
  abbr: ({ children }) => <Text as="abbr">{children}</Text>,
  cite: ({ children }) => <Text as="cite">{children}</Text>,
  del: ({ children }) => <Text as="del">{children}</Text>,
  em: ({ children }) => <Text as="em">{children}</Text>,
  hr: () => (
    <Box
      as="hr"
      borderTopColor="dark.300"
      borderTopStyle="double"
      borderTopWidth="3px"
      margin="0 auto"
      marginBottom="10"
      marginTop="16"
      maxW="32rem"
    />
  ),
  ins: ({ children }) => <Text as="ins">{children}</Text>,
  kbd: ({ children }) => <Text as="kbd">{children}</Text>,
  mark: ({ children }) => <Text as="mark">{children}</Text>,
  s: ({ children }) => <Text as="s">{children}</Text>,
  samp: ({ children }) => <Text as="samp">{children}</Text>,
  sub: ({ children }) => <Text as="sub">{children}</Text>,
  sup: ({ children }) => <Text as="sup">{children}</Text>,
  table: ({ children }) => (
    <TableContainer
      marginTop="8"
      marginBottom="8"
      background="codeBlock.background"
      borderRadius="0.5rem"
      className={css({
        code: {
          background: "var(--chakra-colors-tableCode-background)",
          color: "var(--chakra-colors-tableCode-color)",
        },
      })}
    >
      <Table size="md" variant="simple">
        {children}
      </Table>
    </TableContainer>
  ),
  thead: Thead,
  th: withProps(Th, {
    borderColor: "dark.400",
    color: "tan.200",
    fontFamily: "Noto Sans",
    fontSize: "md",
    fontWeight: "700",
    textTransform: "uppercase",
    paddingTop: "1rem",
    paddingBottom: "1rem",
  }),
  td: withProps(Td, {
    borderColor: "dark.400",
    whiteSpace: "normal",
    verticalAlign: "top",
    fontSize: "87.5%",
    paddingTop: "1rem",
    paddingBottom: "1rem",
  }),
  tr: withProps(Tr, { borderColor: "dark.400" }),
};

export function ArticleContent({ content: Content }: { content: MDXContent }) {
  return <Content components={components} />;
}
