// Pas dit aan per hub-sheet
const DEZE_HUB = 'Diemen';

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
  form.bronHub = DEZE_HUB;
  return QuinyxBackend.shareDriver(form);
}

function getDoelHubs() {
  return QuinyxBackend.getDoelHubs();
}
