/* global module, require */
/* eslint-disable @typescript-eslint/no-var-requires */
const concurrently = require("concurrently");
const { task } = require("jake");
const shell = require("shelljs");

/**
 * @param {string} command
 * @param {import("shelljs").ExecOptions} options
 */
function exec(command, options = {}) {
  /** @type {import("child_process").ChildProcess} */
  let childProcess;
  const promise = new Promise((resolve, reject) => {
    childProcess = shell.exec(command, options, (code) => {
      code === 0 ? resolve() : reject();
    });
  });

  return Object.assign(promise, { process: childProcess });
}

/**
 * @param {Parameters<typeof import('concurrently').default>[0]} commands
 */
function execParallel(commands) {
  return concurrently(commands, {
    killOthers: ["failure"],
    raw: true,
  });
}

/**
 * @param {string} name
 * @param {string} command
 */
function taskExec(name, command) {
  task(name, () => exec(command));
}

module.exports = {
  exec,
  execParallel,
  taskExec,
};
