import { EN, languages } from './config/languages'

// In development, use local locale files from /locales
// In production, use remote CDN or env variable
const publicUrl =
  process.env.NEXT_PUBLIC_I18N_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? '' : 'https://locales.pancakeswap.finance')

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
    const codeFromStorage = localStorage.getItem(LS_KEY)

    if (codeFromStorage && languages[codeFromStorage]) {
      return codeFromStorage
    }
    return EN.locale
  } catch {
    return EN.locale
  }
}
