import { ReactNode } from "react";

import { MARKDOWN_TAGS } from "../../constants.js";

/**
 * All heading tags
 */
export const headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
/**
 * Heading tags that are rendered in the Table of Contents
 */
export const renderedHeadingTags = ["h1", "h2", "h3", "h4"] as const;

export type MarkdownTag = (typeof MARKDOWN_TAGS)[number];
export type HeadingTag = (typeof headingTags)[number];
export type RenderedHeadingTag = (typeof renderedHeadingTags)[number];

export function isHeadingTag(
  propertyName: string | symbol
): propertyName is HeadingTag {
  return (
    typeof propertyName == "string" && headingTags.includes(propertyName as any)
  );
}

export function isRenderedHeadingTag(
  propertyName: string | symbol
): propertyName is RenderedHeadingTag {
  return (
    typeof propertyName == "string" &&
    renderedHeadingTags.includes(propertyName as any)
  );
}

export function isRenderedHeadingMeta(
  headingMeta: HeadingMeta
): headingMeta is HeadingMeta<RenderedHeadingTag> {
  return isRenderedHeadingTag(headingMeta.tag);
}

export type HeadingMeta<T extends HeadingTag = HeadingTag> = {
  children: ReactNode;
  tag: T;
};

export type HeadingsReadyHandler = (headings: HeadingMeta[]) => void;
