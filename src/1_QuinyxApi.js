/**
 * Quinyx SOAP API wrapper — wsdlMoveEmployees
 *
 * Endpoint:   https://api.quinyx.com/FlexForceWebServices.php
 * SOAPAction: "uri:FlexForce/wsdlMoveEmployees"
 */

/**
 * Deelt een chauffeur tijdelijk met een andere hub.
 *
 * @param {Object} p
 * @param {string} p.apiKey            - Quinyx API key
 * @param {string} p.badgeNo           - Personeelsnummer van de chauffeur
 * @param {string} p.unitExtCode       - Externe code van de doelhub
 * @param {string} p.sectionCode       - Integratiecode van de doelsectie
 * @param {string} p.startDate         - Startdatum (YYYY-MM-DD)
 * @param {string} p.endDate           - Einddatum (YYYY-MM-DD)
 * @returns {{success: boolean, message: string}}
 */
function quinyxMoveEmployee(p) {
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
  xmlns:tns="https://api.quinyx.com/soap/FlexForce">
  <soap:Body>
    <tns:wsdlMoveEmployees>
      <apiKey xsi:type="xsd:string">${xmlEscape(p.apiKey)}</apiKey>
      <moveEmployees xsi:type="SOAP-ENC:Array" SOAP-ENC:arrayType="tns:moveEmployee[1]">
        <item xsi:type="tns:moveEmployee">
          <badgeNo xsi:type="xsd:string">${xmlEscape(p.badgeNo)}</badgeNo>
          <unitExtCode xsi:type="xsd:string">${xmlEscape(p.unitExtCode)}</unitExtCode>
          <newUnitStartDate xsi:type="xsd:string">${xmlEscape(p.startDate)}</newUnitStartDate>
          <oldUnitEndShareDate xsi:type="xsd:string">${xmlEscape(p.endDate)}</oldUnitEndShareDate>
          <sharableOnNewUnitFrom xsi:type="xsd:string">${xmlEscape(p.startDate)}</sharableOnNewUnitFrom>
          <section xsi:type="xsd:string">${xmlEscape(p.sectionCode)}</section>
        </item>
      </moveEmployees>
    </tns:wsdlMoveEmployees>
  </soap:Body>
</soap:Envelope>`;

  let response;
  try {
    response = UrlFetchApp.fetch(CONFIG.API_URL, {
      method:            'post',
      contentType:       'text/xml; charset=utf-8',
      headers:           { 'SOAPAction': '"uri:FlexForce/wsdlMoveEmployees"' },
      payload:           envelope,
      muteHttpExceptions: true,
    });
  } catch (e) {
    return { success: false, message: 'Verbindingsfout met Quinyx: ' + e.message };
  }

  const code = response.getResponseCode();
  const body = response.getContentText('UTF-8');
  Logger.log('[Quinyx] HTTP ' + code + '\n' + body);

  if (code !== 200) {
    return { success: false, message: 'Quinyx API fout (HTTP ' + code + ').' };
  }

  return parseResponse(body);
}

function parseResponse(xml) {
  // SOAP Fault
  const faultMatch = xml.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/i);
  if (faultMatch) {
    return { success: false, message: 'Quinyx: ' + faultMatch[1].trim() };
  }

  // Validatiefouten uit de response
  const errMatch = xml.match(/<validationErrors[^>]*>(.+?)<\/validationErrors>/is);
  if (errMatch && errMatch[1].includes('<item')) {
    const itemMatch = errMatch[1].match(/<item[^>]*>([^<]+)<\/item>/i);
    if (itemMatch) {
      return { success: false, message: 'Quinyx validatiefout: ' + itemMatch[1].trim() };
    }
  }

  if (xml.includes('wsdlMoveEmployeesResponse') || xml.includes('<moveEmployees')) {
    return { success: true, message: 'Chauffeur succesvol gedeeld in Quinyx.' };
  }

  return { success: false, message: 'Onverwacht antwoord van Quinyx. Zie logs.' };
}

function xmlEscape(v) {
  return String(v || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
