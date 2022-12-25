import { MDXContent } from "mdx/types";

import { useApp } from "../../hooks/mod.js";
import { HeadingsReadyHandler } from "./constants.js";
import { tocMdxComponents } from "./mdxComponents.js";
import { TOCAccordion } from "./Presenters.js";
import { TOCProvider } from "./TOCContext.js";

export function TableOfContents({
  content: Content,
  onHeadingsReady,
}: {
  content: MDXContent;
  onHeadingsReady?: HeadingsReadyHandler;
}) {
  const { translate } = useApp();

  return (
    <TOCAccordion title={translate("toc")}>
      <TOCProvider onHeadingsReady={onHeadingsReady}>
        <Content components={tocMdxComponents} />
      </TOCProvider>
    </TOCAccordion>
  );
}
