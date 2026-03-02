let translations: Record<string, string> = {}

export async function loadTranslations(lang: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/translations?lang=${lang}`
    )
    if (res.ok) translations = await res.json()
  } catch {}
}

export function t(key: string, replacements?: Record<string, string>): string {
  let text = translations[key] || key
  if (replacements) {
    Object.entries(replacements).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v)
    })
  }
  return text
}

export function setTranslations(data: Record<string, string>) {
  translations = data
}
