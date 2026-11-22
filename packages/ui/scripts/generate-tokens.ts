import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderTokensCss } from "../src/tokens-css";

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/styles/tokens.css");
writeFileSync(out, renderTokensCss());
console.log(`✓ Wrote ${path.relative(process.cwd(), out)}`);
