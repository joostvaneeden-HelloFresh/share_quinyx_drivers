/**
 * Startpunten en UI-setup voor het Quinyx Chauffeur Deel systeem.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚗 Chauffeur Delen')
    .addItem('Deel chauffeur met andere hub...', 'openShareDialog')
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('⚙️ Setup (alleen beheerders)')
        .addItem('Initialiseer bladen', 'initializeSheets')
        .addItem('Stel globale API key in', 'promptGlobalApiKey')
        .addItem('Stel API key in per unit', 'promptUnitApiKey')
    )
    .addToUi();
}

/**
 * Opent de dialoog voor het delen van een chauffeur.
 */
function openShareDialog() {
  const html = HtmlService.createHtmlOutputFromFile('ShareDialog')
    .setWidth(500)
    .setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(html, '🚗 Chauffeur tijdelijk delen');
}

// ── Setup functies ──────────────────────────────────────────────────────────

/**
 * Initialiseer het spreadsheet met de benodigde tabbladen.
 * Eenmalig uitvoeren bij de eerste setup.
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const created = [];

  // Config tab aanmaken
  if (!ss.getSheetByName(CONFIG.SHEETS.CONFIG)) {
    const configSheet = ss.insertSheet(CONFIG.SHEETS.CONFIG);

    configSheet.appendRow([
      'Hub Naam',
      'Unit ID (Quinyx)',
      'Sectie ID voor gedeelde chauffeurs (Quinyx)',
      'Manager emails (komma-gescheiden)',
    ]);
    configSheet.appendRow(['Hub Amsterdam', '1001', '5001', 'manager.ams@jouwbedrijf.nl']);
    configSheet.appendRow(['Hub Rotterdam', '1002', '5002', 'manager.rtd@jouwbedrijf.nl']);
    configSheet.appendRow(['Hub Utrecht',   '1003', '5003', 'manager.utr@jouwbedrijf.nl']);

    const header = configSheet.getRange(1, 1, 1, 4);
    header.setFontWeight('bold');
    header.setBackground('#34a853');
    header.setFontColor('#ffffff');
    configSheet.setFrozenRows(1);
    configSheet.setColumnWidth(1, 160);
    configSheet.setColumnWidth(2, 140);
    configSheet.setColumnWidth(3, 260);
    configSheet.setColumnWidth(4, 320);

    // Beveilig de Config tab
    const prot = configSheet.protect();
    prot.setDescription('Hubconfiguratie — alleen beheerders');

    created.push('Config');
  }

  // Log tab aanmaken
  if (!ss.getSheetByName(CONFIG.SHEETS.LOG)) {
    createLogSheet(ss);
    created.push('Log');
  }

  if (created.length > 0) {
    ui.alert(
      'Setup klaar',
      'Aangemaakt: ' + created.join(', ') + '.\n\n' +
      'Volgende stappen:\n' +
      '1. Vul de Config tab in met echte hubgegevens (Unit IDs en Sectie IDs uit Quinyx).\n' +
      '2. Stel de API key in via Setup → Stel globale API key in.\n' +
      '3. Voeg de manager-emails toe aan de Config tab.',
      ui.ButtonSet.OK
    );
  } else {
    ui.alert('De bladen bestaan al. Geen wijzigingen aangebracht.');
  }
}

/**
 * Sla een globale Quinyx API key op in Script Properties.
 * De key is niet zichtbaar in het spreadsheet (GDPR-veilig).
 */
function promptGlobalApiKey() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'Quinyx API key instellen',
    'Voer de Quinyx API key in.\n' +
    'Deze wordt veilig opgeslagen in Script Properties en is niet zichtbaar in het sheet.\n\n' +
    'API key:',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() !== ui.Button.OK) return;

  const key = result.getResponseText().trim();
  if (!key) { ui.alert('Geen key ingevoerd. Annuleer.'); return; }

  PropertiesService.getScriptProperties().setProperty('QUINYX_API_KEY', key);
  ui.alert('✅ API key opgeslagen.');
}

/**
 * Sla een unit-specifieke Quinyx API key op.
 * Gebruik dit als elke hub een aparte API key heeft.
 */
function promptUnitApiKey() {
  const ui = SpreadsheetApp.getUi();

  const unitResult = ui.prompt(
    'Unit ID',
    'Voor welke Quinyx Unit ID wil je een API key instellen?',
    ui.ButtonSet.OK_CANCEL
  );
  if (unitResult.getSelectedButton() !== ui.Button.OK) return;
  const unitId = unitResult.getResponseText().trim();
  if (!unitId) { ui.alert('Geen Unit ID ingevoerd.'); return; }

  const keyResult = ui.prompt(
    'API key voor unit ' + unitId,
    'Voer de Quinyx API key in voor unit ' + unitId + ':',
    ui.ButtonSet.OK_CANCEL
  );
  if (keyResult.getSelectedButton() !== ui.Button.OK) return;
  const key = keyResult.getResponseText().trim();
  if (!key) { ui.alert('Geen key ingevoerd.'); return; }

  PropertiesService.getScriptProperties().setProperty('QUINYX_API_KEY_' + unitId, key);
  ui.alert('✅ API key voor unit ' + unitId + ' opgeslagen.');
}
