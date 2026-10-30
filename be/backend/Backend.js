// Publieke functies — worden aangeroepen vanuit de sheet via de Library

function shareDriver(form) {
  try {
    const badgeNo   = String(form.badgeNo || '').trim().toUpperCase();
    const doelHub   = form.doelHub;
    const startDate = form.startDate;
    const endDate   = form.endDate;

    if (!badgeNo)   return { success: false, message: 'Enter a badge number.' };
    if (!doelHub)   return { success: false, message: 'Select a target hub.' };
    if (!startDate) return { success: false, message: 'Select a start date.' };
    if (!endDate)   return { success: false, message: 'Select an end date.' };
    if (endDate < startDate) return { success: false, message: 'The end date must not be before the start date.' };

    const sectie = getSectieInfo(badgeNo, doelHub);
    if (!sectie) {
      return { success: false, message: 'Badge number ' + badgeNo + ' is not recognised. Check the prefix (e.g. TTGEN, ADANT).' };
    }
    if (!sectie.sectionCode) {
      return { success: false, message: sectie.agency + ' has no section in ' + doelHub + '.' };
    }

    // De API key bepaalt de thuisunit in Quinyx: een key van een andere unit verplaatst de medewerker.
    // Daarom eerst de echte thuishub opzoeken en alleen met de key van die hub delen.
    const thuis = quinyxFindHomeHub(badgeNo, sectie.homeHub);
    if (thuis.error) {
      return { success: false, message: thuis.error };
    }
    if (thuis.hub === doelHub) {
      return { success: false, message: 'You cannot share a driver with their own home hub (' + doelHub + ').' };
    }

    const result = quinyxShareEmployee({
      apiKey:            getApiKeyVoor(thuis.hub),
      badgeNo:           badgeNo,
      targetSectionCode: sectie.sectionCode,
      roleId:            ROLE_ID_EMPLOYEE,
      startDate:         startDate,
      endDate:           endDate,
    });

    const logFout = logActie(form.sheetId, badgeNo, sectie.agency, doelHub, startDate, endDate, result.success, result.message);
    if (logFout) result.message += ' (Note: writing to the log failed: ' + logFout + ')';

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
      log.appendRow(['Time', 'Badge number', 'Agency', 'To hub', 'From', 'Until', 'Status', 'Message']);
      log.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#c9303a').setFontColor('#fff');
      log.setFrozenRows(1);
    }
    log.appendRow([new Date(), badgeNo, agency, doelHub, startDate, endDate, success ? 'OK' : 'ERROR', message]);
    return null;
  } catch (e) {
    Logger.log('[log] ' + e.toString());
    return e.message;
  }
}
