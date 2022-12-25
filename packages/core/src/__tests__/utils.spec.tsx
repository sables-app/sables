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
  });
});
