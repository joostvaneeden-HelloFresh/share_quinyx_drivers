/**
 * Quinyx SOAP API — wsdlUpdateEmployees
 * Voegt een tijdelijke groepsrol toe aan een medewerker (tijdelijk delen).
 * De API key is van de BRONHUB (Diemen) zodat de medewerker daar thuis blijft.
 */

function quinyxShareEmployee(p) {
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
  xmlns:tns="https://api.quinyx.com/soap/FlexForce">
  <soap:Body>
    <tns:wsdlUpdateEmployees>
      <apiKey xsi:type="xsd:string">${x(p.apiKey)}</apiKey>
      <employees xsi:type="SOAP-ENC:Array" SOAP-ENC:arrayType="tns:UpdateEmployee[1]">
        <item xsi:type="tns:UpdateEmployee">
          <badgeNo xsi:type="xsd:string">${x(p.badgeNo)}</badgeNo>
          <replaceNeoGroup xsi:type="xsd:boolean">false</replaceNeoGroup>
          <groupRoles xsi:type="SOAP-ENC:Array" SOAP-ENC:arrayType="tns:GroupsRoles[1]">
            <item xsi:type="tns:GroupsRoles">
              <extGroupId xsi:type="xsd:string">${x(p.targetSectionCode)}</extGroupId>
              <roleId xsi:type="xsd:string">18938</roleId>
              <startDate xsi:type="xsd:string">${x(p.startDate)}</startDate>
              <endDate xsi:type="xsd:string">${x(p.endDate)}</endDate>
            </item>
          </groupRoles>
        </item>
      </employees>
    </tns:wsdlUpdateEmployees>
  </soap:Body>
</soap:Envelope>`;

  let response;
  try {
    response = UrlFetchApp.fetch(API_URL, {
      method:             'post',
      contentType:        'text/xml; charset=utf-8',
      headers:            { SOAPAction: '"uri:FlexForce/wsdlUpdateEmployees"' },
      payload:            envelope,
      muteHttpExceptions: true,
    });
  } catch (e) {
    return { success: false, message: 'Verbindingsfout: ' + e.message };
  }

  const code = response.getResponseCode();
  const body = response.getContentText('UTF-8');
  Logger.log('[Quinyx] HTTP ' + code + '\n' + body);

  if (code !== 200) return { success: false, message: 'Quinyx fout (HTTP ' + code + ').' };

  // SOAP fault
  const fault = body.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/i);
  if (fault) return { success: false, message: 'Quinyx: ' + fault[1].trim() };

  // Validatiefouten
  const errors = [];
  const block = body.match(/<validationErrors[^>]*>(.+?)<\/validationErrors>/is);
  if (block) {
    for (const m of block[1].matchAll(/<item[^>]*>([^<]+)<\/item>/gi)) {
      if (m[1].trim()) errors.push(m[1].trim());
    }
  }
  if (errors.length > 0) return { success: false, message: 'Quinyx: ' + errors.join(' | ') };

  return { success: true, message: 'Chauffeur succesvol gedeeld.' };
}

function x(v) {
  return String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
