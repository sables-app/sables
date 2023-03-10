import { withProps } from "@sables/framework";

import { Box, VStack } from "@chakra-ui/react";
import { Helmet } from "react-helmet-async";

import { Footer } from "../../components/Footer.js";
import { bodyFontProps } from "../../components/ThemeProvider.js";
import { useApp } from "../../hooks/mod.js";
import { HomeFeatures } from "./HomeFeatures.js";
import { HomeHeader } from "./HomeHeader.js";

const HomeScreenWrapper = withProps(VStack, {
  ...bodyFontProps,
  spacing: 0,
});

export default function HomeScreen() {
  const { translate } = useApp();

  return (
    <HomeScreenWrapper>
      <Helmet>
        <title>{translate("headTitleHome")}</title>
      </Helmet>
      <HomeHeader />
      <HomeFeatures />
      <Box as="footer" w="100%">
        <Footer bgColor="dark.200" borderColor="dark.500" />
      </Box>
    </HomeScreenWrapper>
  );
}
