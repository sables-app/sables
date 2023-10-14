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

task("publish", ["publish:packages"]);

namespace("publish", () => {
  taskExec("packages", "npx changeset publish");
});

task("deploy", ["deploy:website"]);

namespace("deploy", () => {
  task("website", ["deploy:website:assets", "deploy:website:worker"], {
    concurrency: 2,
  });

  namespace("website", () => {
    taskExec("assets", "npm run deploy:assets --workspace=@sables-app/website");
    taskExec(
      "worker",
      "npm run deploy:worker --workspace=@sables-app/website -- --env=production"
    );
  });
});

task("prepare", ["clean", "build", "test"]);

namespace("prepare", () => {
  task("packages", ["clean", "build:packages", "test"]);
});

task("gamut", ["prepare", "publish", "deploy"]);
