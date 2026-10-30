function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚗 Share Driver')
    .addItem('Share driver...', 'openShareDialog')
    .addToUi();
}

function openShareDialog() {
  const html = HtmlService.createHtmlOutputFromFile('ShareDialog')
    .setWidth(440)
    .setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(html, '🚗 Share a driver temporarily');
}

function shareDriver(form) {
  form.sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
  return QuinyxBackend.shareDriver(form);
}

function getDoelHubs() {
  return QuinyxBackend.getDoelHubs();
}
