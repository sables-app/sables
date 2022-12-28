import { withProps } from "@sables/framework";

import type { StyleProps } from "@chakra-ui/react";
import { ComponentProps, memo } from "react";

import { Heading as HeadingBase, Link, Text } from "@chakra-ui/react";
import { AnchorSlug } from "./AnchorSlug.js";

const HeadingBaseStyle = withProps(HeadingBase, {
  _hover: {
    ".anchor-link": {
      opacity: "0.7",
    },
  },
});

const headingPresenters = {
  h1: withProps(HeadingBaseStyle, {
    color: "tan.300",
    fontSize: "3rem",
    fontWeight: 700,
    marginBottom: "4",
    textShadow: "0 2px 0px var(--chakra-colors-dark-200)",
  }),
  h2: withProps(HeadingBaseStyle, {
    borderTopColor: "dark.500",
    borderTopStyle: "solid",
    borderTopWidth: "1px",
    color: "tan.300",
    fontSize: "2.5rem",
    fontWeight: 700,
    lineHeight: "2.875rem",
    marginBottom: "4",
    marginTop: "12",
    paddingTop: "2rem",
    textShadow: "0 2px 0px var(--chakra-colors-dark-200)",
  }),
  h3: withProps(HeadingBaseStyle, {
    color: "white",
    fontSize: "1.5rem",
    fontWeight: 700,
    lineHeight: "2.875rem",
    marginBottom: "4",
    marginTop: "12",
  }),
  h4: withProps(HeadingBaseStyle, {
    color: "warm.350",
    fontSize: "lg",
    fontWeight: "700",
    lineHeight: "6",
    marginBottom: "5",
    marginTop: "8",
  }),
  h5: withProps(HeadingBaseStyle, {
    color: "white",
    fontFamily: "Noto Sans",
    fontSize: "sm",
    fontWeight: "700",
    lineHeight: "6",
    marginBottom: "5",
    marginTop: "8",
    textTransform: "uppercase",
  }),
  h6: withProps(HeadingBaseStyle, {
    color: "white",
    fontFamily: "Noto Sans",
    fontSize: "xs",
    fontWeight: "700",
    lineHeight: "6",
    marginBottom: "5",
    marginTop: "8",
    textTransform: "uppercase",
  }),
} as const;

type HeadingProps = ComponentProps<"h1"> &
  StyleProps & {
    as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  };

const AnchorLink = withProps(Link, {
  "aria-hidden": "true",
  color: "red.200",
  className: "anchor-link",
  display: "inline-block",
  float: "left",
  fontFamily: "Noto Sans",
  fontWeight: "400",
  marginLeft: "-.7em",
  opacity: "0",
  transitionDuration: "300ms",
  transitionProperty: "color, opacity",
  _hover: {
    color: "red.300",
    opacity: "1",
  },
});

export const ArticleHeading = memo(function Heading({
  as,
  children,
  id,
  ...otherProps
}: HeadingProps) {
  const Presenter = headingPresenters[as];

  return (
    <Presenter as={as} id={id} {...otherProps}>
      {children}
      {id && <AnchorLink href={`#${id}`}>#</AnchorLink>}
    </Presenter>
  );
});

export const ArticleHeadingWithAnchor = memo(function ArticleHeadingWithAnchor({
  children,
  ...otherProps
}: HeadingProps) {
  return (
    <AnchorSlug value={children}>
      {(anchorSlug) => (
        <ArticleHeading id={anchorSlug} {...otherProps}>
          {children}
        </ArticleHeading>
      )}
    </AnchorSlug>
  );
});
