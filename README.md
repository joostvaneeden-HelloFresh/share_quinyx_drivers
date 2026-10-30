# Quinyx chauffeurs delen

Hubmanagers delen via een Google Sheet tijdelijk een chauffeur met een andere hub. De koppeling gebruikt de Quinyx SOAP API.

## Structuur

```
nl/
├── backend/   Apps Script project, alleen voor beheerders. Wordt als Library gepubliceerd.
│              Bevat de logica en de API keys (Script Properties).
└── sheet/     Wat de hubmanagers zien: menu, dialoog en een dunne wrapper rond de library.
be/            Belgische variant (nog leeg).
```

De API keys staan alleen in de Script Properties van het backend-project (`QUINYX_API_KEY_<hub>`). Managers hebben geen toegang tot dat project, alleen de sheet roept de library aan.

## Hoe het delen werkt

- Het prefix van het badgenummer bepaalt de uitzendpartij (`YC`, `TI`, `TT`, `NJ`, `YO`, `LW`) plus hubcode, bijvoorbeeld `TTDUI58038`. Numerieke badgenummers zijn HelloFresh-medewerkers.
- De chauffeur wordt via `wsdlUpdateEmployees` (`groupRoles`, `replaceNeoGroup=false`) met start- en einddatum in de sectie van dezelfde uitzendpartij bij de doelhub gezet.
- **De API key bepaalt de thuisunit in Quinyx**: een key van een andere unit verplaatst de medewerker. Daarom zoekt de backend vóór het delen met `wsdlGetEmployeesV2` de hub waarvan de `restId` van de medewerker overeenkomt met de unit, en gebruikt alleen die key. Bestaat het nummer nergens, dan wordt het geweigerd.
- Elke poging komt in de Log-tab van de sheet.

## Deployen

1. Plak de bestanden uit `nl/backend/` in het backend-project, maak een nieuwe deployment (Library) en zet per hub een API key in de Script Properties.
2. Plak de bestanden uit `nl/sheet/` in het Apps Script project van de sheet en voeg de library toe met de identifier `QuinyxBackend` op de nieuwste versie.
3. Na elke wijziging in de backend: nieuwe deployment en library-versie in de sheets bijwerken.
