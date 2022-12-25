import { withProps } from "@sables/framework";
import { Link } from "@sables/framework/router";

import { ComponentProps, ReactNode } from "react";

import {
  Box,
  Center,
  Heading,
  HStack,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
  StackDivider,
  Text,
  VStack,
} from "../../../deps.js";
import {
  distributedSrc,
  featuresPatternSrc,
  insertSrc,
  locomotiveSrc,
  stopwatchSrc,
} from "../../assets/mod.js";
import { useApp } from "../../hooks/mod.js";
import routes from "../../routes/mod.js";

const FeatureWrapper = withProps(HStack, {
  align: "start",
  bgColor: "dark.200",
  borderColor: "dark.300",
  borderRadius: "1rem",
  borderStyle: "solid",
  borderWidth: "1px",
  divider: <StackDivider />,
  filter: "drop-shadow(0px 0.25rem 0.25rem rgba(0,0,0,0.2))",
  flexDir: ["column", "row"],
  height: "100%",
  p: "2rem",
  spacing: "8",
  transition: "background-color 400ms",
  _hover: {
    backgroundColor: "#2f2a2e",
  },
});

function FeaturesBox(props: ComponentProps<typeof FeatureWrapper>) {
  return (
    <LinkBox>
      <FeatureWrapper {...props} />
    </LinkBox>
  );
}

function FeaturesIcon({
  src,
  ...otherProps
}: ComponentProps<typeof Box> & { src: string }) {
  const props = {
    backgroundImage: `url(${src})`,
    backgroundPosition: "center",
    backgroundSize: "cover",
    borderRadius: "0.75rem",
    height: "3rem",
    marginTop: ["0", "2"],
    width: "3rem",
    ...otherProps,
  };

  return <Box {...props} />;
}

const FeaturesHeading = withProps(Heading, {
  as: "h3",
  borderTop: ["1px solid", "0"],
  borderTopColor: "dark.400",
  color: "grey.350",
  fontFamily: "Noto Sans",
  fontSize: "18px",
  fontStyle: "normal",
  fontWeight: "700",
  lineHeight: "25px",
  marginTop: ["6", 0],
  noOfLines: [2, 2, 2, 2, 1],
  paddingTop: ["6", 0],
  textTransform: "uppercase",
  w: "100%",
});

type ApiLinkHash = NonNullable<ComponentProps<typeof Link>["hash"]>;

function FeaturesText({
  apiLinkHash,
  children,
  ...otherProps
}: ComponentProps<typeof Text> & {
  apiLinkHash: ApiLinkHash;
}) {
  return (
    <Text
      color="tan.300"
      fontSize="md"
      fontStyle="normal"
      fontWeight="500"
      lineHeight="8"
      maxW={"42rem"}
      {...otherProps}
    >
      <LinkOverlay as={Link} route={routes.Api} hash={apiLinkHash}>
        {children}
      </LinkOverlay>
    </Text>
  );
}

function FeaturesWrapper(props: ComponentProps<typeof SimpleGrid>) {
  return (
    <Center
      backgroundAttachment="fixed"
      backgroundSize="5rem"
      bgColor="dark.100"
      bgImage={`url(${featuresPatternSrc})`}
      borderColor="tan.400"
      borderStyle="solid"
      borderWidth="1px 0"
      boxShadow="inset 0 0.25rem 2rem #0006"
      minH="50vh"
      w="100%"
    >
      <SimpleGrid
        as="section"
        columns={[1, 1, 1, 1, 2]}
        maxW="container.wide"
        paddingBottom="16"
        paddingLeft={[12, 12, 20, 36, 24]}
        paddingRight={[12, 12, 20, 36, 24]}
        paddingTop="16"
        spacing="4rem"
        w="100%"
        {...props}
      />
    </Center>
  );
}

function Feature({
  apiLinkHash,
  description,
  iconSrc,
  heading,
}: {
  apiLinkHash: ApiLinkHash;
  description: ReactNode;
  iconSrc: string;
  heading: ReactNode;
}) {
  return (
    <FeaturesBox>
      <FeaturesIcon src={iconSrc} />
      <VStack spacing="3" align="start" flex="1">
        <FeaturesHeading>{heading}</FeaturesHeading>
        <FeaturesText apiLinkHash={apiLinkHash}>{description}</FeaturesText>
      </VStack>
    </FeaturesBox>
  );
}

export function HomeFeatures() {
  const { translate } = useApp();

  return (
    <FeaturesWrapper>
      <Feature
        iconSrc={locomotiveSrc}
        heading={translate("homeScreen.features.appFirst.heading")}
        apiLinkHash="#server"
        description={translate("homeScreen.features.appFirst.description")}
      />
      <Feature
        iconSrc={distributedSrc}
        heading={translate("homeScreen.features.routing.heading")}
        apiLinkHash="#router"
        description={translate("homeScreen.features.routing.description")}
      />
      <Feature
        iconSrc={insertSrc}
        heading={translate("homeScreen.features.sliceInsertion.heading")}
        apiLinkHash="#add-slice-dependencies"
        description={translate(
          "homeScreen.features.sliceInsertion.description"
        )}
      />
      <Feature
        iconSrc={stopwatchSrc}
        heading={translate("homeScreen.features.serverSide.heading")}
        apiLinkHash="#server"
        description={translate("homeScreen.features.serverSide.description")}
      />
    </FeaturesWrapper>
  );
}
