import { withProps } from "@sables/framework";

import { Heading, LinkBox, Stack, Text } from "@chakra-ui/react";
import { useApp } from "../hooks/mod.js";
import routes from "../routes/mod.js";
import { LargeLinkOverlay, LargeSubtext } from "./LargeLink.js";
import { articleContentGutter } from "./ThemeProvider.js";

const ArticleSideNavLinkOverlay = withProps(LargeLinkOverlay, {
  fontSize: "lg",
  lineHeight: "6",
  textAlign: ["left", "left", "left", "right"],
});

const ArticleSideNavSubtext = withProps(LargeSubtext, {
  align: ["left", "left", "left", "right"],
  fontSize: "md",
  lineHeight: "6",
});

const ArticleSideNavWrapper = withProps(Stack, {
  spacing: "6",
  minW: ["0", "0", "0", "article.aside"],
  maxW: ["100%", "100%", "100%", "article.aside", "article.asideWide"],
  paddingLeft: [...articleContentGutter.slice(0, 4), 0],
  alignItems: ["start", "end"],
  flexDirection: ["column", "row", "row", "column"],
});

const ArticleSideNavItem = withProps(LinkBox, {
  paddingRight: ["12", "12", "12", "0"],
  right: ["unset", "unset", "unset", "0"],
});

export function ArticleSideNav() {
  const { translate } = useApp();

  return (
    <ArticleSideNavWrapper>
      <ArticleSideNavItem>
        <Heading>
          <ArticleSideNavLinkOverlay route={routes.GettingStarted}>
            <Text as="span">{translate("nav.gettingStarted.title")}</Text>
          </ArticleSideNavLinkOverlay>
        </Heading>
        <ArticleSideNavSubtext>
          {translate("nav.gettingStarted.desc")}
        </ArticleSideNavSubtext>
      </ArticleSideNavItem>
      <ArticleSideNavItem paddingRight="0">
        <Heading>
          <ArticleSideNavLinkOverlay route={routes.Api}>
            <Text as="span">{translate("nav.api.title")}</Text>
          </ArticleSideNavLinkOverlay>
        </Heading>
        <ArticleSideNavSubtext>
          {translate("nav.api.desc")}
        </ArticleSideNavSubtext>
      </ArticleSideNavItem>
    </ArticleSideNavWrapper>
  );
}
