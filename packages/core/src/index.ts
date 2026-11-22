// Domain services. Each domain lives in its own folder (src/<domain>/) and owns its
// validation, permissions and data access. UI code imports from here, never from the DB.
export * as email from "./email";
export * as identity from "./identity";
export * as markets from "./markets";
export * as membership from "./membership";
export { getDatabase, type Database } from "./database";
