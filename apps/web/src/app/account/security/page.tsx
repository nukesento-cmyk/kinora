import { identity } from "@kinora/core";
import { Panel } from "@kinora/ui";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Notice } from "@/components/auth/notice";
import { SubmitButton } from "@/components/auth/submit-button";
import { describeUserAgent } from "@/lib/user-agent";
import { getDb } from "@/server/auth";
import { requireSession } from "@/server/session";
import { revokeSession, signOutEverywhere } from "../actions";
import { ChangePasswordForm } from "./change-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.security");
  return { title: t("title") };
}

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession("/account/security");
  const [params, t, format] = await Promise.all([
    searchParams,
    getTranslations("auth.security"),
    getFormatter(),
  ]);
  const now = new Date();
  const sessions = await identity.listActiveSessions(getDb(), session.user.id, now);
  const current = sessions.find((s) => s.id === session.session.id);
  const others = sessions.filter((s) => s.id !== session.session.id);
  const deviceName = (ua: string | null) => {
    const d = describeUserAgent(ua);
    return t("device", { browser: d.browser ?? t("unknownBrowser"), os: d.os ?? t("unknownOs") });
  };
  const when = (date: Date) => format.relativeTime(date, now);

  return (
    <>
      <h1 className="text-4xl font-[850] tracking-[-0.035em]">{t("title")}</h1>
      {params.notice === "revoked" ? <Notice>{t("revoked")}</Notice> : null}
      {params.notice === "revoke-failed" ? <Notice tone="info">{t("revokeFailed")}</Notice> : null}

      <Panel>
        <section aria-labelledby="sessions-title" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="sessions-title" className="text-xl">
              {t("sessionsTitle")}
            </h2>
            <p className="text-ink-muted">{t("sessionsIntro")}</p>
          </div>
          <ul className="flex flex-col divide-y divide-line" data-testid="session-list">
            {current ? (
              <li className="flex flex-col gap-1 py-3" data-testid="session-current">
                <p className="font-semibold">
                  {deviceName(current.userAgent)}{" "}
                  <span className="ml-1 rounded-control bg-primary-soft px-2 py-0.5 text-sm text-primary-ink">
                    {t("thisDevice")}
                  </span>
                </p>
                <p className="text-sm text-ink-muted">
                  {t("signedIn", { when: when(current.createdAt) })}
                  {current.ipAddress ? ` · ${t("ipAddress", { ip: current.ipAddress })}` : null}
                </p>
              </li>
            ) : null}
            {others.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                data-testid="session-other"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">{deviceName(s.userAgent)}</p>
                  <p className="text-sm text-ink-muted">
                    {t("lastActive", { when: when(s.lastActiveAt) })} ·{" "}
                    {t("signedIn", { when: when(s.createdAt) })}
                    {s.ipAddress ? ` · ${t("ipAddress", { ip: s.ipAddress })}` : null}
                  </p>
                </div>
                <form action={revokeSession}>
                  <input type="hidden" name="sessionId" value={s.id} />
                  <SubmitButton
                    variant="secondary"
                    pendingLabel={t("revoking")}
                    aria-label={t("revokeLabel", {
                      device: deviceName(s.userAgent),
                      when: when(s.lastActiveAt),
                    })}
                  >
                    {t("revoke")}
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
          {others.length === 0 ? <p className="text-ink-muted">{t("onlyThisDevice")}</p> : null}
        </section>
      </Panel>

      <Panel>
        <section aria-labelledby="everywhere-title" className="flex flex-col gap-4">
          <h2 id="everywhere-title" className="text-xl">
            {t("everywhereTitle")}
          </h2>
          <p className="max-w-prose text-ink-muted">{t("everywhereBody")}</p>
          <form action={signOutEverywhere}>
            <SubmitButton variant="secondary" pendingLabel={t("everywhereSubmitting")}>
              {t("everywhereSubmit")}
            </SubmitButton>
          </form>
        </section>
      </Panel>

      <Panel>
        <section aria-labelledby="password-title" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="password-title" className="text-xl">
              {t("passwordTitle")}
            </h2>
            <p className="text-ink-muted">{t("passwordIntro")}</p>
          </div>
          <ChangePasswordForm
            passwordMin={identity.PASSWORD_MIN_LENGTH}
            passwordMax={identity.PASSWORD_MAX_LENGTH}
          />
        </section>
      </Panel>
    </>
  );
}
