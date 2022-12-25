import { ComponentProps } from "react";

import { Box } from "../../deps.js";
import { ArticleHeadingWithAnchor } from "./ArticleHeading.js";

export function MainHeading({
  children,
  ...otherProps
}: Omit<ComponentProps<typeof Box>, "as">) {
  return (
    <ArticleHeadingWithAnchor
      as="h1"
      marginTop={["12", "12", "12", "0", "0"]}
      marginBottom="2"
      {...otherProps}
    >
      {children}
    </ArticleHeadingWithAnchor>
  );
}
