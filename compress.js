import * as fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import * as path from "path";
import { pipeline } from "stream/promises";
import {
  createGzip,
  createBrotliCompress,
  constants,
} from "zlib";

async function do_gzip(input, output) {
  const gzip = createGzip({ level: 9 });
  const source = createReadStream(input);
  const destination = createWriteStream(output);
  await pipeline(source, gzip, destination);
}

async function do_brotli(input, output) {
  const brotli = createBrotliCompress({
    params: {
      [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
    },
  });
  const source = createReadStream(input);
  const destination = createWriteStream(output);
  await pipeline(source, brotli, destination);
}

async function* walk(dir) {
  for await (const d of await fs.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(entry);
    else if (d.isFile() && !d.name.startsWith(".") && !d.name.endsWith(".gz") && !d.name.endsWith(".br"))
      yield d;
  }
}

async function main() {
  for await (const p of walk("./dist")) {
    await do_gzip(p.path, `${p.path}.gz`);
    await do_brotli(p.path, `${p.path}.br`);
  }
}

main();
