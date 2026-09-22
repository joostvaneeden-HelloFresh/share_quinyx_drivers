function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚗 Chauffeur Delen')
    .addItem('Deel chauffeur...', 'openShareDialog')
    .addSeparator()
    .addItem('Stel API key in', 'promptApiKey')
    .addToUi();
}

function openShareDialog() {
  const html = HtmlService.createHtmlOutputFromFile('ShareDialog')
    .setWidth(440)
    .setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(html, '🚗 Chauffeur tijdelijk delen');
}

function promptApiKey() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('Quinyx API key', 'Voer de API key in:', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;
  const key = result.getResponseText().trim();
  if (!key) { ui.alert('Niets ingevoerd.'); return; }
  PropertiesService.getScriptProperties().setProperty('QUINYX_API_KEY', key);
  ui.alert('✅ API key opgeslagen.');
}

// Aangeroepen vanuit de dialoog
function getDoelHubs() {
  return Object.keys(HUBS);
}

function shareDriver(form) {
  try {
    const badgeNo   = String(form.badgeNo || '').trim().toUpperCase();
    const doelHub   = form.doelHub;
    const startDate = form.startDate;
    const endDate   = form.endDate;

    if (!badgeNo)   return { success: false, message: 'Voer een personeelsnummer in.' };
    if (!doelHub)   return { success: false, message: 'Selecteer een doelhub.' };
    if (!startDate) return { success: false, message: 'Selecteer een startdatum.' };
    if (!endDate)   return { success: false, message: 'Selecteer een einddatum.' };
    if (endDate < startDate) return { success: false, message: 'Einddatum moet na startdatum liggen.' };

    const sectie = getSectieInfo(badgeNo, doelHub);
    if (!sectie) {
      return { success: false, message: 'Personeelsnummer ' + badgeNo + ' wordt niet herkend. Begint het met YCDIE of TIDIE?' };
    }

    const hub = HUBS[doelHub];
    const result = quinyxMoveEmployee({
      apiKey:      getApiKey(),
      badgeNo:     badgeNo,
      unitExtCode: hub.unitExtCode,
      sectionCode: sectie.sectionCode,
      startDate:   startDate,
      endDate:     endDate,
    });

    logActie(badgeNo, sectie.agency, doelHub, startDate, endDate, result.success, result.message);

    return result;

  } catch (e) {
    Logger.log('[shareDriver] ' + e.toString());
    return { success: false, message: e.message };
  }
}

function logActie(badgeNo, agency, doelHub, startDate, endDate, success, message) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let log  = ss.getSheetByName('Log');
    if (!log) {
      log = ss.insertSheet('Log');
      log.appendRow(['Tijdstip', 'Personeelsnummer', 'Uitzendpartij', 'Naar hub', 'Van', 'Tot', 'Status', 'Melding']);
      log.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#c9303a').setFontColor('#fff');
      log.setFrozenRows(1);
    }
    log.appendRow([new Date(), badgeNo, agency, doelHub, startDate, endDate, success ? 'OK' : 'FOUT', message]);
  } catch (e) {
    Logger.log('[log] ' + e.toString());
  }
}
