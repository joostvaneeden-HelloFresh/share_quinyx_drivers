const HUBS = {
  Diemen:       { unitExtCode: '50644' },
  Nieuwegein:   { unitExtCode: '50646' },
  Schiedam:     { unitExtCode: '50645' },
  Bleiswijk:    { unitExtCode: null },   // TODO: unitExtCode nog onbekend
  'Etten-Leur': { unitExtCode: '50650' },
  Duiven:       { unitExtCode: '50649' },
  Maastricht:   { unitExtCode: '50651' },
  Groningen:    { unitExtCode: '249319' },
};

// Interne Quinyx groupIds per uitzendpartij per hub (type=SECTION, uit wsdlGetNeoGroups)
// null = sectie bestaat niet of groupId nog onbekend
const SECTION_IDS = {
  YoungCapital: {
    Diemen:       206236,
    Nieuwegein:   206395,
    Schiedam:     204960,
    Bleiswijk:    null,
    'Etten-Leur': 206258,
    Duiven:       206244,
    Maastricht:   206266,
    Groningen:    250804,
  },
  Timing: {
    Diemen:       206238,
    Nieuwegein:   206288,
    Schiedam:     206251,
    Bleiswijk:    null,
    'Etten-Leur': 206259,
    Duiven:       206246,
    Maastricht:   206267,
    Groningen:    250803,
  },
  TempoTeam: {
    Diemen:       206239,
    Nieuwegein:   264509,
    Schiedam:     206255,
    Bleiswijk:    null,
    'Etten-Leur': 206260,
    Duiven:       206245,
    Maastricht:   277784,
    Groningen:    null,
  },
  NowJobs: {
    Diemen:       206240,
    Nieuwegein:   206290,
    Schiedam:     206252,
    Bleiswijk:    null,
    'Etten-Leur': 252942,
    Duiven:       246373,
    Maastricht:   251494,
    Groningen:    250805,
  },
  Subs: {
    Diemen:       206242,
    Nieuwegein:   206291,
    Schiedam:     246148,
    Bleiswijk:    null,
    'Etten-Leur': 246149,
    Duiven:       214184,
    Maastricht:   246150,
    Groningen:    250808,
  },
  LevelWorks: {
    Diemen:       248890,
    Nieuwegein:   206289,
    Schiedam:     252606,
    Bleiswijk:    null,
    'Etten-Leur': 206262,
    Duiven:       316541,
    Maastricht:   206269,
    Groningen:    null,
  },
};

// Badge-prefix = agencycode + hubcode
const AGENCY_PREFIX = {
  YoungCapital: 'YC',
  Timing:       'TI',
  TempoTeam:    'TT',
  NowJobs:      'NJ',
  Subs:         'YO',
  LevelWorks:   'LW',
};
const HUB_PREFIX = {
  Diemen:       'DIE',
  Nieuwegein:   'NIE',
  Schiedam:     'SCH',
  Bleiswijk:    'BLE',
  'Etten-Leur': 'ETL',
  Duiven:       'DUI',
  Maastricht:   'MAA',
  Groningen:    'GRO',
};

// Genereer SECTIES automatisch: alle agency+hub combinaties
const SECTIES = {};
Object.keys(AGENCY_PREFIX).forEach(function(agency) {
  Object.keys(HUB_PREFIX).forEach(function(homeHub) {
    const prefix = AGENCY_PREFIX[agency] + HUB_PREFIX[homeHub];
    SECTIES[prefix] = {
      agency:  agency,
      homeHub: homeHub,
      secties: SECTION_IDS[agency],
    };
  });
});

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
    sectionCode: info.secties[doelHub] || null,
  };
}
