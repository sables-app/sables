import { withProps } from "@sables/framework";

import { Link as LinkBase } from "@chakra-ui/react";
import { css } from "@emotion/css";

export const Link = withProps(LinkBase, {
  color: "red.200",
  textDecoration: "underline",
  textDecorationColor: "#88888860",
  className: css({
    "> code": {
      color: "var(--chakra-colors-red-300)",
      transition: "background-color 150ms",
    },
    ":hover": {
      "> code": {
        backgroundColor: "#40404000",
      },
    },
  }),
  fontSize: "md",
  _hover: {
    background: "dark.100",
    borderRadius: "2px",
    boxShadow: "0 0 0 2px var(--chakra-colors-dark-100)",
    color: "red.300",
  },
});
