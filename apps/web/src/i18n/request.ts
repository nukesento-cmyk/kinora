import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

// Single locale for now, without locale-prefixed URLs. When a second language ships,
// the locale is resolved here (member preference, then Accept-Language).
export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
