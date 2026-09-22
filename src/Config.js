// Hardcoded configuratie voor de Diemen sheet.
// Voor Nieuwegein: maak een aparte sheet en verander DEZE_HUB.

const DEZE_HUB = { naam: 'Diemen', unitExtCode: '50644' };

const HUBS = {
  Nieuwegein: { unitExtCode: '50646' },
};

// Personeelsnummer prefix → sectie code per hub
const SECTIES = {
  'YCDIE': { agency: 'YoungCapital', secties: { Diemen: '81055', Nieuwegein: '81124' } },
  'TIDIE': { agency: 'Timing',       secties: { Diemen: '81971', Nieuwegein: '82021' } },
};

const API_URL = 'https://api.quinyx.com/FlexForceWebServices.php';

// Haal de API key op voor de doelhub (de key van de hub waar naartoe gedeeld wordt)
function getApiKeyVoor(hubNaam) {
  const key = PropertiesService.getScriptProperties().getProperty('QUINYX_API_KEY_' + hubNaam);
  if (!key) throw new Error('API key voor ' + hubNaam + ' niet ingesteld. Ga naar Setup → Stel API key in.');
  return key;
}

// Bepaalt de sectie op basis van het personeelsnummer en de doelhub.
function getSectieInfo(badgeNo, doelHub) {
  const prefix = Object.keys(SECTIES).find(p => badgeNo.toUpperCase().startsWith(p));
  if (!prefix) return null;
  const info = SECTIES[prefix];
  return {
    agency:      info.agency,
    sectionCode: info.secties[doelHub],
  };
}
