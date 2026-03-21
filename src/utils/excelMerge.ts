import * as XLSX from 'xlsx'
import JSZip from 'jszip'

import {
  DAY_SHEET_NAMES,
  DAYS_OF_WEEK,
  MEAL_CATEGORIES,
  MEAL_COLUMN_MAP,
  PREVIEW_CATEGORY_HEADERS,
  PREVIEW_COLUMN_MAP,
  TECH_SHEET_NAME,
} from '@/constants/menu'
import type { MealCategory, TranslatedMenu } from '@/types/menu'

/** Number of data rows reserved per day block */
const ROWS_PER_DAY = 10

/** Category headers for the template (F–L columns) */
const TEMPLATE_CATEGORY_HEADERS: Record<MealCategory, string> = {
  'Сок': 'Соки',
  'Завтрак': 'Завтрак',
  'Суп': 'Суп',
  'Горячее': 'Горячее',
  'Гарнир': 'Гарнир',
  'Салат': 'Салат',
  'Десерт': 'Десерт',
}

/**
 * Builds a standalone menu .xlsx from translated JSON.
 * Structure matches the example file: Tech sheet,
 * each day as a block with one row per dish.
 */
export function buildMenuWorkbook(
  menu: TranslatedMenu
): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  const sheet: XLSX.WorkSheet = {}
  let currentRow = 0

  for (let dayIdx = 0; dayIdx < DAYS_OF_WEEK.length; dayIdx++) {
    const day = DAYS_OF_WEEK[dayIdx]!
    const dayMenu = menu[day]

    // Day header row: day name in columns B–G (1–6)
    for (let col = 1; col <= 6; col++) {
      const addr = XLSX.utils.encode_cell({ r: currentRow, c: col })
      sheet[addr] = { t: 's', v: day }
    }
    currentRow++

    // Category header row: Соки only for Monday, Завтрак(B)..Десерт(G) always
    const startCol = dayIdx === 0 ? 0 : 1
    for (let col = startCol; col < PREVIEW_CATEGORY_HEADERS.length; col++) {
      const addr = XLSX.utils.encode_cell({ r: currentRow, c: col })
      sheet[addr] = { t: 's', v: PREVIEW_CATEGORY_HEADERS[col] }
    }
    currentRow++

    // Juices are the same for the whole week — only write for Monday
    const isMonday = dayIdx === 0
    const categories = isMonday
      ? MEAL_CATEGORIES
      : MEAL_CATEGORIES.filter((cat) => cat !== 'Сок')

    // Data rows: one row per dish index (up to ROWS_PER_DAY)
    for (let i = 0; i < ROWS_PER_DAY; i++) {
      for (const category of categories) {
        const dishes = dayMenu[category]
        if (i < dishes.length) {
          const col = PREVIEW_COLUMN_MAP[category]
          const addr = XLSX.utils.encode_cell({ r: currentRow, c: col })
          sheet[addr] = { t: 's', v: dishes[i] }
        }
      }
      currentRow++
    }

  }

  // Set sheet range
  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: currentRow - 1, c: 6 },
  })

  XLSX.utils.book_append_sheet(workbook, sheet, TECH_SHEET_NAME)

  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer
}

// --- ZIP/XML approach for mergeMenuIntoTemplate ---

/** Convert 0-based column index to Excel column letter (0→A, 5→F, 11→L) */
function colIndexToLetter(col: number): string {
  let letter = ''
  let n = col
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter
    n = Math.floor(n / 26) - 1
  }
  return letter
}

/** Build cell reference like "F1" from 0-based row and col */
function cellRef(row: number, col: number): string {
  return `${colIndexToLetter(col)}${row + 1}`
}

/** Escape XML special characters */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Parse shared strings from xl/sharedStrings.xml.
 * Returns array of string values indexed by position.
 */
function parseSharedStrings(xml: string): string[] {
  const strings: string[] = []
  const siRegex = /<si>([\s\S]*?)<\/si>/g
  let match: RegExpExecArray | null

  while ((match = siRegex.exec(xml)) !== null) {
    const siContent = match[1]!
    // Extract text from <t> tags (may have multiple <r><t> for rich text)
    const texts: string[] = []
    const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g
    let tMatch: RegExpExecArray | null
    while ((tMatch = tRegex.exec(siContent)) !== null) {
      texts.push(tMatch[1]!)
    }
    strings.push(texts.join(''))
  }

  return strings
}

/**
 * Rebuild xl/sharedStrings.xml with additional strings.
 * Returns the new XML content.
 */
function rebuildSharedStrings(
  originalXml: string,
  newStrings: string[]
): string {
  if (newStrings.length === 0) return originalXml

  // Build new <si> entries
  const newEntries = newStrings
    .map((s) => `<si><t xml:space="preserve">${escapeXml(s)}</t></si>`)
    .join('')

  // Update count and uniqueCount in <sst> tag
  const sstMatch = originalXml.match(
    /<sst[^>]*count="(\d+)"[^>]*uniqueCount="(\d+)"[^>]*>/
  )
  if (!sstMatch) {
    // No existing shared strings — create new file
    const total = newStrings.length
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
      `count="${total}" uniqueCount="${total}">${newEntries}</sst>`
  }

  const oldCount = parseInt(sstMatch[1]!, 10)
  const oldUnique = parseInt(sstMatch[2]!, 10)
  const newCount = oldCount + newStrings.length
  const newUnique = oldUnique + newStrings.length

  let result = originalXml
    .replace(
      /count="\d+"/,
      `count="${newCount}"`
    )
    .replace(
      /uniqueCount="\d+"/,
      `uniqueCount="${newUnique}"`
    )

  // Insert new entries before </sst>
  result = result.replace('</sst>', `${newEntries}</sst>`)

  return result
}

/**
 * Collect all unique strings that need to be added to shared strings.
 * Returns a map: string value → shared string index (starting after existing ones).
 */
function collectMenuStrings(
  menu: TranslatedMenu,
  existingStrings: string[]
): Map<string, number> {
  const existingSet = new Set(existingStrings)
  const newStrings = new Map<string, number>()
  let nextIndex = existingStrings.length

  function addString(value: string): void {
    if (existingSet.has(value)) return
    if (newStrings.has(value)) return
    newStrings.set(value, nextIndex++)
    existingSet.add(value)
  }

  // Day names and category headers
  for (const day of DAYS_OF_WEEK) {
    addString(day)
  }
  for (const header of Object.values(TEMPLATE_CATEGORY_HEADERS)) {
    addString(header)
  }

  // All dish strings
  for (const day of DAYS_OF_WEEK) {
    for (const category of MEAL_CATEGORIES) {
      for (const dish of menu[day][category]) {
        addString(dish)
      }
    }
  }

  return newStrings
}

/**
 * Get the shared string index for a value.
 * Looks up in both existing strings and new strings map.
 */
function getStringIndex(
  value: string,
  existingStrings: string[],
  newStringsMap: Map<string, number>
): number {
  const existingIdx = existingStrings.indexOf(value)
  if (existingIdx !== -1) return existingIdx
  const newIdx = newStringsMap.get(value)
  if (newIdx !== undefined) return newIdx
  throw new Error(`String not found in shared strings: "${value}"`)
}

interface CellToWrite {
  row: number
  col: number
  sharedStringIndex: number
}

/**
 * Build list of cells to write into the Tech sheet.
 */
function buildTechCells(
  menu: TranslatedMenu,
  existingStrings: string[],
  newStringsMap: Map<string, number>
): CellToWrite[] {
  const cells: CellToWrite[] = []
  let currentRow = 0

  function idx(value: string): number {
    return getStringIndex(value, existingStrings, newStringsMap)
  }

  for (let dayIdx = 0; dayIdx < DAYS_OF_WEEK.length; dayIdx++) {
    const day = DAYS_OF_WEEK[dayIdx]!
    const dayMenu = menu[day]

    // Day header row: day name in G–L (cols 6–11)
    for (
      let col = MEAL_COLUMN_MAP['Завтрак'];
      col <= MEAL_COLUMN_MAP['Десерт'];
      col++
    ) {
      cells.push({ row: currentRow, col, sharedStringIndex: idx(day) })
    }
    currentRow++

    // Category header row
    const isMonday = dayIdx === 0
    if (isMonday) {
      cells.push({
        row: currentRow,
        col: MEAL_COLUMN_MAP['Сок'],
        sharedStringIndex: idx(TEMPLATE_CATEGORY_HEADERS['Сок']),
      })
    }
    for (const category of MEAL_CATEGORIES) {
      if (category === 'Сок') continue
      cells.push({
        row: currentRow,
        col: MEAL_COLUMN_MAP[category],
        sharedStringIndex: idx(TEMPLATE_CATEGORY_HEADERS[category]),
      })
    }
    currentRow++

    // Data rows
    const categories = isMonday
      ? MEAL_CATEGORIES
      : MEAL_CATEGORIES.filter((cat) => cat !== 'Сок')

    for (let i = 0; i < ROWS_PER_DAY; i++) {
      for (const category of categories) {
        const dishes = dayMenu[category]
        if (i < dishes.length) {
          cells.push({
            row: currentRow,
            col: MEAL_COLUMN_MAP[category],
            sharedStringIndex: idx(dishes[i]!),
          })
        }
      }
      currentRow++
    }

  }

  return cells
}

/**
 * Parse column letter(s) from a cell reference like "F1" → 5 (0-based).
 */
function colLetterToIndex(letters: string): number {
  let index = 0
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64)
  }
  return index - 1
}

/**
 * Insert cells into a sheet XML string.
 * Groups cells by row, finds or creates <row> elements,
 * and merges <c> elements maintaining correct column order
 * (required by Google Sheets).
 */
function insertCellsIntoSheetXml(
  sheetXml: string,
  cells: CellToWrite[]
): string {
  // Group cells by row
  const cellsByRow = new Map<number, CellToWrite[]>()
  for (const cell of cells) {
    const existing = cellsByRow.get(cell.row)
    if (existing) {
      existing.push(cell)
    } else {
      cellsByRow.set(cell.row, [cell])
    }
  }

  // Parse existing rows from XML
  const sheetDataStart = sheetXml.indexOf('<sheetData>')
  const sheetDataEnd = sheetXml.indexOf('</sheetData>')

  if (sheetDataStart === -1 || sheetDataEnd === -1) {
    throw new Error('Invalid sheet XML: <sheetData> not found')
  }

  const beforeSheetData = sheetXml.substring(
    0, sheetDataStart + '<sheetData>'.length
  )
  const afterSheetData = sheetXml.substring(sheetDataEnd)
  const sheetDataContent = sheetXml.substring(
    sheetDataStart + '<sheetData>'.length,
    sheetDataEnd
  )

  // Parse rows: extract each <row ...>...</row> with its row number
  const rows = new Map<number, string>()
  const rowOrder: number[] = []
  const rowRegex = /<row\s+r="(\d+)"[^/>]*(?:\/>|>[\s\S]*?<\/row>)/g
  let rowMatch: RegExpExecArray | null

  while ((rowMatch = rowRegex.exec(sheetDataContent)) !== null) {
    const rowNum = parseInt(rowMatch[1]!, 10)
    rows.set(rowNum, rowMatch[0])
    rowOrder.push(rowNum)
  }

  // For each row that needs modification, update or create it
  for (const [rowIdx, rowCells] of cellsByRow) {
    const rowNum = rowIdx + 1 // 1-based
    const existingRow = rows.get(rowNum)

    // Build map of new cells: ref → xml
    const newCellMap = new Map<string, string>()
    for (const c of rowCells) {
      const ref = cellRef(c.row, c.col)
      newCellMap.set(
        ref,
        `<c r="${ref}" t="s"><v>${c.sharedStringIndex}</v></c>`
      )
    }

    if (existingRow) {
      // Extract row opening tag (preserving attributes)
      const rowOpenMatch = existingRow.match(
        /^<row\s+[^>]*?(?=>|\/\s*>)/
      )
      const rowOpenTag = rowOpenMatch
        ? `${rowOpenMatch[0]}>`
        : `<row r="${rowNum}">`

      // Parse existing cells, keeping those not being replaced
      const existingCells = new Map<string, string>()
      const cellRegex =
        /<c\s+r="([A-Z]+\d+)"[^/>]*(?:\/>|>[\s\S]*?<\/c>)/g
      let cellMatch: RegExpExecArray | null
      while (
        (cellMatch = cellRegex.exec(existingRow)) !== null
      ) {
        existingCells.set(cellMatch[1]!, cellMatch[0])
      }

      // Merge: new cells override existing ones
      for (const [ref, xml] of newCellMap) {
        existingCells.set(ref, xml)
      }

      // Sort all cells by column index
      const sortedEntries = [...existingCells.entries()]
        .sort((a, b) => {
          const colA = colLetterToIndex(
            a[0].replace(/\d+/g, '')
          )
          const colB = colLetterToIndex(
            b[0].replace(/\d+/g, '')
          )
          return colA - colB
        })
      const sortedCells = sortedEntries
        .map((entry) => entry[1])
        .join('')

      // Update spans to cover all columns in this row
      const colIndices = sortedEntries.map((e) =>
        colLetterToIndex(e[0].replace(/\d+/g, '')) + 1
      )
      const minCol = Math.min(...colIndices)
      const maxCol = Math.max(...colIndices)
      let updatedRowTag = rowOpenTag.replace(
        /\s+spans="[^"]*"/, ''
      )
      updatedRowTag = updatedRowTag.replace(
        />$/, ` spans="${minCol}:${maxCol}">`
      )

      rows.set(rowNum, `${updatedRowTag}${sortedCells}</row>`)
    } else {
      // Create new row with cells in column order
      const sortedNewEntries = [...newCellMap.entries()]
        .sort((a, b) => {
          const colA = colLetterToIndex(
            a[0].replace(/\d+/g, '')
          )
          const colB = colLetterToIndex(
            b[0].replace(/\d+/g, '')
          )
          return colA - colB
        })
      const sortedCells = sortedNewEntries
        .map((entry) => entry[1])
        .join('')
      const newColIndices = sortedNewEntries.map((e) =>
        colLetterToIndex(e[0].replace(/\d+/g, '')) + 1
      )
      const newMinCol = Math.min(...newColIndices)
      const newMaxCol = Math.max(...newColIndices)
      rows.set(
        rowNum,
        `<row r="${rowNum}" spans="${newMinCol}:${newMaxCol}">${sortedCells}</row>`
      )
      rowOrder.push(rowNum)
    }
  }

  // Sort rows by row number and rebuild sheetData
  rowOrder.sort((a, b) => a - b)
  const uniqueRows = [...new Set(rowOrder)]
  const newSheetData = uniqueRows
    .map((rowNum) => rows.get(rowNum)!)
    .join('')

  let result = `${beforeSheetData}${newSheetData}${afterSheetData}`

  // Update <dimension> to cover all rows and columns
  const allRowNums = uniqueRows
  if (allRowNums.length > 0) {
    const maxRowNum = Math.max(...allRowNums)
    // Find max column across all rows
    let globalMaxCol = 0
    for (const rowNum of allRowNums) {
      const rowXml = rows.get(rowNum)!
      const cellRefs =
        [...rowXml.matchAll(/<c\s+r="([A-Z]+)\d+"/g)]
      for (const m of cellRefs) {
        const colIdx = colLetterToIndex(m[1]!)
        if (colIdx > globalMaxCol) globalMaxCol = colIdx
      }
    }
    const maxColLetter = colIndexToLetter(globalMaxCol)
    result = result.replace(
      /<dimension\s+ref="[^"]*"\s*\/>/,
      `<dimension ref="A1:${maxColLetter}${maxRowNum}"/>`
    )
  }

  return result
}

/**
 * Clear cell values in range C5:O60 from a sheet XML,
 * preserving cells that contain formulas.
 */
function clearCellsInRange(
  sheetXml: string,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): string {
  // Build set of cell refs to clear
  const refsToClear = new Set<string>()
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      refsToClear.add(cellRef(row, col))
    }
  }

  // Clear values but preserve cell style (borders, fills, fonts)
  return sheetXml.replace(
    /<c\s+r="([A-Z]+\d+)"([^/>]*)(?:\/>|>([\s\S]*?)<\/c>)/g,
    (fullMatch, ref: string, attrs: string, innerContent?: string) => {
      if (!refsToClear.has(ref)) return fullMatch
      // Preserve cells with formulas
      if (innerContent && innerContent.includes('<f')) return fullMatch
      // Keep cell with its style attribute, just remove value
      const styleMatch = attrs.match(/\s+s="(\d+)"/)
      if (styleMatch) {
        return `<c r="${ref}" s="${styleMatch[1]}"/>`
      }
      return ''
    }
  )
}

/**
 * Register sharedStrings.xml in rels and [Content_Types].xml
 * when it doesn't exist in the original template.
 */
async function registerSharedStrings(
  zip: JSZip,
  relsXml: string
): Promise<void> {
  // Find next available rId
  const rIdMatches = [...relsXml.matchAll(/Id="rId(\d+)"/g)]
  const maxId = rIdMatches.reduce(
    (max, m) => Math.max(max, parseInt(m[1]!, 10)), 0
  )
  const newRId = `rId${maxId + 1}`

  // Add relationship
  const newRel =
    `<Relationship Id="${newRId}" ` +
    `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" ` +
    `Target="sharedStrings.xml"/>`
  const updatedRels = relsXml.replace(
    '</Relationships>',
    `${newRel}\n</Relationships>`
  )
  zip.file('xl/_rels/workbook.xml.rels', updatedRels)

  // Add content type
  const ctFile = zip.file('[Content_Types].xml')
  if (ctFile) {
    const ct = await ctFile.async('string')
    if (!ct.includes('sharedStrings')) {
      const newOverride =
        `<Override PartName="/xl/sharedStrings.xml" ` +
        `ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>`
      const updated = ct.replace('</Types>', `${newOverride}\n</Types>`)
      zip.file('[Content_Types].xml', updated)
    }
  }
}

/**
 * Resolve sheet XML filename from workbook.xml and rels.
 */
function resolveSheetFile(
  workbookXml: string,
  relsXml: string,
  sheetName: string
): string | null {
  // Find rId for the sheet name
  const escapedName = escapeXml(sheetName)
  const sheetMatch = workbookXml.match(
    new RegExp(`<sheet[^>]*name="${escapedName}"[^>]*r:id="(rId\\d+)"`)
  )
  if (!sheetMatch) return null

  const rId = sheetMatch[1]!

  // Find Target for this rId
  const relMatch = relsXml.match(
    new RegExp(`<Relationship[^>]*Id="${rId}"[^>]*Target="([^"]+)"`)
  )
  if (!relMatch) return null

  return `xl/${relMatch[1]!}`
}

/**
 * Merges translated menu into an xlsx template buffer.
 * Uses ZIP/XML manipulation to preserve data validation,
 * formulas, styles, and all other Excel features.
 */
export async function mergeMenuIntoTemplate(
  templateBuffer: ArrayBuffer,
  menu: TranslatedMenu
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(templateBuffer)

  // Read workbook structure
  const workbookXml = await zip.file('xl/workbook.xml')!.async('string')
  const relsXml = await zip.file('xl/_rels/workbook.xml.rels')!.async('string')

  // Find Tech sheet file
  const techSheetFile = resolveSheetFile(
    workbookXml, relsXml, TECH_SHEET_NAME
  )
  if (!techSheetFile) {
    throw new Error(
      `Лист "${TECH_SHEET_NAME}" не найден в загруженном файле`
    )
  }

  // Read and parse shared strings
  const sharedStringsFile = zip.file('xl/sharedStrings.xml')
  const sharedStringsXml = sharedStringsFile
    ? await sharedStringsFile.async('string')
    : ''
  const existingStrings = sharedStringsFile
    ? parseSharedStrings(sharedStringsXml)
    : []

  // Collect new strings needed for menu data
  const newStringsMap = collectMenuStrings(menu, existingStrings)
  const newStringValues = [...newStringsMap.entries()]
    .sort((a, b) => a[1] - b[1])
    .map((entry) => entry[0])

  // Update shared strings XML
  const updatedSharedStrings = rebuildSharedStrings(
    sharedStringsXml, newStringValues
  )
  zip.file('xl/sharedStrings.xml', updatedSharedStrings)

  // If sharedStrings.xml didn't exist, register it in rels and content types
  if (!sharedStringsFile) {
    await registerSharedStrings(zip, relsXml)
  }

  // Build cells for Tech sheet and insert into XML
  const techCells = buildTechCells(menu, existingStrings, newStringsMap)
  let techSheetXml = await zip.file(techSheetFile)!.async('string')
  techSheetXml = insertCellsIntoSheetXml(techSheetXml, techCells)
  zip.file(techSheetFile, techSheetXml)

  // Clear C5:O60 on day sheets (preserve formulas and data validation)
  for (const daySheetName of DAY_SHEET_NAMES) {
    const daySheetFile = resolveSheetFile(
      workbookXml, relsXml, daySheetName
    )
    if (!daySheetFile) continue

    const zipEntry = zip.file(daySheetFile)
    if (!zipEntry) continue

    let daySheetXml = await zipEntry.async('string')
    daySheetXml = clearCellsInRange(
      daySheetXml,
      4, 59,  // rows 5–60 (0-indexed: 4–59)
      2, 14   // columns C–O (0-indexed: 2–14)
    )
    zip.file(daySheetFile, daySheetXml)
  }

  // Generate output
  const output = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
  })

  return output
}
