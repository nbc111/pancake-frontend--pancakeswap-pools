import { languages, ZHCN } from './config/languages'

/** 未在 localStorage 选择过语言时的默认（首次打开站点） */
export const DEFAULT_LOCALE = ZHCN.locale

// Use NEXT_PUBLIC_I18N_BASE_URL if set (e.g. CDN). Otherwise use relative /locales (app's public/locales).
// This ensures projects with custom locale keys (e.g. nbc-staking-admin) use their own files in production.
const publicUrl = process.env.NEXT_PUBLIC_I18N_BASE_URL ?? ''

export const LS_KEY = 'pancakeswap_language'

export const fetchLocale = async (locale: string) => {
  // Construct the URL: empty publicUrl means use relative path /locales
  const url = publicUrl ? `${publicUrl}/${locale}.json` : `/locales/${locale}.json`
  const response = await fetch(url)
  if (response.ok) {
    const data = await response.json()
    return data
  }

  console.error(`API: Failed to fetch locale ${locale} from ${url}`, response.statusText)
  return null
}

export const getLanguageCodeFromLS = () => {
  try {
    if (typeof window === 'undefined') {
      return DEFAULT_LOCALE
    }
    const codeFromStorage = localStorage.getItem(LS_KEY)

    if (codeFromStorage && languages[codeFromStorage]) {
      return codeFromStorage
    }
    return DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}
