import { Box } from "../../deps.js";
import {
  Article,
  articleContentGutter,
  ArticleHeading,
} from "../components/mod.js";
import { useApp } from "../hooks/mod.js";

// TODO - Make fancy
export default function NotFoundArticle() {
  const { translate } = useApp();

  return (
    <Article>
      <Box marginLeft={articleContentGutter} minH="5xl" textAlign={"center"}>
        <ArticleHeading as="h2">
          {translate("notFoundScreen.message")}
        </ArticleHeading>
      </Box>
    </Article>
  );
}
