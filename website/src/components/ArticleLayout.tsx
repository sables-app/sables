import { withProps } from "@sables/framework";

import { ReactNode } from "react";

import { Box, Container, Grid, GridItem, VStack } from "@chakra-ui/react";
import { ArticleHeader } from "./ArticleHeader.js";
import { ArticleSideNav } from "./ArticleSideNav.js";
import { Footer } from "./Footer.js";
import { bodyFontProps } from "./ThemeProvider.js";

const ArticleLayoutWrapper = withProps(VStack, {
  ...bodyFontProps,
  spacing: 0,
});

const templateAreas = [
  `"sideNav" "mainHeading" "tableOfContents" "articleContent"`,
  `"sideNav" "mainHeading" "tableOfContents" "articleContent"`,
  `"sideNav" "mainHeading" "tableOfContents" "articleContent"`,
  `"sideNav mainHeading" "sideNav tableOfContents" "sideNav articleContent"`,
  `"sideNav mainHeading tableOfContents" "sideNav articleContent tableOfContents"`,
];
const gridTemplateColumns = [
  `minmax(0, 1fr)`,
  `minmax(0, 1fr)`,
  `minmax(0, 1fr)`,
  `var(--chakra-sizes-article-aside) minmax(0, 1fr)`,
  `var(--chakra-sizes-article-asideWide) minmax(0, 1fr) var(--chakra-sizes-article-asideWide)`,
];

const ArticleLayoutGrid = withProps(Grid, {
  as: "main",
  templateAreas,
  gridTemplateColumns,
});

export function ArticleLayout({ children }: { children: ReactNode }) {
  return (
    <ArticleLayoutWrapper>
      <Container maxW="container.wide">
        <Box w="100%" top="10" position="sticky" zIndex="docked">
          <ArticleHeader />
        </Box>
      </Container>
      <Container maxW="container.wide" minH="80vh">
        <ArticleLayoutGrid>
          <GridItem as="aside" area="sideNav">
            <Box as="nav" top="10" position="sticky" paddingTop="2">
              <ArticleSideNav />
            </Box>
          </GridItem>
          {children}
        </ArticleLayoutGrid>
      </Container>
      <Box bgColor="dark.100" w="100%">
        <Container as="footer" maxW="container.wide">
          <Footer />
        </Container>
      </Box>
    </ArticleLayoutWrapper>
  );
}
