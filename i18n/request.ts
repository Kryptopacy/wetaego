import {getRequestConfig} from 'next-intl/server';
import { cookies } from 'next/headers';

// Supported ISO 639-1 Language Codes:
// en: English (Global Default)
// es: Spanish (Español)
// fr: French (Français)
// yo: Yorùbá (West Africa / Nigeria)
// ig: Igbo (West Africa / Nigeria)
// ha: Hausa (West/Central Africa / Northern Nigeria)
export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'yo', 'ig', 'ha'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const locale: SupportedLocale = (SUPPORTED_LOCALES as readonly string[]).includes(rawLocale) 
    ? (rawLocale as SupportedLocale) 
    : 'en';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
