import * as console from "node:console";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

const __dirname = url.fileURLToPath(new url.URL(".", import.meta.url));
const rootReadMeFile = path.resolve(__dirname, "../../../README.md");
const localReadMeFile = path.resolve("./README.md");

fs.copyFileSync(rootReadMeFile, localReadMeFile);

console.info("README.md copied.");
