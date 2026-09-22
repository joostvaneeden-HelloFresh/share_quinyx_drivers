function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚗 Chauffeur Delen')
    .addItem('Deel chauffeur met andere hub...', 'openShareDialog')
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('⚙️ Setup (alleen beheerders)')
        .addItem('Initialiseer bladen', 'initializeSheets')
        .addItem('Stel API key in', 'promptApiKey')
    )
    .addToUi();
}

function openShareDialog() {
  const html = HtmlService.createHtmlOutputFromFile('ShareDialog')
    .setWidth(500)
    .setHeight(540);
  SpreadsheetApp.getUi().showModalDialog(html, '🚗 Chauffeur tijdelijk delen');
}

function initializeSheets() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const ui      = SpreadsheetApp.getUi();
  const created = [];

  if (!ss.getSheetByName(CONFIG.SHEETS.CONFIG)) {
    const sheet = ss.insertSheet(CONFIG.SHEETS.CONFIG);
    sheet.appendRow(['Hub Naam', 'Unit Ext Code (Quinyx)', 'Uitzendpartij', 'Sectie Code (integration key)', 'Manager Emails (komma-gescheiden)']);
    sheet.appendRow(['Nieuwegein', 'NGN', 'YoungCapital', 'YC-NGN', 'manager.ngn@hellofresh.com']);
    sheet.appendRow(['Diemen',    'DIM', 'YoungCapital', 'YC-DIM', '']);

    const h = sheet.getRange(1, 1, 1, 5);
    h.setFontWeight('bold'); h.setBackground('#34a853'); h.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    [160, 180, 140, 220, 300].forEach((w, i) => sheet.setColumnWidth(i + 1, w));
    sheet.protect().setDescription('Hubconfiguratie — alleen beheerders');
    created.push('Config');
  }

  if (!ss.getSheetByName(CONFIG.SHEETS.LOG)) {
    createLogSheet(ss);
    created.push('Log');
  }

  if (created.length > 0) {
    ui.alert('Aangemaakt: ' + created.join(' en ') + '.\n\nVul nu de Config tab in met jouw echte hubgegevens, en stel daarna de API key in via Setup → Stel API key in.');
  } else {
    ui.alert('Bladen bestaan al.');
  }
}

function promptApiKey() {
  const ui     = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'Quinyx API key',
    'Voer de Quinyx API key in.\nWordt veilig opgeslagen, niet zichtbaar in het sheet.',
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() !== ui.Button.OK) return;
  const key = result.getResponseText().trim();
  if (!key) { ui.alert('Niets ingevoerd.'); return; }
  PropertiesService.getScriptProperties().setProperty('QUINYX_API_KEY', key);
  ui.alert('✅ API key opgeslagen.');
}
