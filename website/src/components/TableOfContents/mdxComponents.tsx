import { MDXComponents } from "mdx/types";
import { ComponentProps, useEffect, useRef } from "react";

import { MARKDOWN_TAGS } from "../../constants.js";
import { isHeadingTag, MarkdownTag } from "./constants.js";
import { useTOC } from "./TOCContext.js";

function Empty() {
  return null;
}

function createMDXComponentFromTag<T extends MarkdownTag>(tag: T) {
  if (isHeadingTag(tag)) {
    return function HeadingFacade({ children }: ComponentProps<T>) {
      const tocContext = useTOC();
      const headingWasAddedRef = useRef(false);

      useEffect(() => {
        if (headingWasAddedRef.current) return;

        headingWasAddedRef.current = true;
        tocContext.current.addHeading({ tag, children });
      }, [children, tocContext]);

      return null;
    };
  }

  return Empty;
}

const tocMdxComponents: MDXComponents = Object.fromEntries(
  MARKDOWN_TAGS.map((tag) => [tag, createMDXComponentFromTag(tag)])
);

export { tocMdxComponents };
