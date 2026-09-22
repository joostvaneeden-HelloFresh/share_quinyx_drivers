/**
 * Kernlogica: chauffeur tijdelijk delen tussen hubs.
 *
 * GDPR: een manager kan alleen handelen vanuit zijn eigen hub.
 * Elke actie wordt gelogd in de Log tab.
 */

/**
 * Aangeroepen vanuit de HTML-dialoog.
 *
 * @param {{badgeNo, agency, targetHubName, startDate, endDate}} form
 * @returns {{success: boolean, message: string}}
 */
function shareDriver(form) {
  let myHubName = null;

  try {
    // 1. Bepaal hub van de ingelogde manager
    myHubName = getManagerHubName();
    if (!myHubName) {
      return { success: false, message: 'Jouw email is niet geconfigureerd als hubmanager. Neem contact op met de beheerder.' };
    }

    // 2. Valideer formulier
    const v = validateForm(form);
    if (!v.ok) return { success: false, message: v.message };

    // 3. Voorkom delen naar eigen hub
    if (form.targetHubName === myHubName) {
      return { success: false, message: 'Je kunt niet delen naar je eigen hub.' };
    }

    // 4. Zoek sectie op in doelhub voor deze uitzendpartij
    const target = getSectionForHubAndAgency(form.targetHubName, form.agency);
    if (!target) {
      return {
        success: false,
        message: 'Geen sectie gevonden voor ' + form.agency + ' in ' + form.targetHubName + '. Controleer de Config tab.',
      };
    }

    // 5. API-aanroep
    const result = quinyxMoveEmployee({
      apiKey:      getApiKey(),
      badgeNo:     String(form.badgeNo).trim(),
      unitExtCode: target.unitExtCode,
      sectionCode: target.sectionCode,
      startDate:   form.startDate,
      endDate:     form.endDate,
    });

    // 6. Altijd loggen
    logShareAction({
      actorEmail: Session.getActiveUser().getEmail(),
      action:     result.success ? 'GEDEELD' : 'FOUT',
      badgeNo:    String(form.badgeNo).trim(),
      agency:     form.agency,
      fromHub:    myHubName,
      toHub:      form.targetHubName,
      startDate:  form.startDate,
      endDate:    form.endDate,
      status:     result.success ? 'OK' : 'GEFAALD',
      notes:      result.success ? '' : result.message,
    });

    return result;

  } catch (e) {
    Logger.log('[shareDriver] ' + e.toString());
    try {
      logShareAction({
        actorEmail: Session.getActiveUser().getEmail(),
        action:     'FOUT',
        badgeNo:    String(form.badgeNo || '').trim(),
        agency:     form.agency || '',
        fromHub:    myHubName || '?',
        toHub:      form.targetHubName || '?',
        startDate:  form.startDate || '',
        endDate:    form.endDate || '',
        status:     'SYSTEEMFOUT',
        notes:      e.message,
      });
    } catch (_) {}
    return { success: false, message: e.message };
  }
}

/**
 * Geeft data terug voor de dialoog:
 * - myHubName: hub van de manager
 * - agencies: uitzendpartijen in die hub
 * - otherHubs: andere hubs
 */
function getDialogData() {
  const myHubName = getManagerHubName();
  if (!myHubName) {
    return { myHubName: null, agencies: [], otherHubs: [] };
  }
  return {
    myHubName:  myHubName,
    agencies:   getAgenciesForHub(myHubName),
    otherHubs:  getOtherHubNames(myHubName),
  };
}

function validateForm(form) {
  const badgeNo = String(form.badgeNo || '').trim();
  if (!badgeNo)           return { ok: false, message: 'Personeelsnummer is verplicht.' };
  if (!/^[A-Za-z0-9]{2,15}$/.test(badgeNo))
                          return { ok: false, message: 'Ongeldig personeelsnummer (2-15 tekens, alleen letters en cijfers).' };
  if (!form.agency)       return { ok: false, message: 'Selecteer een uitzendpartij.' };
  if (!form.targetHubName) return { ok: false, message: 'Selecteer een doelhub.' };
  if (!form.startDate)    return { ok: false, message: 'Startdatum is verplicht.' };
  if (!form.endDate)      return { ok: false, message: 'Einddatum is verplicht.' };

  const start = new Date(form.startDate);
  const end   = new Date(form.endDate);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime())) return { ok: false, message: 'Ongeldige startdatum.' };
  if (isNaN(end.getTime()))   return { ok: false, message: 'Ongeldige einddatum.' };
  if (start < today)          return { ok: false, message: 'Startdatum mag niet in het verleden liggen.' };
  if (end < start)            return { ok: false, message: 'Einddatum moet op of na de startdatum liggen.' };

  return { ok: true };
}
