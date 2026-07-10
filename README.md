# immology – Investitionsrechnung (VoFi), Sachbearbeiter-Klickpfad

Prototyp des kompletten Sachbearbeiter-Prozesses (Dashboard → Assistent → Projekt anlegen →
Objekt IST-Zustand → Objektdaten → Erträge/Aufwendungen → Finanzierung → Szenarien analysieren →
Bericht erstellen/senden) gemäß Entwicklungs-Prompt und fachlicher Spezifikation.
**Nur UI, Navigation und Datenmodell – keine Berechnungs-Engine** (Ausnahme: Grundstückswert-Formel).

## Starten

Mit **Deno 2** (kein Node erforderlich):

```bash
deno install --allow-scripts   # einmalig: npm-Abhängigkeiten
deno task dev                  # Dev-Server (Vite)
deno task build                # Typecheck-freier Produktions-Build
deno task check                # TypeScript-Typprüfung
```

Mit **Node/npm** alternativ: `npm install && npm run dev` (Standard-Vite-Projekt).

> Hinweis: `.claude/launch.json` im übergeordneten Ordner startet den Server aus
> `/tmp/immology-run` (rsync-Kopie), weil das Preview-Panel keinen Zugriff auf den
> OneDrive-/CloudStorage-Pfad hat. Für normale Entwicklung einfach `deno task dev`
> direkt in diesem Ordner ausführen.

## Architektur

| Schicht | Ort | Zweck |
|---|---|---|
| Design-Tokens | `src/theme/tokens.css` | Alle Farben/Radien zentral (aus Klickstrecken-Screenshots gesampelt, s. u.) |
| Datenmodell | `src/types.ts` | Projekt, Objekt (Overridable-Felder), Szenario, Erträge/Aufwendungen, Darlehen, Kommentar/Aufgabe, Bericht |
| Datenschicht | `src/data/erpRepository.ts` | `ErpRepository`-Interface + Mock-Implementierung (austauschbar gegen echte ERP-API) |
| Initialdaten | `src/data/defaults.ts` | Fabriken für IST-Zustand/Szenario-Bereiche, Seed-Kommentare |
| Berechnungs-Stub | `src/calc/berechnung.ts` | `Berechnungsschicht`-Interface; **einzig echte Formel: Grundstückswert**; alle Kennzahlen/Summen/Zeitreihen sind Platzhalter |
| Zustand | `src/state/store.tsx` | In-Memory-Store (Context + useSyncExternalStore), fachliche Operationen als Methoden |
| UI-Bausteine | `src/components/` | Aufschlüsselung (wiederverwendbar), Override-Felder, Szenarien-Navigation, Kommentar-Panel, Charts, … |
| Screens | `src/screens/` | Dashboard, Assistent, Prozessschritte 1–4, Szenarien-Analyse, Berichtsansicht, Listen |

## Zentrale Geschäftsregeln (umgesetzt)

1. **ERP-Override**: ERP-vorbefüllte Felder markieren manuelle Änderungen (Label `#424761` +
   blauer Punkt); Klick auf den Punkt zeigt den ERP-Wert und bietet „Änderungen zurücksetzen".
2. **Aufschlüsselung** als wiederverwendbare Komponente (Wohnungen, Garagen/Stellplätze,
   Ertragskategorien) mit Live-Summen.
3. **Szenarien** entstehen nur durch Duplizieren mit wählbarer bereichsweiser Übernahme;
   Änderungen (auch Stepper in der Analyse) wirken isoliert pro Szenario.
4. **Kommentare** sind feldbezogen, in Aufgaben umwandelbar (Zähler im Menü „Aufgaben"),
   Klick springt zum Feld (gelbe Markierung + Popup).
5. **Rechte Navigationsleiste** je Szenario mit Schritten 1–4 + „Szenarien analysieren";
   wird durch „Kommentare" ersetzt.
6. **Berichte**: erstellen (Name vorbelegt), Blick AR/Manager/Berater, senden an Empfänger
   nach Rollen; Status wechselt sichtbar auf „Gesendet".

## Grundstückswert-Formel

`Grundstückswert = Fläche × Bodenwert × (1 + Wertsteigerung/100)^Betrachtungszeitraum`

Beispielwerte der Klickstrecke (1.245 m², 2.380 €/m², 3 %, 20 Jahre) ⇒ **5.351.688,20 €** ✓

> **ANNAHME** (in `src/calc/berechnung.ts` dokumentiert): Die in der Klickstrecke eingeblendete
> Formeldarstellung `((r^n − 1)/(r − 1))` reproduziert den dort gezeigten Beispielwert nicht;
> der dokumentierte Zielwert entspricht exakt der Zinseszins-Variante. Mit dem Fachbereich zu klären.

## Annahmen (Spezifikation Abschnitt 8, im Code mit `// ANNAHME:` markiert)

- **Erwerb/Neubau**: identische Feldstruktur wie Bestand, nur ohne Objektauswahl/ERP-Vorbefüllung.
- **Berichtsansichten AR/Manager/Berater**: identischer Inhalt, nur Titel-Präfix wechselt.
- **„Ordner oder Dokument hinzufügen"**: einfacher Datei-Anhang ohne Ordnerlogik.
- **Validierung**: minimal (Projektname, Typ, Objekt bei Bestand, Betrachtungszeitraum > 0).
- **Erstes Darlehen löschbar**, sofern eine Finanzierungsquelle bleibt (EK > 0 oder weiteres Darlehen).
- **Farben**: aus JPEG-Screenshots gesampelt; bei Zugriff auf die Figma-Datei zentral in
  `src/theme/tokens.css` korrigieren.

## Explizit außerhalb des Scopes (nur Platzhalter)

Kennzahlen/Diagramme (Stub-Werte), energetische Sanierung (nur Datenerfassung), Assistent-Zweige
„Analysieren"/„Berichten", Direkteinstieg „Manuell", Freigabe-Workflow nach Versand,
Rollen-Ansichten, „Detailplanung"-Buttons, Risikomanagement/Berichtsvorlagendesigner/Klimapfad/
Unternehmensplanung/ESG (Deko).
