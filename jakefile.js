/* global require */
/* eslint-disable @typescript-eslint/no-var-requires */
const { exec, taskExec } = require("@sables-app/scripts/jakeHelpers");
const { desc, namespace, task } = require("jake");

desc("Run tests.");
taskExec("test", "CI=1 npx vitest");

desc("Run ESLint over source files.");
taskExec("lint", "npx eslint .");

namespace("lint", () => {
  taskExec("fix", "npx eslint --fix .");
});

desc("Format source files with Prettier.");
taskExec("format", "npx prettier --write .");

task("typecheck", ["typecheck:website"]);

namespace("typecheck", () => {
  taskExec("website", "npm run typecheck --workspace=@sables-app/website");
});

namespace("dev", () => {
  taskExec("website", "npm run dev --workspace=@sables-app/website");

  namespace("website", () => {
    taskExec("host", "npm run dev --workspace=@sables-app/website -- --host");
    taskExec("worker", "npm run dev:worker --workspace=@sables-app/website");
  });

  taskExec("packages", "npx tsc --build --watch --pretty -f -v .");
});

namespace("watch", () => {
  namespace("build", () => {
    taskExec("website", "npm run watch-build --workspace=@sables-app/website");
  });
});

namespace("serve", () => {
  desc("Start the built example app server.");
  taskExec("website", "npm run serve --workspace=@sables-app/website");
});

desc("Delete all build artifacts.");
task("clean", () =>
  Promise.all([
    exec("rm -rf ./examples/*/dist"),
    exec("rm -rf ./examples/*/tsconfig.tsbuildinfo"),
    exec("rm -rf ./packages/*/dist"),
    exec("rm -rf ./packages/*/tsconfig.tsbuildinfo"),
    exec("rm -rf ./website/dist"),
    exec("rm -rf ./website/tsconfig.tsbuildinfo"),
  ])
);

namespace("clean", () => {
  taskExec("website", "rm -rf ./website/dist");
});

desc("Build all artifacts.");
task("build", ["build:packages", "build:website"]);

namespace("build", () => {
  taskExec("website", "npm run build --workspace=@sables-app/website");

  namespace("website", () => {
    taskExec("server", "npm run build:server --workspace=@sables-app/website");
  });

  task("packages", ["build:packages:tsc", "build:packages:boilerplate"]);

  namespace("packages", () => {
    taskExec("boilerplate", "npm run build --workspace=@sables/boilerplate");
    taskExec("tsc", "npx tsc --build --pretty -v .");

    namespace("tsc", () => {
      taskExec("force", "npx tsc --build --pretty -v -f .");
    });
  });
});

task("publish", ["publish:website"]);
namespace("publish", () => {
  task("website", ["publish:website:assets", "publish:website:worker"], {
    concurrency: 2,
  });
  namespace("website", () => {
    taskExec(
      "assets",
      "npm run publish:assets --workspace=@sables-app/website"
    );
    taskExec(
      "worker",
      "npm run publish:worker --workspace=@sables-app/website"
    );
  });
});

task("gamut", ["clean", "build", "test", "publish"]);
