// TODO - Remove this module when Chakra-UI properly supports ESM
// https://github.com/chakra-ui/chakra-ui/issues/6942

import * as ChakraUIReactMod from "@chakra-ui/react/dist/index.esm.js";

const ChakraUIReact = ChakraUIReactMod.default || ChakraUIReactMod;

export const {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  ChakraProvider,
  Container,
  extendTheme,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Img,
  Link,
  LinkBox,
  LinkOverlay,
  Spacer,
  SimpleGrid,
  Stack,
  StackDivider,
  Table,
  TableContainer,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorMode,
  VStack,
} = ChakraUIReact;
