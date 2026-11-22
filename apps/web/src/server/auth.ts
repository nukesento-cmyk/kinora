import "server-only";
import { email, getDatabase, identity } from "@kinora/core";
import { after } from "next/server";
import { getAuthEnv, getServerEnv } from "@/env";
import { authEmailTemplates } from "./emails";

const KEY = Symbol.for("kinora.web.auth");

function build() {
  const env = getAuthEnv();
  return identity.createAuth({
    db: getDatabase(process.env),
    appUrl: env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    secureCookies: env.secureCookies,
    markets: getServerEnv().launchMarkets,
    mailer: email.createMailer(env),
    emails: authEmailTemplates(),
    google: env.google,
    // Send email after the response, so timing never reveals whether an account exists.
    runInBackground: (task) => after(task),
  });
}

/** The member app's Better Auth instance (one per server process). */
export function getAuth(): identity.Auth {
  const g = globalThis as { [KEY]?: identity.Auth };
  g[KEY] ??= build();
  return g[KEY];
}

export function getDb() {
  return getDatabase(process.env);
}
