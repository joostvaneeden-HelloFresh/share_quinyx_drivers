function logShareAction(entry) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(CONFIG.SHEETS.LOG);
    if (!logSheet) logSheet = createLogSheet(ss);

    logSheet.appendRow([
      new Date(),
      entry.actorEmail || '',
      entry.action     || '',
      entry.badgeNo    || '',
      entry.agency     || '',
      entry.fromHub    || '',
      entry.toHub      || '',
      entry.startDate  || '',
      entry.endDate    || '',
      entry.status     || '',
      entry.notes      || '',
    ]);
  } catch (e) {
    Logger.log('[Audit] ' + e.toString());
  }
}

function createLogSheet(ss) {
  const sheet = ss.insertSheet(CONFIG.SHEETS.LOG);
  sheet.appendRow(['Tijdstip', 'Gebruiker', 'Actie', 'Personeelsnummer', 'Uitzendpartij', 'Van hub', 'Naar hub', 'Startdatum', 'Einddatum', 'Status', 'Notities']);

  const h = sheet.getRange(1, 1, 1, 11);
  h.setFontWeight('bold');
  h.setBackground('#c9303a');
  h.setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  const widths = [160, 220, 80, 150, 150, 120, 120, 100, 100, 90, 250];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  sheet.protect().setDescription('Auditlog — alleen beheerders');
  return sheet;
}
