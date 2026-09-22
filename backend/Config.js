const DEZE_HUB = { naam: 'Diemen', unitExtCode: '50644' };

const HUBS = {
  Nieuwegein: { unitExtCode: '50646' },
};

// Personeelsnummer prefix → interne Quinyx groupId per hub
const SECTIES = {
  'YCDIE': { agency: 'YoungCapital', secties: { Diemen: '206236', Nieuwegein: '206395' } },
  'TIDIE': { agency: 'Timing',       secties: { Diemen: '206238', Nieuwegein: '206288' } },
};

const API_URL = 'https://api.quinyx.com/FlexForceWebServices.php';

function getApiKeyVoor(hubNaam) {
  const key = PropertiesService.getScriptProperties().getProperty('QUINYX_API_KEY_' + hubNaam);
  if (!key) throw new Error('API key voor ' + hubNaam + ' niet ingesteld.');
  return key;
}

function getSectieInfo(badgeNo, doelHub) {
  const prefix = Object.keys(SECTIES).find(p => badgeNo.toUpperCase().startsWith(p));
  if (!prefix) return null;
  const info = SECTIES[prefix];
  return {
    agency:      info.agency,
    sectionCode: info.secties[doelHub],
  };
}
