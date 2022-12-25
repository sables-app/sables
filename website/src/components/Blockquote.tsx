import { withProps } from "@sables/framework";

import { Box } from "../../deps.js";

export const Blockquote = withProps(Box, {
  as: "blockquote",
  borderLeft: "0.5rem solid",
  borderLeftColor: "dark.300",
  paddingLeft: "4",
  color: "grey.400",
});
