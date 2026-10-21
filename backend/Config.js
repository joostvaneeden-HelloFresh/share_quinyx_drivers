const HUBS = {
  Diemen:       { unitExtCode: '50644' },
  Nieuwegein:   { unitExtCode: '50646' },
  Schiedam:     { unitExtCode: '50645' },
  'Etten-Leur': { unitExtCode: '50650' },
  Duiven:       { unitExtCode: '50649' },
  Maastricht:   { unitExtCode: '50651' },
  Groningen:    { unitExtCode: '249319' },
  Ruinerwold:   { unitExtCode: '50648' },
};

// Interne Quinyx groupIds per uitzendpartij per hub (type=SECTION, uit wsdlGetNeoGroups)
// null = sectie bestaat niet of groupId nog onbekend
const SECTION_IDS = {
  HelloFresh: {
    Diemen:       206243,
    Nieuwegein:   206295,
    Schiedam:     206256,
    'Etten-Leur': 206263,
    Duiven:       206249,
    Maastricht:   206270,
    Groningen:    250806,
    Ruinerwold:   206310,
  },
  YoungCapital: {
    Diemen:       206236,
    Nieuwegein:   206395,
    Schiedam:     204960,
    'Etten-Leur': 206258,
    Duiven:       206244,
    Maastricht:   206266,
    Groningen:    250804,
    Ruinerwold:   206306,
  },
  Timing: {
    Diemen:       206238,
    Nieuwegein:   206288,
    Schiedam:     206251,
    'Etten-Leur': 206259,
    Duiven:       206246,
    Maastricht:   206267,
    Groningen:    250803,
    Ruinerwold:   206309,
  },
  TempoTeam: {
    Diemen:       206239,
    Nieuwegein:   264509,
    Schiedam:     206255,
    'Etten-Leur': 206260,
    Duiven:       206245,
    Maastricht:   277784,
    Groningen:    null,
    Ruinerwold:   277639,
  },
  NowJobs: {
    Diemen:       206240,
    Nieuwegein:   206290,
    Schiedam:     206252,
    'Etten-Leur': 252942,
    Duiven:       246373,
    Maastricht:   251494,
    Groningen:    250805,
    Ruinerwold:   206308,
  },
  Subs: {
    Diemen:       206242,
    Nieuwegein:   206291,
    Schiedam:     246148,
    'Etten-Leur': 246149,
    Duiven:       214184,
    Maastricht:   246150,
    Groningen:    250808,
    Ruinerwold:   206307,
  },
  LevelWorks: {
    Diemen:       248890,
    Nieuwegein:   206289,
    Schiedam:     252606,
    'Etten-Leur': 206262,
    Duiven:       316541,
    Maastricht:   206269,
    Groningen:    null,
    Ruinerwold:   268958,
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
  'Etten-Leur': 'ETT',
  Duiven:       'DUI',
  Maastricht:   'MAA',
  Groningen:    'GRO',
  Ruinerwold:   'RUI',
};

// Extra hubcodes die naar een bestaande hub verwijzen
// BLE: Bleiswijk is samengevoegd met Schiedam. ETL: oude schrijfwijze van Etten-Leur (ETT).
const HUB_ALIASES = {
  BLE: 'Schiedam',
  ETL: 'Etten-Leur',
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
  Object.keys(HUB_ALIASES).forEach(function(code) {
    SECTIES[AGENCY_PREFIX[agency] + code] = {
      agency:  agency,
      homeHub: HUB_ALIASES[code],
      secties: SECTION_IDS[agency],
    };
  });
});

const API_URL ='https://api.quinyx.com/FlexForceWebServices.php';

function getApiKeyVoor(hubNaam) {
  const key = PropertiesService.getScriptProperties().getProperty('QUINYX_API_KEY_' + hubNaam);
  if (!key) throw new Error('API key voor ' + hubNaam + ' niet ingesteld.');
  return key;
}

// homeHub is alleen een hint (uit het prefix); de echte thuishub komt uit quinyxFindHomeHub.
function getSectieInfo(badgeNo, doelHub) {
  // Numeriek badgenummer = HelloFresh eigen medewerker, thuishub onbekend tot de opzoeking
  if (/^\d+$/.test(badgeNo)) {
    return {
      agency:      'HelloFresh',
      homeHub:     null,
      sectionCode: (SECTION_IDS['HelloFresh'][doelHub] || null),
    };
  }
  const prefix = Object.keys(SECTIES).find(p => badgeNo.toUpperCase().startsWith(p));
  if (!prefix) return null;
  const info = SECTIES[prefix];
  return {
    agency:      info.agency,
    homeHub:     info.homeHub,
    sectionCode: info.secties[doelHub] || null,
  };
}
