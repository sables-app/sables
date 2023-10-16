import { createRouteSwitch } from "@sables/ssr";

import { ArticleLayout } from "../components/ArticleLayout.js";
import routes from "../routes/mod.js";
import LoadingArticle from "./LoadingArticle.js";
import NotFoundArticle from "./NotFoundArticle.js";

const ArticleSwitch = createRouteSwitch({
  fallback: <LoadingArticle />,
})
  .case(routes.Api, () => import("./ApiArticle.js"))
  .case(routes.GettingStarted, () => import("./GettingStartedArticle.js"))
  .case(routes.DevLoading, <LoadingArticle />)
  .default(<NotFoundArticle />);

export const ScreenSwitch = createRouteSwitch()
  .case(routes.Home, () => import("./HomeScreen/mod.js"))
  .default(
    <ArticleLayout>
      <ArticleSwitch />
    </ArticleLayout>,
  );
