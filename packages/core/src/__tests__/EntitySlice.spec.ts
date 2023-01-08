import * as vitest from "vitest";
import { assertType, describe, expect, it, test } from "vitest";

import { createEntitySlice } from "../EntitySlice.js";
import { createTestStore } from "./utils.js";

describe("EntitySlice", () => {
  type Book = { id: string; name: string };

  describe("createEntitySlice", () => {
    it("creates a slice with entity logic", async () => {
      const booksSlice = createEntitySlice<Book>().setReducer("book", "books", {
        best: (id: string) => id,
      });

      // @ts-expect-error The action doesn't accept invalid values
      booksSlice.actions.addBook(true);

      // Actions from Redux Toolkit should exist
      booksSlice.actions.addMany([]);

      const { store } = createTestStore(vitest);

      expect(store.getState()).toEqual(undefined);

      const addBookAction = booksSlice.actions.addBook({
        id: "1",
        name: "Goosebumps: Night of the Living Dummy",
      });

      assertType<{
        payload: Book;
        type: "books/addBook";
      }>(addBookAction);

      expect(addBookAction).toMatchSnapshot();

      store.dispatch(addBookAction);

      expect(store.getState()).toMatchSnapshot();

      const { selectBestBook } = booksSlice.selectors;

      // @ts-expect-error The selector shouldn't exist
      booksSlice.selectors.selectWorstBook;
      // The selector should exist
      assertType<(state: Record<string, unknown>) => Book[]>(
        booksSlice.selectors.selectAllBooks
      );

      expect(selectBestBook(store.getState())).toEqual(undefined);

      store.dispatch(booksSlice.actions.denoteBestBook("1"));

      expect(selectBestBook(store.getState())).toMatchSnapshot();
    });

    test("optional adjectives", async () => {
      const booksSlice = createEntitySlice<Book>().setReducer("book", "books");

      // @ts-expect-error The selector shouldn't exist
      const { selectBestBook } = booksSlice.selectors;

      expect(selectBestBook).toEqual(undefined);

      // @ts-expect-error The selector shouldn't exist
      expect(booksSlice.selectors.selectWorstBook).toEqual(undefined);
    });

    test("entity interface", async () => {
      interface Foo1 {
        bar: string;
      }
      type Foo2 = {
        bar: string;
      };

      // @ts-expect-error Types created with `interface` aren't compatible
      // with `Record<string, unknown>` by default.
      assertType<Record<string, unknown>>({} as Foo1);

      // Types created with `type` are compatible
      // with `Record<string, unknown>` by default.
      assertType<Record<string, unknown>>({} as Foo2);

      // No type error should occur when a entity type created with `interface` is used.
      createEntitySlice<Foo1>().setReducer("foo", "foos");

      // No type error should occur when a entity type created with `type` is used.
      createEntitySlice<Foo2>().setReducer("foo", "foos");
    });
  });
});
