/**
 * Quinyx SOAP API.
 * quinyxShareEmployee: wsdlUpdateEmployees, voegt een tijdelijke groepsrol toe (delen).
 *   De API key moet van de echte thuishub zijn, anders verplaatst Quinyx de medewerker.
 * quinyxFindHomeHub: wsdlGetEmployeesV2, zoekt die thuishub vooraf op.
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
              <groupId xsi:type="xsd:int">${x(p.targetSectionCode)}</groupId>
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

/**
 * Zoekt in Quinyx de echte thuishub van een medewerker (restId == unitExtCode van de hub).
 * Probeert eerst hintHub (1 call), daarna de overige hubs met een ingestelde API key.
 * Geeft { hub } bij succes of { error } bij weigering.
 * De response bevat persoonsgegevens en wordt nooit gelogd.
 */
function quinyxFindHomeHub(badgeNo, hintHub) {
  const alleHubs = Object.keys(HUBS);
  const hint = hintHub && HUBS[hintHub] ? [hintHub] : [];
  const overig = alleHubs.filter(function (h) { return h !== hintHub; });

  const eerste = zoekThuishub_(badgeNo, hint);
  if (eerste.hub) return { hub: eerste.hub };

  const tweede = zoekThuishub_(badgeNo, overig);
  if (tweede.hub) return { hub: tweede.hub };

  const details = eerste.afwijkingen.concat(tweede.afwijkingen);
  const fouten  = eerste.fouten.concat(tweede.fouten);
  let message = 'Personeelsnummer ' + badgeNo + ' is niet gevonden als medewerker van een hub in Quinyx. Controleer het nummer.';
  if (details.length) message += ' ' + details.join(' ');
  if (fouten.length)  message += ' Opvragen mislukt voor: ' + fouten.join(', ') + '.';
  return { error: message };
}

function zoekThuishub_(badgeNo, hubs) {
  const resultaat = { hub: null, afwijkingen: [], fouten: [] };
  const requests = [];
  const gebruikt = [];

  hubs.forEach(function (hub) {
    const key = PropertiesService.getScriptProperties().getProperty('QUINYX_API_KEY_' + hub);
    if (!key) return;
    gebruikt.push(hub);
    requests.push({
      url:                API_URL,
      method:             'post',
      contentType:        'text/xml; charset=utf-8',
      headers:            { SOAPAction: '"uri:FlexForce/wsdlGetEmployeesV2"' },
      payload:            '<?xml version="1.0" encoding="UTF-8"?>' +
        '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"' +
        ' xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:uri="uri:FlexForce"' +
        ' xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"><soapenv:Header/><soapenv:Body>' +
        '<uri:wsdlGetEmployeesV2 soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
        '<apiKey xsi:type="xsd:string">' + x(key) + '</apiKey>' +
        '</uri:wsdlGetEmployeesV2></soapenv:Body></soapenv:Envelope>',
      muteHttpExceptions: true,
    });
  });
  if (!requests.length) return resultaat;

  let responses;
  try {
    responses = UrlFetchApp.fetchAll(requests);
  } catch (e) {
    resultaat.fouten = gebruikt.map(function (hub) { return hub + ' (verbindingsfout: ' + e.message + ')'; });
    return resultaat;
  }

  responses.forEach(function (res, i) {
    const hub = gebruikt[i];
    if (res.getResponseCode() !== 200) { resultaat.fouten.push(hub + ' (HTTP ' + res.getResponseCode() + ')'); return; }
    const body = res.getContentText('UTF-8');
    const fault = body.match(/<faultstring[^>]*>([^<]*)<\/faultstring>/i);
    if (fault) { resultaat.fouten.push(hub + ' (Quinyx: ' + fault[1].trim().slice(0, 120) + ')'); return; }

    const restId = zoekRestId_(body, badgeNo);
    if (restId === null) return;
    if (restId === String(HUBS[hub].unitExtCode)) {
      if (!resultaat.hub) resultaat.hub = hub;
    } else {
      resultaat.afwijkingen.push('Gevonden bij ' + hub + ', maar met unit-code ' + restId + ' (verwacht ' + HUBS[hub].unitExtCode + ').');
    }
  });
  return resultaat;
}

function zoekRestId_(body, badgeNo) {
  const gezocht = String(badgeNo).trim().toUpperCase();
  const delen = body.split('<item xsi:type="tns:Employee">');
  for (let i = 1; i < delen.length; i++) {
    const b = delen[i].match(/<badgeNo[^>]*>([^<]*)<\/badgeNo>/);
    if (!b || b[1].trim().toUpperCase() !== gezocht) continue;
    const r = delen[i].match(/<restId[^>]*>(\d+)<\/restId>/);
    return r ? r[1] : null;
  }
  return null;
}
