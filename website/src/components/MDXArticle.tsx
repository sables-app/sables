import { MDXContent } from "mdx/types.js";
import { ReactNode, useCallback, useState } from "react";
import { Helmet } from "react-helmet-async";

import {
  Article,
  ArticleContent,
  HeadingsReadyHandler,
  MainHeading,
  TableOfContents,
} from "../components/mod.js";
import { useApp } from "../hooks/mod.js";
import { AnchorSlugProvider } from "./AnchorSlug.js";

export default function MDXArticle({ content }: { content: MDXContent }) {
  const { translate } = useApp();
  const [title, setTitle] = useState<ReactNode>(null);
  const handleHeadingsReady: HeadingsReadyHandler = useCallback((heading) => {
    setTitle(heading.find(({ tag }) => tag === "h1")?.children || null);
  }, []);

  return (
    <AnchorSlugProvider>
      <Article
        aside={
          <AnchorSlugProvider>
            <TableOfContents
              content={content}
              onHeadingsReady={handleHeadingsReady}
            />
          </AnchorSlugProvider>
        }
        heading={<MainHeading>{title}</MainHeading>}
      >
        <ArticleContent content={content} />
        <Helmet>
          <title>{translate("headTitle", { title })}</title>
        </Helmet>
      </Article>
    </AnchorSlugProvider>
  );
}
