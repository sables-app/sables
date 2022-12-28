import { withProps } from "@sables/framework";

import { Box, HStack, Img, Stack, StackDivider } from "@chakra-ui/react";
import { ComponentProps } from "react";

import { californiaFlagSrc, githubSrc } from "../assets/mod.js";
import { Link } from "./Link.js";
import { bodyFontProps } from "./ThemeProvider.js";

const FooterLink = withProps(Link, {
  color: "grey.400",
  _hover: {
    background: "rgba(0,0,0,0.3)",
    borderRadius: "2px",
    boxShadow: "0 0 0 2px rgba(0,0,0,0.3)",
    color: "red.200",
  },
});

const FooterWrapper = withProps(HStack, {
  bgColor: "dark.100",
  borderColor: "dark.300",
  divider: <StackDivider borderColor="inherit" />,
  flexDir: ["column", "column", "row"],
  paddingBottom: "20",
  paddingTop: "20",
  placeItems: "center",
  spacing: "12",
});

const FooterList = withProps(Stack, {
  as: "ul",
  color: "dark.500",
  flex: "1",
  fontFamily: "Noto Sans",
  listStyleType: "none",
});

const FirstFooterList = withProps(FooterList, {
  borderBottomColor: "inherit",
  borderBottomStyle: "solid",
  borderBottomWidth: ["1px", "1px", "0"],
  marginBottom: ["2rem", "2rem", "0"],
  paddingBottom: ["2rem", "2rem", "0"],
  textAlign: ["center", "center", "right"],
});

const SecondFooterList = withProps(FooterList, {
  textAlign: ["center", "center", "left"],
});

const FooterIcon = withProps(Img, {
  display: "inline-block",
  h: "1rem",
  padding: "0 0.2rem",
  verticalAlign: "middle",
});

const LocationIcon = withProps(FooterIcon, {
  src: californiaFlagSrc,
});

const GithubIcon = withProps(FooterIcon, {
  src: githubSrc,
});

const FooterListItem = withProps(Box, {
  ...bodyFontProps,
  as: "li",
});

export function Footer(props: ComponentProps<typeof HStack>) {
  return (
    <FooterWrapper {...props}>
      <FirstFooterList>
        <FooterListItem>
          Proudly made in{" "}
          <LocationIcon alt="Flag of California" title="California" /> by{" "}
          <FooterLink href="https://github.com/morrisallison">
            Morris Allison III
          </FooterLink>
          .
        </FooterListItem>
        <FooterListItem>
          <FooterLink href="https://github.com/sables-app/sables">
            <GithubIcon alt="GitHub Logo" /> Sables on GitHub
          </FooterLink>
        </FooterListItem>
        <FooterListItem>
          Deployed on{" "}
          <FooterLink href="https://www.cloudflare.com/">Cloudflare</FooterLink>
          .
        </FooterListItem>
      </FirstFooterList>
      <SecondFooterList>
        <FooterListItem>
          Copyright © 2022{" "}
          <FooterLink href="https://morris.xyz">Morris Allison III</FooterLink>.
        </FooterListItem>
        <FooterListItem>
          Code licensed under a{" "}
          <FooterLink href="https://github.com/sables-app/sables/blob/main/LICENSE">
            MIT License
          </FooterLink>
          .
        </FooterListItem>
        <FooterListItem>
          Documentation licensed under{" "}
          <FooterLink href="https://creativecommons.org/licenses/by/4.0/">
            CC BY 4.0
          </FooterLink>
          .
        </FooterListItem>
      </SecondFooterList>
    </FooterWrapper>
  );
}
