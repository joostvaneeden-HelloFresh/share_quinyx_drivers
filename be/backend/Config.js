// Quinyx rol-ID van "role.employee" in deze omgeving (verschilt per Quinyx-omgeving)
const ROLE_ID_EMPLOYEE = 19015;

// Unit-code = extGroupId (integratiesleutel) van de unit in Quinyx; komt overeen met restId van de medewerkers
const HUBS = {
  Namur:       { unitExtCode: '52033' },
  Antwerpen:   { unitExtCode: '52034' },
  Gent:        { unitExtCode: '52035' },
  Kluisbergen: { unitExtCode: '52036' },
  Brussel:     { unitExtCode: '52037' },
  Houthalen:   { unitExtCode: '261806' },
};

// Interne Quinyx groupIds per uitzendpartij per hub (type=SECTION, uit wsdlGetNeoGroups)
// null = sectie bestaat niet
const SECTION_IDS = {
  HelloFresh: {
    Namur:       206823,
    Antwerpen:   206826,
    Gent:        206815,
    Kluisbergen: 206819,
    Brussel:     206811,
    Houthalen:   261812,
  },
  Adecco: {
    Namur:       268618,
    Antwerpen:   261817,
    Gent:        268616,
    Kluisbergen: 268617,
    Brussel:     261818,
    Houthalen:   261816,
  },
  NowJobs: {
    Namur:       null,
    Antwerpen:   206829,
    Gent:        206818,
    Kluisbergen: 206822,
    Brussel:     206814,
    Houthalen:   261813,
  },
  Subs: {
    Namur:       null,
    Antwerpen:   254520,
    Gent:        255002,
    Kluisbergen: 255003,
    Brussel:     255001,
    Houthalen:   261814,
  },
  TempoTeam: {
    Namur:       206825,
    Antwerpen:   206828,
    Gent:        206817,
    Kluisbergen: 206821,
    Brussel:     206813,
    Houthalen:   261815,
  },
};

// Badge-prefix = agencycode + hubcode (bijv. TTGEN123). HelloFresh-medewerkers hebben een numeriek badgenummer.
const AGENCY_PREFIX = {
  Adecco:    'AD',
  TempoTeam: 'TT',
  NowJobs:   'NJ',
  Subs:      'SI',
};
const HUB_PREFIX = {
  Namur:       'NAM',
  Antwerpen:   'ANT',
  Brussel:     'BRU',
  Gent:        'GEN',
  Houthalen:   'HOU',
  Kluisbergen: 'KLU',
};

// Genereer SECTIES automatisch: alle agency+hub combinaties
const SECTIES = {};
Object.keys(AGENCY_PREFIX).forEach(function(agency) {
  Object.keys(HUB_PREFIX).forEach(function(homeHub) {
    SECTIES[AGENCY_PREFIX[agency] + HUB_PREFIX[homeHub]] = {
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
