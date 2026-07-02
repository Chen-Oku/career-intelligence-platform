import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import fs from "node:fs";
import path from "node:path";

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "cip_locale";

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

// Messages are split into one JSON file per namespace under messages/<locale>/,
// so independent pages/components can be translated without every change
// touching a single shared file. Each filename (without extension) becomes
// the top-level namespace passed to useTranslations()/getTranslations().
//
// Cached only in production: files don't change after build there, but in
// dev an in-memory cache would go stale the moment a namespace file is
// added or edited without a full server restart (fs.readFileSync isn't
// part of the module graph, so HMR doesn't invalidate it).
const messagesCache = new Map<Locale, Record<string, unknown>>();

function loadMessages(locale: Locale): Record<string, unknown> {
  if (process.env.NODE_ENV === "production") {
    const cached = messagesCache.get(locale);
    if (cached) return cached;
  }

  const dir = path.join(process.cwd(), "messages", locale);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const messages: Record<string, unknown> = {};
  for (const file of files) {
    const namespace = file.replace(/\.json$/, "");
    messages[namespace] = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
  }

  if (process.env.NODE_ENV === "production") {
    messagesCache.set(locale, messages);
  }
  return messages;
}

// No URL locale prefixing: every route stays where it is (auth, dashboard,
// api). Locale is resolved from a cookie so switching language doesn't
// require restructuring the App Router tree into a [locale] segment.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: loadMessages(locale),
  };
});
