import { DAYS_OF_WEEK } from '@/constants/menu'
import type { DayOfWeek } from '@/types/menu'

/**
 * Serbian day name patterns (case-insensitive).
 * Order matches DAYS_OF_WEEK (Mon–Fri); Sat/Sun used only to trim.
 */
const SERBIAN_DAYS: { day: DayOfWeek | null; pattern: RegExp }[] = [
  { day: 'Понедельник', pattern: /^ponedeljak$/i },
  { day: 'Вторник',     pattern: /^utorak$/i },
  { day: 'Среда',       pattern: /^sred[au]$/i },
  { day: 'Четверг',     pattern: /^[čc]etvrtak$/i },
  { day: 'Пятница',     pattern: /^petak$/i },
  { day: null,          pattern: /^subota$/i },
  { day: null,          pattern: /^nedelja$/i },
]

interface DayChunk {
  day: DayOfWeek
  text: string
}

/**
 * Split raw Serbian menu text into per-day chunks (Mon–Fri).
 * Saturday and Sunday sections are discarded.
 */
export function splitMenuByDay(text: string): DayChunk[] {
  const lines = text.split('\n')

  interface RawSection {
    day: DayOfWeek | null
    startLine: number
  }

  const sections: RawSection[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim()
    for (const { day, pattern } of SERBIAN_DAYS) {
      if (pattern.test(line)) {
        sections.push({ day, startLine: i })
        break
      }
    }
  }

  const chunks: DayChunk[] = []

  for (let s = 0; s < sections.length; s++) {
    const section = sections[s]
    if (!section) continue
    const { day, startLine } = section
    if (day === null) continue // skip Sat/Sun

    const endLine = sections[s + 1]?.startLine ?? lines.length

    const dayText = lines.slice(startLine, endLine).join('\n').trim()
    if (dayText) {
      chunks.push({ day, text: dayText })
    }
  }

  // Validate we got all 5 weekdays
  const found = new Set(chunks.map((c) => c.day))
  const missing = DAYS_OF_WEEK.filter((d) => !found.has(d))
  if (missing.length > 0) {
    throw new Error(
      `Не найдены дни в тексте: ${missing.join(', ')}`
    )
  }

  return chunks
}
