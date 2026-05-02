function onOpen(_e: GoogleAppsScript.Events.SheetsOnOpen): void {
  SpreadsheetApp.getUi()
    .createAddonMenu()
    .addItem('Открыть', 'showSidebar')
    .addToUi()
}

function onInstall(e: GoogleAppsScript.Events.AddonOnInstall): void {
  onOpen(e as unknown as GoogleAppsScript.Events.SheetsOnOpen)
}

function showSidebar(): void {
  const html = HtmlService.createHtmlOutputFromFile('sidebar').setTitle('Генератор меню')
  SpreadsheetApp.getUi().showSidebar(html)
}

// Called from sidebar: translate menu and write to Tech sheet
function translateAndFill(base64Data: string, mimeType: string): void {
  const menu = translateMenu(base64Data, mimeType)
  writeMenuToSheet(menu)
}
