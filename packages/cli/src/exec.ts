import type { ChildProcess } from "node:child_process";

import shell, { ExecOptions } from "shelljs";

type PromiseWithChildProcess<T> = Promise<T> & { childProcess: ChildProcess };

export function exec(
  command: string,
  options: ExecOptions = {},
): PromiseWithChildProcess<void> {
  let childProcess: ChildProcess;

  const promise = new Promise<void>((resolve, reject) => {
    childProcess = shell.exec(command, options, (code) => {
      code === 0 ? resolve() : reject();
    });
  });

  return Object.assign(promise, {
    get childProcess() {
      return childProcess;
    },
  });
}
