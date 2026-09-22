/**
 * Configuratie voor het Quinyx chauffeur-deel systeem.
 *
 * Vul de Config tab in het sheet in met jouw hubgegevens.
 * De API key sla je op via Setup → Stel API key in.
 */

const CONFIG = {
  API_URL: 'https://api.quinyx.com/FlexForceWebServices.php',

  SHEETS: {
    CONFIG: 'Config',
    LOG:    'Log',
  },

  // Kolomposities in de Config tab (1-based)
  // Hub Naam | Unit Ext Code | Uitzendpartij | Sectie Code | Manager Emails
  CONFIG_COLS: {
    HUB_NAME:       1,
    UNIT_EXT_CODE:  2,
    AGENCY:         3,
    SECTION_CODE:   4,
    MANAGER_EMAILS: 5,
  },
};

/**
 * Leest alle rijen uit de Config tab.
 * @returns {Array<{hubName, unitExtCode, agency, sectionCode, managerEmails[]}>}
 */
function getAllConfigRows() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CONFIG);
  if (!sheet) throw new Error('Config tab niet gevonden. Voer eerst "Setup → Initialiseer bladen" uit.');

  const data = sheet.getDataRange().getValues();
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const hubName = String(r[CONFIG.CONFIG_COLS.HUB_NAME - 1] || '').trim();
    if (!hubName) continue;

    rows.push({
      hubName:       hubName,
      unitExtCode:   String(r[CONFIG.CONFIG_COLS.UNIT_EXT_CODE - 1] || '').trim(),
      agency:        String(r[CONFIG.CONFIG_COLS.AGENCY - 1]        || '').trim(),
      sectionCode:   String(r[CONFIG.CONFIG_COLS.SECTION_CODE - 1]  || '').trim(),
      managerEmails: String(r[CONFIG.CONFIG_COLS.MANAGER_EMAILS - 1] || '')
        .split(',').map(e => e.trim().toLowerCase()).filter(Boolean),
    });
  }

  return rows;
}

/**
 * Zoekt de hub van de ingelogde manager op basis van hun email.
 * @returns {string} Hub naam
 */
function getManagerHubName() {
  const email = Session.getActiveUser().getEmail().toLowerCase();
  const rows  = getAllConfigRows();
  const row   = rows.find(r => r.managerEmails.includes(email));
  return row ? row.hubName : null;
}

/**
 * Geeft unieke uitzendpartijen terug voor een bepaalde hub.
 * @param {string} hubName
 * @returns {string[]}
 */
function getAgenciesForHub(hubName) {
  const rows    = getAllConfigRows();
  const agencies = [...new Set(
    rows.filter(r => r.hubName === hubName).map(r => r.agency)
  )];
  return agencies;
}

/**
 * Geeft de andere hubs terug (voor de doelhub dropdown).
 * @param {string} myHubName
 * @returns {string[]}
 */
function getOtherHubNames(myHubName) {
  const rows = getAllConfigRows();
  return [...new Set(rows.map(r => r.hubName))].filter(h => h !== myHubName);
}

/**
 * Zoekt een sectie op basis van hub + uitzendpartij.
 * @param {string} hubName
 * @param {string} agency
 * @returns {{unitExtCode, sectionCode}|null}
 */
function getSectionForHubAndAgency(hubName, agency) {
  const row = getAllConfigRows().find(r => r.hubName === hubName && r.agency === agency);
  return row ? { unitExtCode: row.unitExtCode, sectionCode: row.sectionCode } : null;
}

/**
 * Haalt de Quinyx API key op uit Script Properties.
 * @returns {string}
 */
function getApiKey() {
  const key = PropertiesService.getScriptProperties().getProperty('QUINYX_API_KEY');
  if (!key) throw new Error('API key niet ingesteld. Voer "Setup → Stel API key in" uit.');
  return key;
}
