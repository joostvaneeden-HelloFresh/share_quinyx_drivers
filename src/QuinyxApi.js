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
      <apiKey xsi:type="xsd:string">${x(p.apiKey)}</apiKey>
      <moveEmployees xsi:type="SOAP-ENC:Array" SOAP-ENC:arrayType="tns:moveEmployee[1]">
        <item xsi:type="tns:moveEmployee">
          <badgeNo xsi:type="xsd:string">${x(p.badgeNo)}</badgeNo>
          <unitExtCode xsi:type="xsd:string">${x(p.unitExtCode)}</unitExtCode>
          <newUnitStartDate xsi:type="xsd:string">${x(p.startDate)}</newUnitStartDate>
          <oldUnitEndShareDate xsi:type="xsd:string">${x(p.endDate)}</oldUnitEndShareDate>
          <sharableOnNewUnitFrom xsi:type="xsd:string">${x(p.startDate)}</sharableOnNewUnitFrom>
          <section xsi:type="xsd:string">${x(p.sectionCode)}</section>
        </item>
      </moveEmployees>
    </tns:wsdlMoveEmployees>
  </soap:Body>
</soap:Envelope>`;

  let response;
  try {
    response = UrlFetchApp.fetch(API_URL, {
      method:             'post',
      contentType:        'text/xml; charset=utf-8',
      headers:            { SOAPAction: '"uri:FlexForce/wsdlMoveEmployees"' },
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

  const fault = body.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/i);
  if (fault) return { success: false, message: 'Quinyx: ' + fault[1].trim() };

  // Lees validatiefouten uit de response
  const errors = [];
  const regex = /<validationErrors[^>]*>(.+?)<\/validationErrors>/is;
  const block = body.match(regex);
  if (block) {
    const items = block[1].matchAll(/<item[^>]*>([^<]+)<\/item>/gi);
    for (const m of items) {
      if (m[1].trim()) errors.push(m[1].trim());
    }
  }
  if (errors.length > 0) {
    return { success: false, message: 'Quinyx: ' + errors.join(' | ') };
  }

  return { success: true, message: 'Chauffeur succesvol gedeeld.' };
}

function x(v) {
  return String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
