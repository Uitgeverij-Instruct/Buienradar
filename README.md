# Buienradar

JavaScript-library om eenvoudig data uit de Buienradar API op te halen en weer te geven. Deze library wordt op
verschillende plekken gebruikt in onze online
informaticamethode [Fundament Informatica](https://www.instruct.nl/methoden/fundament-informatica/). Zo kun je in domein
A aan de slag om zelf een app te maken die de data van Buienradar gebruikt om weerinformatie aan de gebruiker te laten
zien. En op een aantal andere plekken maken we gebruik van de library om real-time weerinformatie te gebruiken in de
opdrachten en tekst.

## Installatie en gebruik

De installatie van deze JavaScript-library is erg eenvoudig. Natuurlijk kun je de library installeren met een package
manager als NPM (`npm install @uitgeverij-instruct/buienradar`). Maar het is nog eenvoudiger om gebruik te maken van een
CDN. Kopieer en plak hiervoor de volgende code in de `<body>`-element van je website:

```html

<script src="https://cdn.jsdelivr.net/npm/@uitgeverij-instruct/buienradar@1"></script>
```

Voeg nu **na** dit `<script>`-element een nieuw `<script>`-element toe waarin je de code schrijft voor je applicatie. In deze
tag roep je de functie `buienradar.load()` aan. Deze functie heeft één parameter: een functie die uitgevoerd moet worden
als de data succesvol is opgehaald uit de Buienradar-API.

```html

<script>
    buienradar.load(function () {
        // Hier komt jouw code!
    });
</script>
```

Binnen deze functie kun je nu de verschillende functies aanroepen die de data zichtbaar maken. Voor iedere functie geldt dat je eerst een element in je pagina moet toevoegen waar de data in wordt weergegeven. Om de huidige temperatuur weer te geven kun je bijvoorbeeld dit element toevoegen:

```html
<p>Het is op dit moment <span id="temperatuur"></span> &deg;C.</p>
```

Met de functie `buienradar.currentLocation.temperature.actual` kun je nu de huidige temperatuur weergeven in het `<span>`-element:

```javascript
buienradar.currentLocation.temperature.actual('temperatuur')
```

Deze functie heeft, net als bijna alle andere functies in deze library, een parameter voor het `id` van het element waar de data in terecht moet komen. Dit moet dus overeen komen met het `id`-attribuut van één van de elementen op je pagina.

## Beschikbare functies
De meeste functies verwachten een element waar tekst in kan worden geplaatst, zoals een `<p>`, een `<div>` of een `<span>`.

Een aantal functies moeten juist gebruikt worden op een afbeelding (`<img>`). Deze functies zijn gemarkeerd met `(afbeelding)`.

## Datum en tijd
Een aantal functies laten zelf niks zien, maar geven een datum en/of tijd terug. Je moet dan de volgende functies gebruiken om de informatie weer te geven op je website:
- `buienradar.date.name(id, datumEnTijd)` — Laat de naam van de week zien.
- `buienradar.date.date(id, datumEnTijd)` — Laat de datum zien (jaar-maand-dag).
- `buienradar.date.dayMonth(id, datumEnTijd)` — Laat de datum zien (maand-dag).
- `buienradar.date.time(id, datumEnTijd)` — Laat de tijd zien (uur:minuut).

Je gebruikt deze functie bijvoorbeeld als volgt om het moment van zonsopgang te laten zien:

```html
<p>
    De zon komt op om <span id="zonsopgang"></span>.
</p>

<script>
    buienradar.load(function () {
        buienradar.date.time('zonsopgang', buienradar.sunrise());
    });
</script>
```

### Algemeen
- `buienradar.map(id)` (afbeelding) — Laat een kaart met neerslag zien. 
- `buienradar.buienradar.copyright(id)` — Laat informatie zien over het auteursrecht van de informatie uit de API.
- `buienradar.buienradar.terms(id)` — Laat informatie zien over de voorwaarden waarop de informatie uit de API mag worden gebruikt.
- `buienradar.sunrise()` (datum/tijd) — Geeft het moment van zonsopgang.
- `buienradar.sunset()` (datum/tijd) — Geeft het moment van zonsondergang.

### In de buurt
Als je browser hier ondersteuning voor heeft, en je toestemming geeft, wordt de huidige locatie gebruikt voor de informatie hieronder. Zo niet, dan gebruiken we de locatie van het kantoor van Instruct.

- `buienradar.currentLocation.cityName(id)` — Laat de dichtsbijzijnde grote plaatsnaam zien.
- `buienradar.currentLocation.station.name(id)` — Laat de naam van het weerstation in de buurt zien.
- `buienradar.currentLocation.station.regio(id)` — Laat de regio van het weerstation in de buurt zien.
- `buienradar.currentLocation.icon(id)` (afbeelding) — Laat een icoon voor de weersvoorspelling zien.
- `buienradar.currentLocation.description(id)` — Laat een korte beschrijving van het huidige weer zien.
- `buienradar.currentLocation.temperature.actual(id)` — Laat de huidige temperatuur zien.
- `buienradar.currentLocation.temperature.ground(id)` — Laat de huidige grondtemperatuur zien.
- `buienradar.currentLocation.temperature.feel(id)` — Laat de huidige gevoelstemperatuur zien.

### Voor een specifiek weerstation
Deze functies zijn bijna hetzelfde als de functies voor het weerstation in de buurt, maar hebben een extra eerste parameter. Dit is het weerstationnummer van een station waarvoor je de informatie wil hebben.

- `buienradar.weatherStation.cityName(stationNummer, id)` — Laat de dichtsbijzijnde grote plaatsnaam zien.
- `buienradar.weatherStation.station.name(stationNummer, id)` — Laat de naam van het weerstation in de buurt zien.
- `buienradar.weatherStation.station.regio(stationNummer, id)` — Laat de regio van het weerstation in de buurt zien.
- `buienradar.weatherStation.icon(stationNummer, id)` (afbeelding) — Laat een icoon voor het huidige weer zien.
- `buienradar.weatherStation.description(stationNummer, id)` — Laat een korte beschrijving van het huidige weer zien.
- `buienradar.weatherStation.temperature.actual(stationNummer, id)` — Laat de huidige temperatuur zien.
- `buienradar.weatherStation.temperature.ground(stationNummer, id)` — Laat de huidige grondtemperatuur zien.
- `buienradar.weatherStation.temperature.feel(stationNummer, id)` — Laat de huidige gevoelstemperatuur zien.

### Voorspellingen
- `buienradar.forecast.report.published()` (datum/tijd) — Geeft het moment dat de voorspelling gepubliceerd is.
- `buienradar.forecast.report.title(id)` — Laat de titel van de weersvoorspelling zien.
- `buienradar.forecast.report.summary(id)` — Laat de samenvatting van de weersvoorspelling zien.
- `buienradar.forecast.report.text(id)` — Laat de weersvoorspelling zien.
- `buienradar.forecast.report.author(id)` — Laat de naam van de auteur van de weersvoorspelling zien.
- `buienradar.forecast.report.authorBio(id)` — Laat een korte biografie van de auteur van de weersvoorspelling zien.


- `buienradar.forecast.report.shortTerm.start()` (datum/tijd) — Geeft het moment waar de kortetermijnvoorspelling begint.
- `buienradar.forecast.report.shortTerm.end()` (datum/tijd) — Geeft het moment waar de kortetermijnvoorspelling eindigt.
- `buienradar.forecast.report.shortTerm.forecast(id)` — Laat een kortetermijnvoorspelling zien.


- `buienradar.forecast.report.longTerm.start()` (datum/tijd) — Geeft het moment waar de langetermijnvoorspelling begint.
- `buienradar.forecast.report.longTerm.end()` (datum/tijd) — Geeft het moment waar de langetermijnvoorspelling eindigt.
- `buienradar.forecast.report.longTerm.forecast(id)` — Laat een langetermijnvoorspelling zien.

Voor onderstaande functies geldt dat je met `dag` opgeeft voor welke dag uit de vijfdaagse voorspelling je informatie wil zien. Het gevolg is dat `dag` minimaal `1` en maximaal `5` moet zijn.

- `buienradar.forecast.fiveDays.temperature.min(id, dag)` — Laat de minimumtemperatuur voor een bepaalde dag zien.
- `buienradar.forecast.fiveDays.temperature.max(id, dag)` — Laat de maximumtemperatuur voor een bepaalde dag zien.
- `buienradar.forecast.fiveDays.rain.chance(id, dag)` — Laat de regenkans voor een bepaalde dag zien.
- `buienradar.forecast.fiveDays.rain.mmMin(id, dag)` — Laat de minimale neerslag voor een bepaalde dag zien.
- `buienradar.forecast.fiveDays.rain.mmMax(id, dag)` — Laat de maximale neerslag voor een bepaalde dag zien.
- `buienradar.forecast.fiveDays.sunChance(id, dag)` — Laat de zonkans voor een bepaalde dag zien.
- `buienradar.forecast.fiveDays.wind.direction(id, dag)` — Laat de windrichting voor een bepaalde dag zien.
- `buienradar.forecast.fiveDays.wind.speed(id, dag)` — Laat de windsnelheid voor een bepaalde dag zien.
- `buienradar.forecast.fiveDays.description(id, dag)` — Laat korte beschrijving van het weer voor een bepaalde dag zien.
- `buienradar.forecast.fiveDays.icon(id, dag)` (afbeelding) — Laat een icoon voor het weer voor een bepaalde dag zien.

### Neerslaggrafiek
De neerslag voor de komende 2 uur kun je weergeven in een grafiek. Je maakt hiervoor gebruik van de open-source JavaScript-library [Chart.js](https://chartjs.org/). Hiermee kun je op een eenvoudige manier grafieken weergeven. Deze library moet je zelf laden met een `<script>`-element:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
```

Hierna kun je de functie `buienradar.showRainChart(id)` gebruiken om een neerslaggrafiek te laten zien:

```html
<h1>Regengrafiek</h1>
<div id="regengrafiek"></div>
<script>
    buienradar.load(function () {
        buienradar.showRainChart('regengrafiek');
    });
</script>
```

## Contact

Heb je vragen over het gebruik van deze library, of over onze informaticamethode? Mail dan gerust
naar [fundament@instruct.nl](mailto:fundament@instruct.nl).