import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
  // 优先从 cookie 获取语言设置
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value as Locale | undefined;
  
  if (localeCookie && locales.includes(localeCookie)) {
    return {
      locale: localeCookie,
      messages: (await import(`./messages/${localeCookie}.json`)).default,
    };
  }

  // 其次从 Accept-Language header 获取
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  
  if (acceptLanguage) {
    const browserLocale = acceptLanguage.split(',')[0].split('-')[0] as Locale;
    if (locales.includes(browserLocale)) {
      return {
        locale: browserLocale,
        messages: (await import(`./messages/${browserLocale}.json`)).default,
      };
    }
  }

  // 默认语言
  return {
    locale: defaultLocale,
    messages: (await import(`./messages/${defaultLocale}.json`)).default,
  };
});
