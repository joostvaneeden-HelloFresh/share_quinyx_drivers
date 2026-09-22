/**
 * Auditlogging voor GDPR-compliance.
 *
 * Elke deel-actie (geslaagd of gefaald) wordt vastgelegd in de Log tab.
 * Het log is beschermd zodat managers het niet kunnen aanpassen.
 * Bewaar het log minimaal 2 jaar (conform AVG-aanbevelingen).
 */

/**
 * Schrijft een actie naar het auditlog.
 *
 * @param {{
 *   actorEmail: string,
 *   action:     string,
 *   badgeNo:    string,
 *   fromHub:    string,
 *   toHub:      string,
 *   startDate:  string,
 *   endDate:    string,
 *   status:     string,
 *   notes:      string
 * }} entry
 */
function logShareAction(entry) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(CONFIG.SHEETS.LOG);

    if (!logSheet) {
      logSheet = createLogSheet(ss);
    }

    logSheet.appendRow([
      new Date(),
      entry.actorEmail || '',
      entry.action || '',
      entry.badgeNo || '',
      entry.fromHub || '',
      entry.toHub || '',
      entry.startDate || '',
      entry.endDate || '',
      entry.status || '',
      entry.notes || '',
    ]);

  } catch (e) {
    // Logfouten mogen de hoofdflow nooit onderbreken
    Logger.log('[Audit] Logfout: ' + e.toString());
  }
}

/**
 * Maakt de Log tab aan met kopteksten en beveiliging.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function createLogSheet(ss) {
  const logSheet = ss.insertSheet(CONFIG.SHEETS.LOG);

  logSheet.appendRow([
    'Tijdstip',
    'Gebruiker',
    'Actie',
    'Personeelsnummer',
    'Van hub',
    'Naar hub',
    'Startdatum',
    'Einddatum',
    'Status',
    'Notities',
  ]);

  // Opmaak koptekstrij
  const header = logSheet.getRange(1, 1, 1, 10);
  header.setFontWeight('bold');
  header.setBackground('#c9303a'); // HelloFresh rood
  header.setFontColor('#ffffff');
  logSheet.setFrozenRows(1);

  // Kolombreedtes
  logSheet.setColumnWidth(1, 160); // Tijdstip
  logSheet.setColumnWidth(2, 220); // Gebruiker
  logSheet.setColumnWidth(3, 90);  // Actie
  logSheet.setColumnWidth(4, 140); // Personeelsnummer
  logSheet.setColumnWidth(5, 130); // Van hub
  logSheet.setColumnWidth(6, 130); // Naar hub
  logSheet.setColumnWidth(7, 100); // Startdatum
  logSheet.setColumnWidth(8, 100); // Einddatum
  logSheet.setColumnWidth(9, 90);  // Status
  logSheet.setColumnWidth(10, 250); // Notities

  // Beveilig de Log tab — alleen editors (admins) kunnen het aanpassen
  const protection = logSheet.protect();
  protection.setDescription('Auditlog — alleen beheerders');

  // Verwijder alle editors behalve de eigenaar
  // Managers kunnen het log alleen lezen, niet aanpassen
  try {
    const me = Session.getEffectiveUser();
    protection.addEditor(me);
    protection.removeEditors(
      protection.getEditors().filter(e => e.getEmail() !== me.getEmail())
    );
  } catch (_) {
    // Kan mislukken in sandbox; geen probleem
  }

  return logSheet;
}
