import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/server/auth";

// Better Auth's HTTP API (used by Google's callback and by the app's own server actions
// through authRequest). Rate limiting and the origin check apply to every request.
export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler((request: Request) => getAuth().handler(request));
