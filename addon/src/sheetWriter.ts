function writeMenuToSheet(menu: TranslatedMenu): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const tech = ss.getSheetByName(TECH_SHEET_NAME)

  if (!tech) throw new Error(`Лист "${TECH_SHEET_NAME}" не найден в таблице`)

  const values = tech.getDataRange().getValues() as string[][]

  // Find header row index for each day (0-based)
  const dayHeaderRows: Partial<Record<DayOfWeek, number>> = {}
  for (let i = 0; i < values.length; i++) {
    const rowText = values[i].join(' ')
    for (const day of DAYS_OF_WEEK) {
      if (rowText.includes(day)) {
        dayHeaderRows[day] = i
        break
      }
    }
  }

  for (const day of DAYS_OF_WEEK) {
    const headerRowIndex = dayHeaderRows[day]
    if (headerRowIndex === undefined) continue

    // Find the end of this day's block (start of next day header or end of data)
    const nextHeaderIndex = values.findIndex((_, i) => {
      if (i <= headerRowIndex) return false
      return DAYS_OF_WEEK.some(d => d !== day && values[i].join(' ').includes(d))
    })
    const blockEnd = nextHeaderIndex === -1 ? values.length : nextHeaderIndex

    // Write the same dish values to all employee rows in the block
    for (let rowIndex = headerRowIndex + 1; rowIndex < blockEnd; rowIndex++) {
      for (const category of MEAL_CATEGORIES) {
        const col = MEAL_COLUMN_MAP[category]
        const dishes = menu[day][category]
        if (dishes.length > 0) {
          // rowIndex is 0-based; getRange uses 1-based
          tech.getRange(rowIndex + 1, col).setValue(dishes.join(', '))
        }
      }
    }
  }
}
