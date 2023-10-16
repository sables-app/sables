// TODO -Replace this module with a proper i18n solution.

import get from "lodash.get";
import stringTemplate from "string-template";

const translations = {
  "en-US": {
    toc: "Table Of Contents",
    mainHeading: {
      sables: "Sables",
      framework: "Framework",
    },
    homeScreen: {
      tagline: "Application-first Web Framework",
      subTagline: "React, Redux, RxJS, Vite, Serverless",
      features: {
        appFirst: {
          heading: "Application-first",
          description:
            "Sables uses interfaces and patterns to prioritize interactive Web applications over traditional websites. As a result, side effects are encapsulated, APIs are composable, and data flow is predictable.",
        },
        routing: {
          heading: "Distributed routing logic",
          description:
            "Sables Router treats routes like data. Less built-in assumptions for routing logic avoid the need for unmaintainable workarounds.",
        },
        sliceInsertion: {
          heading: "Just-in-Time Redux slice insertion",
          description:
            "Sables Core enhances Redux Toolkit with action dependencies to insert slices when needed. The lazy-loading of slices and observables “just work.”",
        },
        serverSide: {
          heading: "Server-side rendering and routing",
          description:
            "Composable handlers and middleware for server-side rendering or routing allow for flexible server-side solutions.",
        },
      },
    },
    loadingScreen: {
      message: "Loading content",
    },
    notFoundScreen: {
      message: "Not Found",
    },
    headTitle: "{title} - Sables",
    headTitleHome: "Sables: Application-first Web Framework",
    nav: {
      api: {
        title: "API Reference",
        desc: "Discover what it can do",
      },
      gettingStarted: {
        title: "Get Started",
        desc: "Create your first app",
      },
    },
  },
};

export function translate(
  dotPath: string,
  context?: Record<string, unknown> | unknown[],
) {
  const translation = get(translations, ["en-US", ...dotPath.split(".")]);

  return stringTemplate(translation, context);
}
