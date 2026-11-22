import "server-only";
import { parseEnv, sharedEnvSchema } from "@kinora/config";

/** Validated server environment for the staff app. Import from server code only. */
export function getServerEnv() {
  return parseEnv(sharedEnvSchema, process.env);
}
