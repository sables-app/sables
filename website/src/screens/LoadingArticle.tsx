import { Box, Center } from "@chakra-ui/react";
import { ScaleLoader } from "react-spinners";

import { Article, articleContentGutter } from "../components/mod.js";
import { useApp } from "../hooks/mod.js";

export default function LoadingArticle() {
  const { translate } = useApp();

  return (
    <Article>
      <Box marginBottom="65vh">
        <Center marginLeft={articleContentGutter} minH="20vh">
          <ScaleLoader
            aria-label={translate("loadingScreen.message")}
            color="var(--chakra-colors-grey-300)"
            loading
          />
        </Center>
      </Box>
    </Article>
  );
}
