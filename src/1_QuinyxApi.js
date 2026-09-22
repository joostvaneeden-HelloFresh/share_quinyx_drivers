/**
 * Quinyx SOAP API wrapper — wsdlMoveEmployees operatie.
 *
 * De exacte parameternamen moet je verifiëren via de WSDL documentatie:
 * https://developer.quinyx.com/api/v1/operations/wsdlMoveEmployees
 *
 * Veel voorkomende Quinyx SOAP veldnamen (pas aan na verificatie):
 *   - Medewerker:  badgeNo | extendedEmployeeId | employeeId
 *   - Sectie/groep: groupId | sectionId | sourceGroupId / targetGroupId
 *   - Datum:       fromDate/toDate | startDate/endDate
 */

/**
 * Verplaatst een medewerker tijdelijk naar een andere sectie in Quinyx.
 *
 * @param {Object} params
 * @param {string} params.badgeNo         - Personeelsnummer
 * @param {string} params.sourceSectionId - Sectie ID van de bronnenhub
 * @param {string} params.targetSectionId - Sectie ID van de doelhub
 * @param {string} params.startDate       - Startdatum (YYYY-MM-DD)
 * @param {string} params.endDate         - Einddatum (YYYY-MM-DD)
 * @param {string} params.apiKey          - Quinyx API key
 * @returns {{success:boolean, message:string, raw:string}}
 */
function quinyxMoveEmployee(params) {
  const soapEnvelope = buildMoveEmployeesSoap(params);

  const options = {
    method: 'post',
    contentType: 'text/xml; charset=utf-8',
    headers: {
      'SOAPAction': '"wsdlMoveEmployees"',
    },
    payload: soapEnvelope,
    muteHttpExceptions: true,
  };

  let response;
  try {
    response = UrlFetchApp.fetch(CONFIG.API_URL, options);
  } catch (e) {
    Logger.log('[QuinyxApi] Verbindingsfout: ' + e.toString());
    return { success: false, message: 'Verbindingsfout met Quinyx: ' + e.message, raw: '' };
  }

  const code = response.getResponseCode();
  const body = response.getContentText('UTF-8');

  Logger.log('[QuinyxApi] HTTP ' + code + ' response:\n' + body);

  if (code !== 200) {
    return {
      success: false,
      message: 'Quinyx API fout (HTTP ' + code + '). Zie logs voor details.',
      raw: body,
    };
  }

  return parseMoveEmployeesResponse(body);
}

/**
 * Bouwt de SOAP envelope voor de wsdlMoveEmployees operatie.
 *
 * ⚠️  TODO: Verifieer de XML-parameternamen tegen de actuele Quinyx WSDL.
 *     Raadpleeg je Quinyx accountmanager of de developer documentatie.
 */
function buildMoveEmployeesSoap(params) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:api="https://quinyx.com/">
  <soapenv:Header>
    <api:token>${xmlEscape(params.apiKey)}</api:token>
  </soapenv:Header>
  <soapenv:Body>
    <api:wsdlMoveEmployees>
      <badgeNo>${xmlEscape(params.badgeNo)}</badgeNo>
      <sourceGroupId>${xmlEscape(params.sourceSectionId)}</sourceGroupId>
      <targetGroupId>${xmlEscape(params.targetSectionId)}</targetGroupId>
      <startDate>${xmlEscape(params.startDate)}</startDate>
      <endDate>${xmlEscape(params.endDate)}</endDate>
    </api:wsdlMoveEmployees>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Parseert de SOAP response van wsdlMoveEmployees.
 *
 * @param {string} responseXml
 * @returns {{success:boolean, message:string, raw:string}}
 */
function parseMoveEmployeesResponse(responseXml) {
  // SOAP Fault detectie
  if (responseXml.includes('<faultstring') || responseXml.match(/:Fault\b/)) {
    const match = responseXml.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/i);
    const fault = match ? match[1].trim() : 'Onbekende SOAP fout';
    return { success: false, message: 'Quinyx melding: ' + fault, raw: responseXml };
  }

  // Succesvolle response (Quinyx geeft een bevestiging terug)
  if (
    responseXml.includes('wsdlMoveEmployeesResponse') ||
    responseXml.includes('moveEmployeesResult') ||
    responseXml.includes('<return>true</return>') ||
    responseXml.includes('<result>true</result>')
  ) {
    return { success: true, message: 'Chauffeur succesvol gedeeld in Quinyx.', raw: responseXml };
  }

  // Onverwacht antwoord — log voor debugging
  Logger.log('[QuinyxApi] Onverwacht antwoord: ' + responseXml);
  return {
    success: false,
    message: 'Onverwacht antwoord van Quinyx. Controleer de logs of neem contact op met de beheerder.',
    raw: responseXml,
  };
}

/**
 * Escapet speciale XML-tekens om XML-injectie te voorkomen.
 * @param {*} value
 * @returns {string}
 */
function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
