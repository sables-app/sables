import type * as ReduxToolkit from "@reduxjs/toolkit";
import * as vitest from "vitest";
import {
  assertType,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
} from "vitest";

import {
  combineReducers,
  configureStore,
  createEntityAdapter,
} from "../../deps.js";
import {
  createNotableEntities,
  distinctEntityReducers,
  distinctEntitySelectors,
} from "../Entity.js";
import { createSlice } from "../Slice.js";
import { createTestStore } from "./utils.js";

describe("Entity", () => {
  type Book = { bookId: string; title: string };

  let booksAdapter: ReduxToolkit.EntityAdapter<Book>;

  beforeAll(() => {
    booksAdapter = createEntityAdapter<Book>({
      selectId: (book) => book.bookId,
      sortComparer: (a, b) => a.title.localeCompare(b.title),
    });
  });

  describe("distinctEntityReducers", () => {
    let bookReducers: ReturnType<typeof createTestConstructs>["bookReducers"];
    let booksSlice: ReturnType<typeof createTestConstructs>["booksSlice"];

    function createTestConstructs() {
      const bookReducers = distinctEntityReducers(booksAdapter, "book");
      const booksSlice = createSlice(
        "books",
        booksAdapter.getInitialState(),
      ).setReducer((builder) => builder.addCases(bookReducers));

      return { bookReducers, booksSlice };
    }

    beforeEach(() => {
      const testConstructs = createTestConstructs();

      bookReducers = testConstructs.bookReducers;
      booksSlice = testConstructs.booksSlice;
    });

    test("slice dependency integration", () => {
      const { store } = createTestStore(vitest);

      expect(store.getState()).toEqual(undefined);

      store.dispatch(
        booksSlice.actions.addBook({
          bookId: "1",
          title: "Harry Potter",
        }),
      );

      expect(store.getState().books).toMatchSnapshot();

      expect(
        bookReducers.addBook(store.getState().books, {
          bookId: "1",
          title: "Harry Potter",
        }),
      ).toMatchSnapshot();

      const booksSelectors = booksAdapter.getSelectors(
        booksSlice.selectBooksState,
      );

      expect(booksSelectors.selectAll(store.getState())).toMatchSnapshot();
    });

    it("assigns reducers from entity adapters to distinct names", () => {
      expect(
        booksSlice.actions.addBook({
          bookId: "3",
          title: "Goosebumps: Night of the Living Dummy",
        }).payload,
      ).toMatchSnapshot();
      expect(
        booksSlice.actions.addBooks([
          { bookId: "4", title: "Goosebumps: Night of the Living Dummy" },
          { bookId: "5", title: "Goosebumps: Welcome to Dead House" },
        ]).payload,
      ).toMatchSnapshot();
      expect(
        booksSlice.actions.setBook({
          bookId: "3",
          title: "Goosebumps: Night of the Living Dummy",
        }).payload,
      ).toMatchSnapshot();
      expect(
        booksSlice.actions.setBooks([
          { bookId: "4", title: "Goosebumps: Night of the Living Dummy" },
          { bookId: "5", title: "Goosebumps: Welcome to Dead House" },
        ]).payload,
      ).toMatchSnapshot();
      expect(
        booksSlice.actions.setAllBooks([
          { bookId: "4", title: "Goosebumps: Night of the Living Dummy" },
          { bookId: "5", title: "Goosebumps: Welcome to Dead House" },
        ]).payload,
      ).toMatchSnapshot();
      expect(booksSlice.actions.removeBook("2").payload).toMatchSnapshot();
      expect(
        booksSlice.actions.removeBooks(["1", "3"]).payload,
      ).toMatchSnapshot();
      expect(booksSlice.actions.removeAllBooks().payload).toMatchSnapshot();
      expect(
        booksSlice.actions.updateBook({
          id: "3",
          changes: { title: "Goosebumps: Night of the Living Dummy" },
        }).payload,
      ).toMatchSnapshot();
      expect(
        booksSlice.actions.updateBooks([
          {
            id: "3",
            changes: { title: "Goosebumps: Night of the Living Dummy" },
          },
          { id: "4", changes: { title: "Goosebumps: Welcome to Dead House" } },
        ]).payload,
      ).toMatchSnapshot();
      expect(
        booksSlice.actions.upsertBook({
          bookId: "3",
          title: "Goosebumps: Night of the Living Dummy",
        }).payload,
      ).toMatchSnapshot();
      expect(
        booksSlice.actions.upsertBooks([
          { bookId: "3", title: "Goosebumps: Night of the Living Dummy" },
          { bookId: "3", title: "Goosebumps: Welcome to Dead House" },
        ]).payload,
      ).toMatchSnapshot();
    });
  });

  describe("createNotableEntities", () => {
    it("creates action creators and reducers for notable entities", () => {
      const bookReducers = distinctEntityReducers(booksAdapter, "book");
      const notableBooks = createNotableEntities(booksAdapter, "book", {
        best: ({ id }: { id: string; reason: string }) => id,
        worst: (id: string) => id,
        favorite: (id: string) => id,
      });

      const booksSlice = createSlice("books", {
        ...booksAdapter.getInitialState(),
        ...notableBooks.getInitialState(),
      }).setReducer((builder) =>
        builder.addCases(bookReducers).addCases(notableBooks.reducers),
      );

      const {
        selectBestBook,
        selectWorstBook,
        selectFavoriteBook,
        selectBestBookPayload,
        selectBestBookId,
      } = notableBooks.getSelectors(booksSlice.selectBooksState);
      const store = configureStore({
        reducer: combineReducers({
          books: booksSlice.reducer,
        }),
      });

      const booksSelectors = booksAdapter.getSelectors(
        booksSlice.selectBooksState,
      );

      expect(booksSelectors.selectAll(store.getState())).toMatchSnapshot();
      expect(selectBestBook(store.getState())).toMatchSnapshot(
        "selectBestBook1",
      );
      expect(selectWorstBook(store.getState())).toMatchSnapshot(
        "selectWorstBook1",
      );
      expect(selectFavoriteBook(store.getState())).toMatchSnapshot(
        "selectFavoriteBook1",
      );

      const bestBookPayload = {
        id: "1",
        reason: "It's awesome!",
      };

      const denoteBestBookAction =
        booksSlice.actions.denoteBestBook(bestBookPayload);
      const denoteWorstBookAction = booksSlice.actions.denoteWorstBook("2");
      const denoteFavoriteBookAction =
        booksSlice.actions.denoteFavoriteBook("3");

      expect(denoteBestBookAction.payload).toMatchSnapshot();
      expect(denoteWorstBookAction.payload).toMatchSnapshot();
      expect(denoteFavoriteBookAction.payload).toMatchSnapshot();

      store.dispatch(denoteBestBookAction);
      store.dispatch(denoteWorstBookAction);
      store.dispatch(denoteFavoriteBookAction);

      store.dispatch(
        booksSlice.actions.addBooks([
          { bookId: "1", title: "Goosebumps: Monster Blood" },
          { bookId: "2", title: "Goosebumps: Night of the Living Dummy" },
          { bookId: "3", title: "Goosebumps: Welcome to Dead House" },
        ]),
      );

      expect(selectBestBook(store.getState())).toMatchSnapshot(
        "selectBestBook2",
      );
      expect(selectWorstBook(store.getState())).toMatchSnapshot(
        "selectWorstBook2",
      );
      expect(selectFavoriteBook(store.getState())).toMatchSnapshot(
        "selectFavoriteBook2",
      );
      expect(selectBestBookPayload(store.getState())).toStrictEqual(
        bestBookPayload,
      );
      expect(selectBestBookId(store.getState())).toStrictEqual(
        bestBookPayload.id,
      );
    });
  });

  describe("distinctEntitySelectors", () => {
    it("assigns selectors from entity adapters to distinct names", () => {
      const bookReducers = distinctEntityReducers(booksAdapter, "book");
      const booksSlice = createSlice(
        "books",
        booksAdapter.getInitialState(),
      ).setReducer((builder) => builder.addCases(bookReducers));

      const {
        selectAllBooks,
        selectBookById,
        selectBookCount,
        selectBookDictionary,
        selectBookIds,
      } = distinctEntitySelectors(
        booksAdapter.getSelectors(booksSlice.selector),
        "book",
      );

      const { store, insertSlices } = createTestStore(vitest);

      insertSlices(booksSlice);

      assertType<Book[]>(selectAllBooks(store.getState()));
      assertType<Book | undefined>(selectBookById(store.getState(), "fake-id"));
      assertType<number>(selectBookCount(store.getState()));
      assertType<ReduxToolkit.Dictionary<Book>>(
        selectBookDictionary(store.getState()),
      );
      assertType<ReduxToolkit.EntityId[]>(selectBookIds(store.getState()));
    });
  });
});
