import { createMutableRef } from "@sables/framework";

import GithubSlugger from "github-slugger";
import {
  Component,
  ContextType,
  createContext,
  memo,
  ReactNode,
  useState,
} from "react";

const REF_MESSAGE = "`AnchorSlugProvider` must be used with `AnchorSlug`.";

const AnchorSlugContext = createContext(
  createMutableRef<GithubSlugger>(REF_MESSAGE)
);

type AnchorSlugProps = {
  value: unknown;
  children: (slug: string) => ReactNode;
};
type AnchorSlugState = {
  valueAsString: string;
};

/**
 * This is purposefully a class component, because `GithubSlugger.slug` is not
 * deterministic when used with React context.
 *
 * 1. Using `GithubSlugger.slug` via a React.Context makes it non-deterministic.
 * 2. `React.StrictMode` calls Function Components twice during development to run additional checks.
 * 3. These calls result in `GithubSlugger.slug` getting called twice, resulting in all slugs being suffixed with `"-1"` (e.g. "getting-started-1").
 * 4. Any hook patterns to restrict function calls during renders is made irrelevant, by `React.StrictMode` expecting Function Components to be absolutely pure.
 * 5. This only occurs with `React.StrictMode` during development using Function Components.
 *
 * The solution is to simply use a class component instead, and use a render prop to pass the value.
 *
 * 1. The component isn't absolutely pure on purpose.
 * 2. `React.StrictMode` doesn't silently change the behavior of class components.
 * 3. It isn't thaaat ugly use.
 *
 * Ideally, I'd generate the slugs higher up in the tree, and pass them down,
 * but these slugs are being dynamically generated from imported MDX further
 * down in the tree.
 * A cleaner solution would probably be just to write an MDX plugin... ugh
 */
export class AnchorSlug extends Component<AnchorSlugProps, AnchorSlugState> {
  static contextType = AnchorSlugContext;

  #_slug = "";

  declare context: ContextType<typeof AnchorSlugContext>;

  get #slug() {
    return this.#_slug;
  }

  set #slug(valueAsString: string) {
    this.#_slug = this.context.demand().slug(valueAsString);
  }

  get #valueAsString() {
    return String(this.props.value);
  }

  #updateSlug(valueAsString: string) {
    this.setState({ valueAsString });
    this.#slug = valueAsString;
  }

  state: AnchorSlugState = {
    valueAsString: this.#valueAsString,
  };

  componentDidUpdate() {
    const valueAsString = this.#valueAsString;

    if (this.state.valueAsString !== valueAsString) {
      this.#updateSlug(valueAsString);
    }
  }

  render() {
    if (this.#slug === "") {
      this.#slug = this.state.valueAsString;
    }

    return this.props.children(this.#slug);
  }
}

export const AnchorSlugProvider = memo(function AnchorSlugProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [value] = useState(() =>
    createMutableRef(REF_MESSAGE, new GithubSlugger())
  );

  return (
    <AnchorSlugContext.Provider value={value}>
      {children}
    </AnchorSlugContext.Provider>
  );
});
