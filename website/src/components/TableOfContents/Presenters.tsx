import { withProps } from "@sables/framework";

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ComponentProps, memo, ReactNode, useMemo } from "react";

import { AnchorSlug } from "../AnchorSlug.js";
import { Link } from "../Link.js";
import { HeadingMeta, HeadingTag, isRenderedHeadingMeta } from "./constants.js";

const indentByHeadingTag: Record<HeadingTag, string> = {
  h1: "0",
  h2: "0",
  h3: "2",
  h4: "6",
  h5: "10",
  h6: "14",
};

const fontSizeByHeadingTag: Record<HeadingTag, string> = {
  h1: "1rem",
  h2: "1rem",
  h3: "0.875rem",
  h4: "0.75rem",
  h5: "0.75rem",
  h6: "0.75rem",
};

const marginByHeadingTag: Record<HeadingTag, string> = {
  h1: "0",
  h2: "0",
  h3: "0.5rem",
  h4: "0.5rem",
  h5: "0.5rem",
  h6: "0.5rem",
};

const ItemPresenter = withProps(Box, {
  as: "li",
  display: "block",
  listStyleType: "none",
  w: "100%",
});

const LinkPresenter = withProps(Link, {
  display: "inline-block",
});

const TOCItem = memo(function TOCItem<T extends HeadingTag>({
  children,
  tag,
  ...otherProps
}: {
  tag: T;
} & ComponentProps<typeof Box>) {
  return (
    <ItemPresenter
      {...otherProps}
      paddingLeft={indentByHeadingTag[tag]}
      paddingTop={marginByHeadingTag[tag]}
    >
      <AnchorSlug value={children}>
        {(anchorSlug) => (
          <LinkPresenter
            fontSize={fontSizeByHeadingTag[tag]}
            href={`#${anchorSlug}`}
          >
            {children}
          </LinkPresenter>
        )}
      </AnchorSlug>
    </ItemPresenter>
  );
});

const TOCTopList = withProps(VStack, {
  as: "nav",
  paddingTop: "4",
  marginBottom: ["2", "2", "2", "2", "0"],
  paddingBottom: ["8", "8", "8", "8", "0"],
  w: ["auto", "auto", "auto", "auto", "article.asideWide"],
  borderBottomWidth: ["1px", "1px", "1px", "1px", "0"],
  borderBottomStyle: "solid",
  borderBottomColor: "dark.300",
});

const TOCList = withProps(VStack, {
  as: "ol",
  padding: "4",
  paddingTop: "0",
  spacing: "0",
});

const TOCAccordionTitle = withProps(Text, {
  display: "block",
});

const TOCAccordionItem = withProps(AccordionItem, {
  border: "0",
});

const TOCAccordionButton = withProps(AccordionButton, {
  color: "tan.200",
  fontFamily: "Noto Sans",
  fontSize: "md",
  fontWeight: 700,
  lineHeight: "6",
  textTransform: "uppercase",
  m: 0,
  p: 0,
});

const TOCAccordionIcon = withProps(AccordionIcon, {
  display: "inline-block",
  marginLeft: "2",
});

const TOCAccordionPanel = withProps(AccordionPanel, {
  m: "0",
  p: "0",
});

export function TOCAccordion({
  children,
  title,
}: {
  children: ReactNode;
  title: ReactNode;
}) {
  return (
    <Accordion allowToggle defaultIndex={0}>
      <TOCAccordionItem as="section">
        <TOCAccordionTitle as="h4">
          <TOCAccordionButton>
            {title}
            <TOCAccordionIcon />
          </TOCAccordionButton>
        </TOCAccordionTitle>
        <TOCAccordionPanel>{children}</TOCAccordionPanel>
      </TOCAccordionItem>
    </Accordion>
  );
}

const H2GroupAccordionButton = withProps(AccordionButton, {
  textAlign: "left",
});

function H2Group({
  children,
  headingText,
}: {
  children: ReactNode;
  headingText: ReactNode;
}) {
  return (
    <TOCAccordionItem as="section">
      <TOCAccordionTitle as="header">
        <H2GroupAccordionButton>
          <TOCItem as="span" tag="h2">
            {headingText}
          </TOCItem>
          <TOCAccordionIcon />
        </H2GroupAccordionButton>
      </TOCAccordionTitle>
      <TOCAccordionPanel>
        <TOCList>{children}</TOCList>
      </TOCAccordionPanel>
    </TOCAccordionItem>
  );
}

function useTOCPresenter(headings: HeadingMeta[]) {
  return useMemo(() => {
    const result: ReactNode[] = [];
    let h1Item: ReactNode = null;
    let h2Group: { heading: HeadingMeta; group: ReactNode[] } | undefined;

    function setMainHeading(heading: HeadingMeta) {
      h1Item = (
        <TOCItem as="header" tag="h1">
          {heading.children}
        </TOCItem>
      );
    }

    function flushH2Group(key: string, nextHeading?: HeadingMeta) {
      if (h2Group) {
        result.push(
          <H2Group key={key} headingText={h2Group.heading.children}>
            {h2Group.group}
          </H2Group>
        );
      }

      if (nextHeading) {
        h2Group = {
          group: [],
          heading: nextHeading,
        };
      }
    }

    function pushSubheading(key: string, heading: HeadingMeta) {
      (h2Group?.group || result).push(
        <TOCItem key={key} tag={heading.tag}>
          {heading.children}
        </TOCItem>
      );
    }

    for (let i = 0; i < headings.length; i++) {
      const headingMeta = headings[i];
      const { tag } = headingMeta;
      const key = `${tag}${i}`;

      switch (tag) {
        case "h1":
          setMainHeading(headingMeta);
          break;
        case "h2":
          flushH2Group(key, headingMeta);
          break;
        default: {
          if (isRenderedHeadingMeta(headingMeta)) {
            pushSubheading(key, headingMeta);
          }
          break;
        }
      }
    }

    if (h2Group) {
      flushH2Group("last");
    }

    return (
      <TOCTopList>
        {h1Item}
        <Accordion allowToggle maxW="100%" w="100%">
          {result}
        </Accordion>
      </TOCTopList>
    );
  }, [headings]);
}

export function TOCContent({ headings }: { headings: HeadingMeta[] }) {
  return useTOCPresenter(headings);
}
