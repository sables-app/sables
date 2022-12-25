import { lazy } from "@sables/ssr";

import { Suspense, useEffect, useState } from "react";

import { PreformattedText } from "../PreformattedText.js";

// Lazy-load `SyntaxHighlighter`, because `highlight.js` is huge.
const SyntaxHighlighter = lazy(() => import("./SyntaxHighlighter.js"));

export function CodeBlock({
  children,
  language,
}: {
  children: string;
  language?: string;
}) {
  const [isHighlighting, setIsHighlighting] = useState(false);

  // To avoid render conflicts during SSR hydration,
  // only render highlighting after the component is mounted.
  useEffect(() => setIsHighlighting(true), []);

  const preformatted = <PreformattedText>{children}</PreformattedText>;

  if (!isHighlighting) {
    return preformatted;
  }

  return (
    <Suspense fallback={preformatted}>
      <SyntaxHighlighter language={language}>{children}</SyntaxHighlighter>
    </Suspense>
  );
}
