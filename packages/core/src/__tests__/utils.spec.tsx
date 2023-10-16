import { create } from "react-test-renderer";
import { describe, expect, it } from "vitest";

import { withProps } from "../utils.js";

describe("utils", () => {
  describe("withProps", () => {
    it("assigns props to the given component", async () => {
      const Link = withProps("a", { className: "foo" });
      const linkRender = create(<Link>Hello</Link>).toJSON();

      expect(linkRender).toHaveProperty("props.className", "foo");

      const ButtonLink = withProps(Link, { role: "button" });
      const buttonRender = create(<ButtonLink>Hello</ButtonLink>).toJSON();

      expect(buttonRender).toHaveProperty("props.className", "foo");
      expect(buttonRender).toHaveProperty("props.role", "button");
    });

    describe("getter", () => {
      it("resolves props", async () => {
        const Link = withProps("a", (props) => ({
          ...props,
          className: "foo",
        }));
        const linkRender = create(<Link>Hello</Link>).toJSON();

        expect(linkRender).toHaveProperty("props.className", "foo");

        const ButtonLink = withProps(Link, (props) => ({
          ...props,
          role: "button",
        }));
        const buttonRender = create(<ButtonLink>Hello</ButtonLink>).toJSON();

        expect(buttonRender).toHaveProperty("props.className", "foo");
        expect(buttonRender).toHaveProperty("props.role", "button");

        const AlteredButton = withProps(
          Link,
          ({ className, ...otherProps }) => ({
            ...otherProps,
          }),
        );
        const alteredButtonRender = create(
          <AlteredButton className="bar" role="banner" id="submitButton">
            Hello
          </AlteredButton>,
        ).toJSON();

        // the previous "className" was retained
        expect(alteredButtonRender).toHaveProperty("props.className", "foo");
        // "role" was overridden
        expect(alteredButtonRender).toHaveProperty("props.role", "banner");
        // "id" was added
        expect(alteredButtonRender).toHaveProperty("props.id", "submitButton");
      });
    });
  });
});
