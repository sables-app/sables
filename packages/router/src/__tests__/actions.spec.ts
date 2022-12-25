import { hasLazyMeta } from "@sables/core";

import { describe, expect, it } from "vitest";

import {
  advanceLocation,
  chooseLocation,
  pushLocation,
  replaceLocation,
  retreatLocation,
} from "../actions.js";

describe("actions", () => {
  describe("chooseLocation", () => {
    it("creates a `go` action from redux-first-history", () => {
      expect(chooseLocation(1)).toMatchSnapshot();
    });

    it("is slice dependency", () => {
      expect(hasLazyMeta(chooseLocation)).toBe(true);
    });
  });

  describe("retreatLocation", () => {
    it("creates a `goBack` action from redux-first-history", () => {
      expect(retreatLocation()).toMatchSnapshot();
    });

    it("is slice dependency", () => {
      expect(hasLazyMeta(retreatLocation)).toBe(true);
    });
  });

  describe("advanceLocation", () => {
    it("creates a `goForward` action from redux-first-history", () => {
      expect(advanceLocation()).toMatchSnapshot();
    });

    it("is slice dependency", () => {
      expect(hasLazyMeta(advanceLocation)).toBe(true);
    });
  });

  describe("pushLocation", () => {
    it("creates a `push` action from redux-first-history", () => {
      expect(pushLocation("/")).toMatchSnapshot();
    });

    it("is slice dependency", () => {
      expect(hasLazyMeta(pushLocation)).toBe(true);
    });
  });

  describe("replaceLocation", () => {
    it("creates a `replace` action from redux-first-history", () => {
      expect(replaceLocation("/")).toMatchSnapshot();
    });

    it("is slice dependency", () => {
      expect(hasLazyMeta(replaceLocation)).toBe(true);
    });
  });
});
