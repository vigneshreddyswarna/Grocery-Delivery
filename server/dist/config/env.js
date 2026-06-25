import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const currentDir = dirname(fileURLToPath(import.meta.url));
const envPaths = [
    resolve(currentDir, "../.env"),
    resolve(currentDir, "../../.env"),
];
for (const path of envPaths) {
    dotenv.config({ path, override: false });
}
