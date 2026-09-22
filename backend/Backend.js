// Publieke functies — worden aangeroepen vanuit de sheet via de Library

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

    const result = quinyxShareEmployee({
      apiKey:            getApiKeyVoor(sectie.homeHub),
      badgeNo:           badgeNo,
      targetSectionCode: sectie.sectionCode,
      startDate:         startDate,
      endDate:           endDate,
    });

    logActie(form.sheetId, badgeNo, sectie.agency, doelHub, startDate, endDate, result.success, result.message);

    return result;

  } catch (e) {
    Logger.log('[shareDriver] ' + e.toString());
    return { success: false, message: e.message };
  }
}

function getDoelHubs() {
  return Object.keys(HUBS).sort();
}

function logActie(sheetId, badgeNo, agency, doelHub, startDate, endDate, success, message) {
  try {
    const ss  = SpreadsheetApp.openById(sheetId);
    let   log = ss.getSheetByName('Log');
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
