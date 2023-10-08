import "./setupMocks.js";

import { silenceLogs } from "@sables-app/test-utils";

import path from "node:path";

import fs from "fs-jetpack";
import { beforeEach, describe, expect, it } from "vitest";
import * as vitest from "vitest";

import { createImportTagsPlugin } from "../ImportTagsPlugin.js";

const codeFixture = `
import "moduleA";
import { value } from "moduleB";

const foo = "bar";

function hello() {
  return import("./moduleC");
}

/** @type {import('my-package')['someProperty']} */
import("./moduleD").then(console.log);
import("./moduleF").catch(console.log);
import("./moduleG").finally(console.log);

/**
 * import('my-package').someProperty
 * import('my-package')['someProperty']
 * \`import('my-package').someProperty\`
 * \`import('my-package')['someProperty']\`
 */
const qux = (await import("./moduleE")).default;

/**
 * Sets focus at a given node. The last focused element will help to determine which element(first or last) should be focused.
 * HTML markers (see {@link import('./constants').FOCUS_AUTO} constants) can control autofocus
 * @param topNode
 * @param lastNode
 * @param options
 */
`;

describe("ImportTagsPlugin", () => {
  silenceLogs(vitest, "info");

  describe("plugin", () => {
    const fsWriteMock = fs.write as vitest.Mock;

    let plugin: ReturnType<typeof createImportTagsPlugin>;

    beforeEach(() => {
      fsWriteMock.mockReset();
      plugin = createImportTagsPlugin();
    });

    function invokeTransform() {
      return plugin.transform(codeFixture, "./myModules/MyModule.tsx");
    }

    describe("transform", () => {
      it("transforms modules", () => {
        const result = invokeTransform();
        const code = typeof result == "string" ? result : result?.code;

        expect(code).toMatchSnapshot();
      });
    });

    describe("buildEnd", () => {
      beforeEach(() => {
        invokeTransform();
      });

      it("writes a manifest to the build directory", () => {
        expect(fsWriteMock).toHaveBeenCalledTimes(0);

        plugin.buildEnd();

        expect(fsWriteMock).toHaveBeenCalledOnce();

        const [manifestPath, manifest] = fsWriteMock.mock.calls[0];
        const expectedManifestPathSuffix = path.resolve(
          process.cwd(),
          "importTagsManifest.json"
        );

        expect(path.isAbsolute(manifestPath)).toBe(true);
        expect(manifestPath).toBe(expectedManifestPathSuffix);
        expect(manifest).toMatchSnapshot();
      });

      describe("when an error occurs", () => {
        it("doesn't write the manifest", () => {
          expect(fsWriteMock).toHaveBeenCalledTimes(0);

          plugin.buildEnd(new Error());

          expect(fsWriteMock).toHaveBeenCalledTimes(0);
        });
      });
    });
  });
});
