import { withProps } from "@sables/framework";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Box } from "../../../deps.js";
import { HeadingMeta, HeadingsReadyHandler } from "./constants.js";
import { TOCContent } from "./Presenters.js";

type TOCRefValue = {
  addHeading(heading: HeadingMeta): void;
};

const TOCContext = createContext<React.MutableRefObject<TOCRefValue>>({
  current: {
    addHeading() {
      throw new Error("Provider missing.");
    },
  },
});

const Hidden = withProps(Box, {
  display: "none",
  "aria-hidden": "true",
});

export function TOCProvider({
  children,
  onHeadingsReady,
}: {
  children: ReactNode;
  onHeadingsReady?: HeadingsReadyHandler;
}) {
  const headingsRef = useRef<HeadingMeta[]>([]);
  const addHeading = useCallback((heading: HeadingMeta) => {
    headingsRef.current = [...headingsRef.current, heading];
  }, []);
  const tocRef = useRef<TOCRefValue>({ addHeading });
  const [headings, setHeadings] = useState<HeadingMeta[]>([]);

  useEffect(() => {
    setHeadings(headingsRef.current);
  }, []);

  useEffect(() => {
    onHeadingsReady?.(headingsRef.current);
  }, [onHeadingsReady]);

  return (
    <TOCContext.Provider value={tocRef}>
      <Hidden>{children}</Hidden>
      <TOCContent headings={headings} />
    </TOCContext.Provider>
  );
}

export function useTOC() {
  return useContext(TOCContext);
}
