import { useSelector } from "@sables/framework";
import { selectIsRouteTransitioning } from "@sables/framework/router";

import { Box, Container, GridItem } from "@chakra-ui/react";
import { ComponentProps, ReactNode, useEffect, useRef, useState } from "react";

import { SCREEN_ANIMATION_DURATION } from "../constants.js";
import { articleContentGutter } from "./ThemeProvider.js";

function updateScrollPosition() {
  if (typeof location == "undefined" || typeof window == "undefined") return;

  const id = location.hash.split("#").pop();
  const anchor = id ? document.getElementById(id) : null;
  const yCoordinate = anchor?.offsetTop || 0;

  window.scrollTo(0, yCoordinate);
}

function useRouteTransitionFade() {
  const isRouteTransitioning = useSelector(selectIsRouteTransitioning);
  const [isVisible, setIsVisible] = useState(false);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      updateScrollPosition();
      setIsVisible(true);
      hasMounted.current = true;
    }
  }, []);

  useEffect(() => {
    if (isRouteTransitioning && isVisible) {
      setIsVisible(false);
    }
  }, [isRouteTransitioning, isVisible]);

  return {
    opacity: Number(isVisible),
    transition: `opacity ${SCREEN_ANIMATION_DURATION}ms ease-in-out 0s`,
  };
}

function ArticleSection(props: ComponentProps<typeof Container>) {
  return (
    <Container
      maxW="100%"
      paddingLeft={articleContentGutter}
      paddingRight={articleContentGutter}
      {...props}
    />
  );
}

export function Article({
  aside,
  heading,
  children,
}: {
  aside?: ReactNode;
  heading?: ReactNode;
  children?: ReactNode;
}) {
  const fadeProps = useRouteTransitionFade();

  return (
    <>
      <GridItem area="mainHeading">
        <ArticleSection {...fadeProps}>{heading}</ArticleSection>
      </GridItem>
      <GridItem area="articleContent">
        <ArticleSection as="article" marginBottom="10rem" {...fadeProps}>
          {children}
        </ArticleSection>
      </GridItem>
      <GridItem
        as="aside"
        area="tableOfContents"
        paddingLeft={[...articleContentGutter.slice(0, 4), 0]}
        minW="article.aside"
      >
        <Box
          maxHeight={["auto", "auto", "auto", "auto", "calc(100vh - 2.5rem)"]}
          overflowX="hidden"
          overflowY="auto"
          paddingBottom={["4", "4", "4", "4", "10"]}
          paddingTop={["6", "6", "6", "6", "2"]}
          position="sticky"
          top="2.5rem"
          {...fadeProps}
        >
          {aside}
        </Box>
      </GridItem>
    </>
  );
}
