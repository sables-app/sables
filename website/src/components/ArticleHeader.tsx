import { withProps } from "@sables/framework";
import { Link } from "@sables/framework/router";

import { Box, Center, HStack, Img, Text, VStack } from "../../deps.js";
import { articleLogoSrc } from "../assets/mod.js";
import { useApp } from "../hooks/mod.js";
import routes from "../routes/mod.js";
import { articleContentGutter } from "./ThemeProvider.js";

const ArticleHeaderLargeSables = withProps(Text, {
  as: "span",
  color: "tan.300",
  fontFamily: "Noto Serif KR",
  fontSize: "5xl",
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "10",
  textAlign: "center",
});

const ArticleHeaderLargeFramework = withProps(Text, {
  as: "span",
  color: "grey.350",
  fontFamily: "Noto Sans",
  fontSize: "md",
  fontStyle: "normal",
  fontWeight: 700,
  letterSpacing: "0.32em",
  lineHeight: "3",
  textAlign: "center",
  textTransform: "uppercase",
  marginTop: "2",
  paddingLeft: "0.5",
});

const sideSectionWidth = ["7rem", "7rem", "7rem", "article.aside", "article.asideWide"];
const paddingSideInner = [0, 0, 0, ...articleContentGutter.slice(3, 5)];
const paddingSideOuter = [...articleContentGutter.slice(0, 3), 0, 0];

const ArticleHeaderWrapper = withProps(HStack, {
  align: ["start", "center"],
  as: "header",
  flexDirection: ["column", "row"],
  marginTop: "20",
  w: "100%",
});

const ArticleHeaderLeft = withProps(Box, {
  paddingBottom: "8",
  paddingLeft: paddingSideOuter,
  paddingRight: paddingSideInner,
});

const ArticleHeaderInnerLeft = withProps(VStack, {
  alignItems: ["start", "start", "start", "end"],
  w: sideSectionWidth,
});

const ArticleHeaderRight = withProps(Box, {
  w: sideSectionWidth,
  paddingLeft: paddingSideInner,
  paddingRight: paddingSideOuter,
  display: ["none", "block"],
});

const ArticleHeaderCenter = withProps(Box, {
  flex: "1",
  paddingBottom: "8",
});

export function ArticleHeader() {
  const { translate } = useApp();

  return (
    <ArticleHeaderWrapper>
      <ArticleHeaderLeft>
        <ArticleHeaderInnerLeft>
          <Link route={routes.Home} title="Home">
            <Img src={articleLogoSrc} alt="Sables logo" />
          </Link>
        </ArticleHeaderInnerLeft>
      </ArticleHeaderLeft>
      <ArticleHeaderCenter>
        <Center>
          <Link route={routes.Home}>
            <VStack as="h2">
              <ArticleHeaderLargeSables>
                {translate("mainHeading.sables")}
              </ArticleHeaderLargeSables>
              <ArticleHeaderLargeFramework>
                {translate("mainHeading.framework")}
              </ArticleHeaderLargeFramework>
            </VStack>
          </Link>
        </Center>
      </ArticleHeaderCenter>
      <ArticleHeaderRight />
    </ArticleHeaderWrapper>
  );
}
