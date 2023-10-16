import {
  LIFECYCLE_REF_MESSAGE,
  SERVER_REQUEST_STATE_REF_MESSAGE,
} from "@sables/core";
import { createMutableRef, MutableReferenceObject } from "@sables/utils";

import { createContext, ReactNode, useContext } from "react";

import { Manager, ServerRequestState } from "./types.js";

/** @internal */
export interface LifecycleState {
  readonly managerRef: MutableReferenceObject<Manager<any, any>>;
  readonly serverRequestStateRef: MutableReferenceObject<ServerRequestState>;
}

function createManagerRef() {
  return createMutableRef<Manager<any, any>>("No manager found in context.");
}

type ServerProps = Pick<ServerRequestState, "href"> | undefined;

function createServerRequestState(
  serverProps: ServerProps,
): ServerRequestState | undefined {
  if (!serverProps) {
    return undefined;
  }

  return {
    ...serverProps,
    invokedImporters: new Set(),
    routeTransitionStarted: false,
  };
}

/** @internal */
export type ServerRequestStateRef = MutableReferenceObject<ServerRequestState>;

function createServerRequestStateRef(
  props: ServerProps,
): ServerRequestStateRef {
  return createMutableRef<ServerRequestState>(
    SERVER_REQUEST_STATE_REF_MESSAGE,
    createServerRequestState(props),
  );
}

/** @internal */
export type LifecycleRef = MutableReferenceObject<LifecycleState>;

/**
 * To help ensure reliability, this function should not be exported.
 * A new `LifecycleRef` should be created using `createLifecycle`.
 */
function createLifecycleRef(props: ServerProps): LifecycleRef {
  return createMutableRef<LifecycleState>(LIFECYCLE_REF_MESSAGE, {
    managerRef: createManagerRef(),
    serverRequestStateRef: createServerRequestStateRef(props),
  });
}

/**
 * The default lifecycle used when one isn't provided using `createLifecycle`.
 * This reference should only be used when the application is running a in script
 * within a browser. Otherwise a new `LifecycleRef` should be created.
 * For example, a new `LifecycleRef` is created for each incoming request during SSR.
 */
const globalLifecycleRef = createLifecycleRef(undefined);

const LifecycleContext = createContext(globalLifecycleRef);

/** @internal */
export function createLifecycle(props?: ServerProps) {
  const lifecycleRef = createLifecycleRef(props);

  function Lifecycle({ children }: { children: ReactNode }) {
    return (
      <LifecycleContext.Provider value={lifecycleRef}>
        {children}
      </LifecycleContext.Provider>
    );
  }

  Lifecycle.ref = lifecycleRef;

  return Object.freeze(Lifecycle);
}

/** @internal */
export function useLifecycleState() {
  return useContext(LifecycleContext).demand();
}

/** @internal */
export function useServerRequestStateRef() {
  return useLifecycleState().serverRequestStateRef;
}
