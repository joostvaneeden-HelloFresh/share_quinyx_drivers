function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚗 Chauffeur Delen')
    .addItem('Deel chauffeur...', 'openShareDialog')
    .addToUi();
}

function openShareDialog() {
  const html = HtmlService.createHtmlOutputFromFile('ShareDialog')
    .setWidth(440)
    .setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(html, '🚗 Chauffeur tijdelijk delen');
}

function shareDriver(form) {
  form.sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
  return QuinyxBackend.shareDriver(form);
}

function getDoelHubs() {
  return QuinyxBackend.getDoelHubs();
}
