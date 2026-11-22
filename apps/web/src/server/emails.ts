import "server-only";
import { email, type identity } from "@kinora/core";
import { getBrand } from "@kinora/ui/brand";
import { createTranslator } from "next-intl";
import messages from "../../messages/en.json";

/**
 * Auth emails, written from the `auth.email` messages. Plain text first, with a
 * simple HTML version carrying the same words and one link.
 */
export function authEmailTemplates(): identity.AuthEmailTemplates {
  const brand = getBrand(process.env).name;
  const t = createTranslator({ locale: "en", messages, namespace: "auth.email" });
  const footer = t("footer", { brand });

  const compose = (
    to: string,
    subject: string,
    paragraphs: string[],
    action?: { label: string; url: string },
  ): email.EmailMessage => ({
    to,
    subject,
    text: [...paragraphs, ...(action ? [`${action.label}: ${action.url}`] : []), "", footer].join(
      "\n\n",
    ),
    html: email.renderEmailHtml({ paragraphs, action, footer }),
  });

  return {
    verifyEmail: ({ to, name, url }) =>
      compose(
        to,
        t("verify.subject", { brand }),
        [t("greeting", { name }), t("verify.body", { brand }), t("verify.expiry")],
        { label: t("verify.action"), url },
      ),
    resetPassword: ({ to, name, url }) =>
      compose(
        to,
        t("reset.subject", { brand }),
        [t("greeting", { name }), t("reset.body", { brand }), t("reset.expiry")],
        { label: t("reset.action"), url },
      ),
    existingAccount: ({ to, name, signInUrl, resetUrl }) =>
      compose(
        to,
        t("existing.subject", { brand }),
        [
          t("greeting", { name }),
          t("existing.body", { brand }),
          t("existing.reset", { url: resetUrl }),
          t("existing.ignore"),
        ],
        { label: t("existing.signIn"), url: signInUrl },
      ),
  };
}
