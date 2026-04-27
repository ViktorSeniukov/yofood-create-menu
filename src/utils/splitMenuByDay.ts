import { DAYS_OF_WEEK } from '@/constants/menu'
import type { DayOfWeek } from '@/types/menu'

/**
 * Serbian day name patterns with capture groups.
 * Sat/Sun (day: null) are used only as section boundaries — their content is discarded.
 *
 * Patterns intentionally omit anchors so they match anywhere in the text,
 * handling both well-formatted files (newlines before day names) and
 * broken ones where the entire menu is on a single line.
 */
const SERBIAN_DAYS: { day: DayOfWeek | null; pattern: RegExp }[] = [
  { day: 'Понедельник', pattern: /\bponedeljak\b/i },
  { day: 'Вторник',     pattern: /\butorak\b/i },
  { day: 'Среда',       pattern: /\bsred[au]\b/i },
  { day: 'Четверг',     pattern: /([čcČC\u010c\u010d])etvrtak\b/i },
  { day: 'Пятница',     pattern: /\bpetak\b/i },
  { day: null,          pattern: /\bsubota\b/i },
  { day: null,          pattern: /\bnedelja\b/i },
]

interface DayChunk {
  day: DayOfWeek
  text: string
}

interface DayMarker {
  day: DayOfWeek | null
  index: number
}

/**
 * Split raw Serbian menu text into per-day chunks (Mon–Fri).
 * Saturday and Sunday sections are discarded.
 *
 * Works with both properly formatted text (newlines between sections)
 * and single-line text (all content concatenated without line breaks).
 */
export function splitMenuByDay(text: string): DayChunk[] {
  // Find positions of each day name in the full text
  const markers: DayMarker[] = []

  for (const { day, pattern } of SERBIAN_DAYS) {
    // Reset lastIndex in case pattern has global flag
    const re = new RegExp(pattern.source, 'i')
    // A day may theoretically appear more than once — take only the first occurrence
    const match = re.exec(text)
    if (match) {
      markers.push({ day, index: match.index })
    }
  }

  // Sort by position in text
  markers.sort((a, b) => a.index - b.index)

  // Extract text slices for each day
  const chunks: DayChunk[] = []

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i]
    if (!marker || marker.day === null) continue

    const start = marker.index
    const end = markers[i + 1]?.index ?? text.length

    const dayText = text.slice(start, end).trim()
    if (dayText) {
      chunks.push({ day: marker.day, text: dayText })
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
