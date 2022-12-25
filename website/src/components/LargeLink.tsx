import { withProps } from "@sables/framework";
import { Link } from "@sables/framework/router";

import { LinkOverlay, Text } from "../../deps.js";

export const LargeLinkOverlay = withProps(LinkOverlay, {
  as: Link,
  color: "red.200",
  display: "block",
  fontFamily: "Noto Sans",
  fontSize: "xl",
  fontWeight: 700,
  lineHeight: "7",
  textTransform: "uppercase",
  transition: "color ease-in-out 100ms",
  _hover: {
    color: "red.300",
    textDecorationLine: "underline",
  },
});

export const LargeSubtext = withProps(Text, {
  color: "tan.300",
  fontSize: "lg",
  fontWeight: 500,
  lineHeight: "7",
  pt: "2",
  textTransform: "capitalize",
  whiteSpace: "nowrap",
});
