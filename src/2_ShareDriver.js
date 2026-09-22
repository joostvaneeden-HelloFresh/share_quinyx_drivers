/**
 * Kernlogica voor het tijdelijk delen van chauffeurs tussen hubs.
 *
 * GDPR-waarborgen:
 *  1. Email-gebaseerde hubdetectie — een manager kan alleen chauffeurs
 *     van zijn/haar eigen hub delen.
 *  2. De API-key is gescoopt per unit in Quinyx, zodat de API zelf
 *     ook afdwingt dat je alleen binnen je eigen unit kunt handelen.
 *  3. Elke actie wordt vastgelegd in het auditlog (Log tab).
 */

/**
 * Deelt een chauffeur tijdelijk met een andere hub.
 * Wordt aangeroepen vanuit de HTML-dialoog via google.script.run.
 *
 * @param {{badgeNo:string, targetHubName:string, startDate:string, endDate:string}} formData
 * @returns {{success:boolean, message:string}}
 */
function shareDriver(formData) {
  let managerHub = null;
  let targetHub = null;

  try {
    // 1. Bepaal de hub van de ingelogde manager
    managerHub = getManagerHub();

    // 2. Valideer het formulier
    const validation = validateForm(formData);
    if (!validation.ok) {
      return { success: false, message: validation.message };
    }

    // 3. Zoek de doelhub op
    const allHubs = getHubConfigs();
    targetHub = allHubs.find(h => h.name === formData.targetHubName);
    if (!targetHub) {
      return { success: false, message: 'Doelhub niet gevonden: ' + formData.targetHubName };
    }

    // 4. Voorkom delen naar eigen hub
    if (managerHub.name === targetHub.name) {
      return { success: false, message: 'Je kunt een chauffeur niet naar je eigen hub delen.' };
    }

    // 5. Haal de API key op voor de hub van de manager
    //    (de bronhub autoriseert de verplaatsing)
    const apiKey = getApiKeyForUnit(managerHub.unitId);

    // 6. Roep de Quinyx API aan
    const result = quinyxMoveEmployee({
      badgeNo: String(formData.badgeNo).trim(),
      sourceSectionId: managerHub.sectionId,
      targetSectionId: targetHub.sectionId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      apiKey: apiKey,
    });

    // 7. Log altijd — ook bij fouten
    logShareAction({
      actorEmail: Session.getActiveUser().getEmail(),
      action: result.success ? 'GEDEELD' : 'FOUT',
      badgeNo: String(formData.badgeNo).trim(),
      fromHub: managerHub.name,
      toHub: targetHub.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: result.success ? 'OK' : 'GEFAALD',
      notes: result.success ? '' : result.message,
    });

    return { success: result.success, message: result.message };

  } catch (e) {
    Logger.log('[shareDriver] Fout: ' + e.toString() + '\n' + e.stack);

    // Probeer alsnog te loggen als we al weten wie en wat
    try {
      if (managerHub) {
        logShareAction({
          actorEmail: Session.getActiveUser().getEmail(),
          action: 'FOUT',
          badgeNo: String(formData.badgeNo || '').trim(),
          fromHub: managerHub ? managerHub.name : '?',
          toHub: targetHub ? targetHub.name : formData.targetHubName || '?',
          startDate: formData.startDate || '',
          endDate: formData.endDate || '',
          status: 'SYSTEEMFOUT',
          notes: e.message,
        });
      }
    } catch (_) { /* log fout mag niet crashen */ }

    return { success: false, message: e.message };
  }
}

/**
 * Valideert de formuliergegevens.
 * @param {Object} formData
 * @returns {{ok:boolean, message:string}}
 */
function validateForm(formData) {
  const badgeNo = String(formData.badgeNo || '').trim();
  if (!badgeNo) return { ok: false, message: 'Personeelsnummer is verplicht.' };

  // Personeelsnummer: cijfers en letters toegestaan, 3-15 tekens
  if (!/^[A-Za-z0-9]{3,15}$/.test(badgeNo)) {
    return { ok: false, message: 'Personeelsnummer is ongeldig (3-15 alfanumerieke tekens).' };
  }

  if (!formData.targetHubName) return { ok: false, message: 'Selecteer een doelhub.' };
  if (!formData.startDate)     return { ok: false, message: 'Startdatum is verplicht.' };
  if (!formData.endDate)       return { ok: false, message: 'Einddatum is verplicht.' };

  const start = new Date(formData.startDate);
  const end   = new Date(formData.endDate);

  if (isNaN(start.getTime())) return { ok: false, message: 'Startdatum is ongeldig.' };
  if (isNaN(end.getTime()))   return { ok: false, message: 'Einddatum is ongeldig.' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) return { ok: false, message: 'Startdatum mag niet in het verleden liggen.' };
  if (end < start)   return { ok: false, message: 'Einddatum moet op of na de startdatum liggen.' };

  return { ok: true, message: '' };
}

/**
 * Geeft de naam van de hub van de ingelogde manager terug.
 * Aangeroepen vanuit de HTML-dialoog.
 *
 * @returns {string|null}
 */
function getManagerHubName() {
  try {
    const hub = getManagerHub();
    return hub.name;
  } catch (_) {
    return null;
  }
}

/**
 * Geeft de lijst van andere hubs terug (voor het dropdown).
 * Sluit de hub van de huidige manager uit.
 * Aangeroepen vanuit de HTML-dialoog.
 *
 * @returns {string[]}
 */
function getOtherHubNames() {
  try {
    const allHubs = getHubConfigs();
    let managerHubName = null;
    try { managerHubName = getManagerHub().name; } catch (_) {}

    return allHubs
      .filter(h => h.name !== managerHubName)
      .map(h => h.name);
  } catch (e) {
    Logger.log('[getOtherHubNames] ' + e.toString());
    return [];
  }
}
