const SHEETS_URL_REGEX =
  /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/

export function extractGoogleSheetId(url: string): string | null {
  const match = url.match(SHEETS_URL_REGEX)
  return match?.[1] ?? null
}

export function isValidGoogleSheetUrl(url: string): boolean {
  return SHEETS_URL_REGEX.test(url)
}

export function getExportSpreadsheetLink(sheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`
}
