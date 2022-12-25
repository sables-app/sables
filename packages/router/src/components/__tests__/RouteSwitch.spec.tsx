import { createSelector } from "@sables/core";

import { Provider } from "react-redux";
import { act, create } from "react-test-renderer";
import * as vitest from "vitest";
import { describe, expect, test } from "vitest";

import {
  initializeTestRouter,
  mockImporter,
  waitForEnsuredRouteTransition,
  waitForRouteTransition,
} from "../../__tests__/utils";
import { ensureLocation } from "../../actions.js";
import { createRoutes } from "../../Routes.js";
import {
  selectCurrentHref,
  selectCurrentLocation,
  selectCurrentRoute,
} from "../../selectors.js";
import { createRouteSwitch } from "../RouteSwitch.js";

describe("integration", () => {
  test("RouteSwitch", async () => {
    const initialRoutes = createRoutes()
      .set("appRoot", "/app")
      .set("dogs", "/app/dogs")
      .set("cats", "/app/cats");
    function AppRootScreen() {
      return <div>App Root Screen</div>;
    }
    function DogsScreen() {
      return <div>Dogs Screen</div>;
    }
    function CatsScreen() {
      return <div>Cats Screen</div>;
    }
    function NotFoundScreen() {
      return <div>Not Found Screen</div>;
    }
    function LoadingScreen() {
      return <div>Loading Screen</div>;
    }
    const DogsScreenImporter = mockImporter(vitest, "DogsImporter", DogsScreen);
    const selectLocationEndsWithCats = createSelector(
      selectCurrentLocation,
      (location) => !!location?.pathname?.endsWith("cats")
    );
    const TestRouteSwitch = createRouteSwitch({
      fallback: <LoadingScreen />,
    })
      .case(initialRoutes.AppRoot, <AppRootScreen />)
      .case(initialRoutes.Dogs, DogsScreenImporter)
      .case(selectLocationEndsWithCats, <CatsScreen />)
      .default(<NotFoundScreen />);
    const { assertCurrentRouteID, store } = initializeTestRouter(vitest, {
      initialLocation: initialRoutes.AppRoot.build(),
      initialRoutes,
    });
    const testJSX = (
      <Provider store={store}>
        <TestRouteSwitch />
      </Provider>
    );
    const render = create(testJSX);

    function assertRenderText(text: string) {
      expect(render.toJSON()).toHaveProperty("children.0", text);
    }

    // The initial location has been set
    expect(selectCurrentHref(store.getState())).toBe("/app");
    // The `AppRoot` route hasn't been transitioned to yet
    expect(selectCurrentRoute(store.getState())).toBeNull();
    // `NotFoundScreen` renders because none of the cases match yet
    assertRenderText("Not Found Screen");
    {
      // Wait for the initial route transition to complete
      await waitForRouteTransition();
      act(() => render.update(testJSX));
    }
    // Now `AppRootScreen` is rendered, because the current route `AppRoot`
    assertCurrentRouteID(initialRoutes.AppRoot.id);
    assertRenderText("App Root Screen");
    {
      store.dispatch(ensureLocation(initialRoutes.Dogs));
      await waitForEnsuredRouteTransition();
      act(() => render.update(testJSX));
    }
    assertCurrentRouteID(initialRoutes.Dogs.id);
    // The route has been transitioned to, but the component importer
    // has yet to resolve. `React.Suspense` is used by default with the
    // `fallback` option. As a result, `LoadingScreen` should be rendered
    // until the component importer has resolved.
    assertRenderText("Loading Screen");
    {
      // Wait for the component importer to resolve.
      await Promise.resolve();
      act(() => render.update(testJSX));
    }
    assertRenderText("Dogs Screen");
    {
      store.dispatch(ensureLocation("/location-does-not-match"));
      await waitForEnsuredRouteTransition();
      act(() => render.update(testJSX));
    }
    expect(selectCurrentRoute(store.getState())).toBeNull();
    // Renders `NotFoundScreen` because the location doesn't match any case
    assertRenderText("Not Found Screen");
    {
      store.dispatch(ensureLocation("/location/ends-with.cats"));
      await waitForEnsuredRouteTransition();
      act(() => render.update(testJSX));
    }
    expect(selectCurrentRoute(store.getState())).toBeNull();
    // Renders `CatsScreen` because the `selectLocationEndsWithCats` returned `true`
    assertRenderText("Cats Screen");
    {
      store.dispatch(ensureLocation(initialRoutes.Cats));
      await waitForEnsuredRouteTransition();
      act(() => render.update(testJSX));
    }
    assertCurrentRouteID(initialRoutes.Cats.id);
    // Still renders `CatsScreen` because the `selectLocationEndsWithCats` returned `true`,
    // because `initialRoutes.Cats.path === "/app/cats"`
    assertRenderText("Cats Screen");
  });
});
