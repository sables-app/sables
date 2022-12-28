import { withProps } from "@sables/framework";

import { Heading, LinkBox, Stack, StackDivider, Text } from "@chakra-ui/react";
import { LargeLinkOverlay, LargeSubtext } from "../../components/LargeLink.js";
import { useApp } from "../../hooks/mod.js";
import routes from "../../routes/mod.js";

const HomeNavLinkOverlay = withProps(LargeLinkOverlay, {
  fontSize: "xl",
  lineHeight: "7",
});

const HomeNavSubtext = withProps(LargeSubtext, {
  fontSize: "lg",
  lineHeight: "7",
});

const HomeNavWrapper = withProps(Stack, {
  direction: ["column", "column", "row"],
  divider: <StackDivider borderColor="dark.400" />,
  h: "36",
  placeItems: "center",
  spacing: "6",
});

export function HomeNav() {
  const { translate } = useApp();

  return (
    <HomeNavWrapper>
      <LinkBox w="2xs">
        <Heading size="xs">
          <HomeNavLinkOverlay
            route={routes.GettingStarted}
            textAlign={["center", "center", "right"]}
          >
            <Text as="span">{translate("nav.gettingStarted.title")}</Text>
          </HomeNavLinkOverlay>
        </Heading>
        <HomeNavSubtext align={["center", "center", "right"]}>
          {translate("nav.gettingStarted.desc")}
        </HomeNavSubtext>
      </LinkBox>
      <LinkBox w="2xs">
        <Heading size="xs">
          <HomeNavLinkOverlay
            route={routes.Api}
            textAlign={["center", "center", "left"]}
          >
            <Text as="span">{translate("nav.api.title")}</Text>
          </HomeNavLinkOverlay>
        </Heading>
        <HomeNavSubtext align={["center", "center", "left"]}>
          {translate("nav.api.desc")}
        </HomeNavSubtext>
      </LinkBox>
    </HomeNavWrapper>
  );
}
