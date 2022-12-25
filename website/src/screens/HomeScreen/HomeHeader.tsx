import { withProps } from "@sables/framework";
import { responsiveToken } from "@sables/framework/utils";

import { Box, Img, Text, VStack } from "../../../deps.js";
import { homeBackgroundSrc, homeLogoSrc } from "../../assets/mod.js";
import { useApp } from "../../hooks/mod.js";
import { HomeNav } from "./HomeNav.js";

const TextLargeScaling = [0.6, 0.7, 1];

const TextLargeSables = withProps(Text, {
  align: "center",
  as: "span",
  color: "tan.300",
  fontFamily: "Noto Serif KR",
  fontSize: responsiveToken(TextLargeScaling, 6.875),
  fontWeight: 500,
  lineHeight: responsiveToken(TextLargeScaling, 6.25),
  paddingTop: ["2rem", "3rem"],
});

const TextLargeFramework = withProps(Text, {
  align: "center",
  as: "span",
  color: "grey.350",
  fontFamily: "Noto Sans",
  fontSize: responsiveToken(TextLargeScaling, 2.3),
  fontWeight: 700,
  letterSpacing: "0.32em",
  lineHeight: responsiveToken(TextLargeScaling, 1.75),
  padding: "0.5rem 0 0 0.3rem",
  textTransform: "uppercase",
});

const TaglineWrapper = withProps(Box, {
  padding: ["2.5rem 3rem", "2.5rem 3rem", "4.5rem 0 3.5rem 0"],
});

const TaglineText = withProps(Box, {
  as: "p",
  color: "tan.300",
  fontFamily: "Noto Serif KR",
  fontSize: ["1.5rem", "1.5rem", "1.75rem"],
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "2.5rem",
  textAlign: "center",
});

const TaglineSubtext = withProps(Box, {
  as: "p",
  color: "grey.350",
  fontWeight: 700,
  paddingTop: "1rem",
  textAlign: "center",
  textTransform: "uppercase",
});

const wrapperBgImage = `url(${homeBackgroundSrc})`;
const wrapperRadialGradient = `radial-gradient(${[
  "circle at center",
  "var(--chakra-colors-dark-200) 20%",
  "var(--chakra-colors-dark-300) 100%",
].join(",")})`;

const Wrapper = withProps(VStack, {
  as: "header",
  background: [wrapperBgImage, wrapperRadialGradient].join(","),
  backgroundPosition: "top center",
  backgroundRepeat: "no-repeat",
  backgroundSize: ["150%", "150%", "auto"],
  minH: "80vh",
  paddingBottom: "24",
  w: "100%",
});

const Logo = withProps(Img, {
  alt: "Sables logo",
  className: "logo",
  marginTop: ["3rem", "5rem", "10vh"],
  src: homeLogoSrc,
  w: ["58%", "50%", "auto"],
});

export function HomeHeader() {
  const { translate } = useApp();

  return (
    <Wrapper>
      <Logo />
      <Box>
        <VStack as="h1">
          <TextLargeSables>{translate("mainHeading.sables")}</TextLargeSables>
          <TextLargeFramework>
            {translate("mainHeading.framework")}
          </TextLargeFramework>
        </VStack>
      </Box>
      <TaglineWrapper>
        <TaglineText>{translate("homeScreen.tagline")}</TaglineText>
        <TaglineSubtext>{translate("homeScreen.subTagline")}</TaglineSubtext>
      </TaglineWrapper>
      <HomeNav />
    </Wrapper>
  );
}
