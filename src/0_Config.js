/**
 * Centrale configuratie voor het Quinyx chauffeur-deel systeem.
 *
 * Runtime-configuratie (hubs, secties, emails) staat in de "Config" tab
 * van het spreadsheet, zodat beheerders het kunnen aanpassen zonder code.
 * De Quinyx API key(s) staan in Script Properties (niet zichtbaar in het sheet).
 */

const CONFIG = {
  // Quinyx SOAP API endpoint
  // Verifieer dit adres met je Quinyx accountmanager of de WSDL op:
  // https://developer.quinyx.com/api/v1/operations/wsdlMoveEmployees
  API_URL: 'https://app.quinyx.com/web-api/ws/v2/',

  SHEETS: {
    CONFIG: 'Config',
    LOG: 'Log',
  },

  // Kolomposities in de Config tab (1-based)
  CONFIG_COLS: {
    HUB_NAME: 1,          // Naam van de hub (bijv. "Hub Amsterdam")
    UNIT_ID: 2,           // Quinyx Unit ID van de hub
    SECTION_ID: 3,        // Quinyx Sectie ID voor gedeelde chauffeurs in deze hub
    MANAGER_EMAILS: 4,    // Komma-gescheiden lijst van manager emails
  },

  // Kolomposities in de Log tab (1-based)
  LOG_COLS: {
    TIMESTAMP: 1,
    ACTOR_EMAIL: 2,
    ACTION: 3,
    BADGE_NO: 4,
    FROM_HUB: 5,
    TO_HUB: 6,
    START_DATE: 7,
    END_DATE: 8,
    STATUS: 9,
    NOTES: 10,
  },
};

/**
 * Leest alle hubconfiguraties uit de Config tab.
 * @returns {Array<{name:string, unitId:string, sectionId:string, managerEmails:string[]}>}
 */
function getHubConfigs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CONFIG);

  if (!sheet) {
    throw new Error('Config tab niet gevonden. Voer eerst "Setup → Initialiseer bladen" uit.');
  }

  const data = sheet.getDataRange().getValues();
  const hubs = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = String(row[CONFIG.CONFIG_COLS.HUB_NAME - 1] || '').trim();
    if (!name) continue;

    hubs.push({
      name: name,
      unitId: String(row[CONFIG.CONFIG_COLS.UNIT_ID - 1] || '').trim(),
      sectionId: String(row[CONFIG.CONFIG_COLS.SECTION_ID - 1] || '').trim(),
      managerEmails: String(row[CONFIG.CONFIG_COLS.MANAGER_EMAILS - 1] || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean),
    });
  }

  if (hubs.length === 0) {
    throw new Error('Geen hubs gevonden in Config tab. Vul de configuratie in.');
  }

  return hubs;
}

/**
 * Zoekt de hub van de ingelogde gebruiker op basis van hun Google-email.
 * Gooit een fout als de gebruiker geen geconfigureerde hubmanager is.
 *
 * @returns {{name:string, unitId:string, sectionId:string, managerEmails:string[]}}
 */
function getManagerHub() {
  const email = Session.getActiveUser().getEmail().toLowerCase();
  const hubs = getHubConfigs();
  const hub = hubs.find(h => h.managerEmails.includes(email));

  if (!hub) {
    throw new Error(
      'Je email (' + email + ') is niet geconfigureerd als hubmanager. ' +
      'Neem contact op met de beheerder.'
    );
  }

  return hub;
}

/**
 * Haalt de Quinyx API key op uit Script Properties.
 * De key wordt opgeslagen als QUINYX_API_KEY via "Setup → Stel API key in".
 *
 * Als je per unit een aparte API key hebt, sla dan op als
 * QUINYX_API_KEY_[UNIT_ID] en gebruik getApiKeyForUnit(unitId).
 *
 * @returns {string}
 */
function getApiKey() {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty('QUINYX_API_KEY');

  if (!key) {
    throw new Error(
      'Quinyx API key niet ingesteld. ' +
      'Voer "Setup → Stel API key in" uit als beheerder.'
    );
  }

  return key;
}

/**
 * Haalt de API key op voor een specifieke unit.
 * Valt terug op de globale QUINYX_API_KEY als er geen unit-specifieke key is.
 *
 * @param {string} unitId
 * @returns {string}
 */
function getApiKeyForUnit(unitId) {
  const props = PropertiesService.getScriptProperties();
  const unitKey = props.getProperty('QUINYX_API_KEY_' + unitId);
  if (unitKey) return unitKey;

  return getApiKey();
}
