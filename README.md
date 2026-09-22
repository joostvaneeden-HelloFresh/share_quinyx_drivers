# Quinyx Chauffeur Delen — Google Apps Script

Hubmanagers kunnen via een Google Sheet chauffeurs tijdelijk delen met een andere hub.
De koppeling gebruikt de Quinyx SOAP API (`wsdlMoveEmployees`).

## Architectuur

```
Google Sheet
 └─ Dialoogvenster (ShareDialog.html)
     └─ Apps Script (server-side)
         ├─ Validatie (email → hub-eigenaarschap)
         ├─ Quinyx SOAP API → wsdlMoveEmployees
         └─ Auditlog (Log tab)
```

**GDPR-waarborgen:**
- Elke manager ziet en beheert alleen chauffeurs van hun eigen hub (op basis van Google-account).
- De API-key staat in Script Properties — nooit zichtbaar in het sheet.
- Elke actie (geslaagd én gefaald) wordt gelogd met tijdstip en gebruiker.

## Vereisten

- Google Workspace account
- [clasp](https://github.com/google/clasp) (optioneel, voor deployment via CLI)
- Toegang tot de Quinyx SOAP API + API key(s)

## Setup

### 1. Apps Script aanmaken

1. Ga naar [script.google.com](https://script.google.com) en maak een nieuw project.
2. Kopieer de Script ID uit de URL (`https://script.google.com/d/SCRIPT_ID/edit`).
3. Vul het Script ID in `.clasp.json`:
   ```json
   { "scriptId": "JOUW_SCRIPT_ID", "rootDir": "src" }
   ```

### 2. Code deployen (via clasp)

```bash
npm install -g @google/clasp
clasp login
clasp push
```

Of kopieer de bestanden uit `src/` handmatig in de Apps Script editor.

### 3. Bladen initialiseren

Open het gekoppelde Google Sheet → menu **🚗 Chauffeur Delen** → **Setup → Initialiseer bladen**.

### 4. Config tab invullen

Pas de **Config** tab aan met echte Quinyx gegevens:

| Hub Naam       | Unit ID (Quinyx) | Sectie ID voor gedeelde chauffeurs | Manager emails                    |
|---------------|------------------|------------------------------------|-----------------------------------|
| Hub Amsterdam | 1001             | 5001                               | jan@bedrijf.nl, piet@bedrijf.nl   |
| Hub Rotterdam | 1002             | 5002                               | klaas@bedrijf.nl                  |

> **Unit ID** en **Sectie ID** vind je in de Quinyx beheeromgeving.
> Het Sectie ID is de sectie die je gebruikt voor tijdelijk gedeelde chauffeurs
> (maak eventueel een aparte sectie "Gedeeld" per hub aan).

### 5. API key instellen

Menu **Setup → Stel globale API key in** (of per unit: **Stel API key in per unit**).

De key wordt opgeslagen in Script Properties — nooit zichtbaar in het sheet.

### 6. WSDL parameters verifiëren ⚠️

Verifieer de SOAP-parameternamen in `src/1_QuinyxApi.js` → `buildMoveEmployeesSoap()`:

```javascript
<badgeNo>...</badgeNo>           // personeelsnummer veld in Quinyx
<sourceGroupId>...</sourceGroupId> // bron sectie ID
<targetGroupId>...</targetGroupId> // doel sectie ID
<startDate>...</startDate>
<endDate>...</endDate>
```

Raadpleeg de actuele WSDL op:
`https://developer.quinyx.com/api/v1/operations/wsdlMoveEmployees`

## Gebruik (voor hubmanagers)

1. Open het Google Sheet.
2. Klik op **🚗 Chauffeur Delen → Deel chauffeur met andere hub...**
3. Vul het personeelsnummer in van de chauffeur die je wilt delen.
4. Selecteer de doelhub en de periode.
5. Klik **Deel chauffeur**.

## Bestandsstructuur

```
src/
├── appsscript.json    - Apps Script manifest
├── 0_Config.js        - Configuratie en hub-lookup
├── 1_QuinyxApi.js     - SOAP API wrapper
├── 2_ShareDriver.js   - Kernlogica + validatie
├── 3_Audit.js         - GDPR auditlog
├── 4_Code.js          - UI-handlers + setup
└── ShareDialog.html   - Dialoogvenster voor managers
```

## Auditlog

Elke deel-actie wordt vastgelegd in de **Log** tab:

| Tijdstip | Gebruiker | Actie | Personeelsnummer | Van hub | Naar hub | Startdatum | Einddatum | Status | Notities |
|----------|-----------|-------|-----------------|---------|---------|-----------|----------|--------|----------|

De Log tab is beveiligd (alleen beheerders kunnen het aanpassen).
Bewaar het log minimaal 2 jaar conform AVG-richtlijnen.
