// Alle hubs met hun unitExtCode (extGroupId uit Quinyx)
const HUBS = {
  Diemen:       { unitExtCode: '50644' },
  Nieuwegein:   { unitExtCode: '50646' },
  Schiedam:     { unitExtCode: '50645' },
  Duiven:       { unitExtCode: '50649' },
  'Etten-Leur': { unitExtCode: '50650' },
  Maastricht:   { unitExtCode: '50651' },
  Reusel:       { unitExtCode: '50652' },
  Ruinerwold:   { unitExtCode: '50648' },
  Groningen:    { unitExtCode: '249319' },
};

// Personeelsnummer prefix → uitzendpartij + thuishub + interne Quinyx groupId per doelhub
// groupIds komen uit wsdlGetNeoGroups (type=SECTION)
// Voeg hier nieuwe prefixes toe zodra je de prefix van andere hubs weet.
const SECTIES = {
  'YCDIE': {
    agency:  'YoungCapital',
    homeHub: 'Diemen',
    secties: {
      Diemen:       '206236',
      Nieuwegein:   '206395',
      Schiedam:     '204960',
      Duiven:       '206244',
      'Etten-Leur': '206258',
      Maastricht:   '206266',
      Reusel:       '206273',
      Ruinerwold:   '206306',
      Groningen:    '250804',
    },
  },
  'TIDIE': {
    agency:  'Timing',
    homeHub: 'Diemen',
    secties: {
      Diemen:       '206238',
      Nieuwegein:   '206288',
      Schiedam:     '206251',
      Duiven:       '206246',
      'Etten-Leur': '206259',
      Maastricht:   '206267',
      Reusel:       '259930',
      Ruinerwold:   '206309',
      Groningen:    '250803',
    },
  },
  // Voeg hier prefixes toe voor andere hubs, bijv:
  // 'YCNIE': { agency: 'YoungCapital', homeHub: 'Nieuwegein', secties: { ... } },
  // 'TINIE': { agency: 'Timing',       homeHub: 'Nieuwegein', secties: { ... } },
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
    homeHub:     info.homeHub,
    sectionCode: info.secties[doelHub],
  };
}
