import { franc } from 'franc'

export type Language = 'en' | 'hi' | 'hinglish'

export function detectLanguage(text: string): Language {
  const detectedLang = franc(text)
  
  // Check for Hinglish patterns (English script but Indian context)
  const hinglishPatterns = /\b(hai|hain|kar|kya|aise|wala|matlab|accha|theek|bhai|yaar|dekho|sunao|batao)\b/i
  
  // Check for Hindi script
  const hindiScript = /[\u0900-\u097F]/
  
  if (detectedLang === 'hin' || hindiScript.test(text)) {
    return 'hi'
  } else if (hinglishPatterns.test(text)) {
    return 'hinglish'
  } else {
    return 'en'
  }
}

export function formatResponse(response: string, language: Language): string {
  switch (language) {
    case 'hi':
      return `🙏 ${response}`
    case 'hinglish':
      return `👋 ${response}`
    default:
      return response
  }
}

export function getLanguageDisplayName(language: Language): string {
  switch (language) {
    case 'hi':
      return 'हिंदी'
    case 'hinglish':
      return 'Hinglish'
    default:
      return 'English'
  }
}