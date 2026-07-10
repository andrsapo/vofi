/**
 * Fabrikfunktionen: Initialdaten für Objekt IST-Zustand und Szenario-Bereiche.
 * Bei "Bestand" werden die Werte aus dem ERP-Mock vorbefüllt, bei Erwerb/Neubau
 * leer initialisiert (ANNAHME laut Spezifikation Abschnitt 8: identische
 * Feldstruktur wie Bestand, nur ohne ERP-Quelle/Objektauswahl).
 */

import type {
  Investitionsart,
  ObjektIst,
  Objektdaten,
  ErtraegeAufwendungen,
  Finanzierung,
  Overridable,
  SzenarioDaten,
  KommentarAufgabe,
} from '../types'
import type { ErpObjekt } from './erpRepository'
import { neueId } from '../utils/format'

function mitErp<T>(wert: T): Overridable<T> {
  return { erp: wert, wert }
}

function ohneErp<T>(wert: T): Overridable<T> {
  return { erp: null, wert }
}

export function erzeugeObjektIst(art: Investitionsart, erp: ErpObjekt | undefined): ObjektIst {
  if (art === 'Bestand' && erp) {
    return {
      objektId: erp.id,
      name: mitErp(erp.name),
      adresse: mitErp(erp.adresse),
      baujahr: mitErp(erp.baujahr),
      anzahlWohneinheiten: mitErp(erp.anzahlWohneinheiten),
      nutzflaecheWohnen: mitErp(erp.nutzflaecheWohnen),
      anzahlGewerbeeinheiten: mitErp(erp.anzahlGewerbeeinheiten),
      nutzflaecheGewerbe: mitErp(erp.nutzflaecheGewerbe),
      anzahlGaragenStellplaetze: mitErp(erp.anzahlGaragenStellplaetze),
      grundUndBoden: mitErp(erp.grundUndBoden),
      gebaeudeInklNebenkosten: mitErp(erp.gebaeudeInklNebenkosten),
      ausstattung: mitErp(erp.ausstattung),
      anschaffungsHerstellungskosten: mitErp(erp.anschaffungsHerstellungskosten),
      rndJahre: mitErp(erp.rndJahre),
      energieeffizienzklasse: mitErp(erp.energieeffizienzklasse),
      co2AusstossKgM2a: mitErp(erp.co2AusstossKgM2a),
      jahresnettokaltmiete: mitErp(erp.jahresnettokaltmiete),
      durchschnittlicheM2Miete: mitErp(erp.durchschnittlicheM2Miete),
      mietausfallProzent: mitErp(erp.mietausfallProzent),
      leerstandMonate: mitErp(erp.leerstandMonate),
    }
  }
  // ANNAHME: Erwerb/Neubau – gleiche Felder, ohne ERP-Vorbefüllung.
  return {
    objektId: null,
    name: ohneErp(''),
    adresse: ohneErp(''),
    baujahr: ohneErp(new Date().getFullYear()),
    anzahlWohneinheiten: ohneErp(0),
    nutzflaecheWohnen: ohneErp(0),
    anzahlGewerbeeinheiten: ohneErp(0),
    nutzflaecheGewerbe: ohneErp(0),
    anzahlGaragenStellplaetze: ohneErp(0),
    grundUndBoden: ohneErp(0),
    gebaeudeInklNebenkosten: ohneErp(0),
    ausstattung: ohneErp(0),
    anschaffungsHerstellungskosten: ohneErp(0),
    rndJahre: ohneErp(0),
    energieeffizienzklasse: ohneErp('B'),
    co2AusstossKgM2a: ohneErp(0),
    jahresnettokaltmiete: ohneErp(0),
    durchschnittlicheM2Miete: ohneErp(0),
    mietausfallProzent: ohneErp(0),
    leerstandMonate: ohneErp(0),
  }
}

export function erzeugeObjektdaten(objektIst: ObjektIst): Objektdaten {
  const wohneinheiten = objektIst.anzahlWohneinheiten.wert
  const wohnflaeche = objektIst.nutzflaecheWohnen.wert
  const garagen = objektIst.anzahlGaragenStellplaetze.wert
  return {
    wohnungen: {
      aufgeschluesselt: false,
      // Aufschlüsselung wie Folie 13: frei finanziert / öffentlich gefördert
      positionen: [
        {
          id: neueId('kat'),
          bezeichnung: 'Wohnungen freifinanziert',
          anzahl: Math.max(wohneinheiten - 2, wohneinheiten > 0 ? 1 : 0),
          flaeche: Math.round(wohnflaeche * 0.64),
        },
        {
          id: neueId('kat'),
          bezeichnung: 'Wohnungen öffentlich gefördert',
          anzahl: wohneinheiten > 0 ? Math.min(2, wohneinheiten) : 0,
          flaeche: Math.round(wohnflaeche * 0.36),
        },
      ],
    },
    garagenStellplaetze: {
      aufgeschluesselt: false,
      positionen: [
        { id: neueId('kat'), bezeichnung: 'Garagen', anzahl: Math.min(3, garagen), flaeche: null },
        { id: neueId('kat'), bezeichnung: 'Stellplätze', anzahl: Math.max(garagen - 3, 0), flaeche: null },
      ],
    },
    investition: {
      grundUndBoden: objektIst.grundUndBoden.wert,
      gebaeudeInklNebenkosten: objektIst.gebaeudeInklNebenkosten.wert,
      ausstattung: objektIst.ausstattung.wert,
      direkterBaukostenzuschuss: 0,
      tilgungszuschussNachlass: 0,
      nichtAktivierbareKosten: 6763.62,
    },
    restnutzungsdauer: {
      gebaeudeJahre: 30,
      aussenanlagenJahre: 0,
      ausstattungJahre: 3,
      beurteilungszeitraumJahre: 5,
    },
    grundstueck: {
      // Bei Bestand aus dem ERP-Mock (Herdweg 52: 1.245 m² / 2.380 €/m², Folie 19)
      flaecheM2: 0,
      bodenwertEurM2: 0,
      wertsteigerungProzent: 3,
    },
    energetischeSanierung: {
      aktiv: false,
      wdvs: { aktiv: false, menge: 0 },
      pvAnlage: { aktiv: false, menge: 0 },
      fenstertausch: { aktiv: false, menge: 0 },
      dachdaemmung: { aktiv: false, menge: 0 },
      kellerdaemmung: { aktiv: false, menge: 0 },
    },
  }
}

/** Leerer Startzustand für Objektdaten – wird verwendet, wenn beim Anlegen
 *  eines neuen Szenarios der Bereich "Objektdaten" nicht aus dem
 *  Basisszenario übernommen wird. Alle numerischen Felder starten bei 0,
 *  Aufschlüsselungen sind leer. */
export function erzeugeLeereObjektdaten(): Objektdaten {
  return {
    wohnungen: { aufgeschluesselt: false, positionen: [] },
    garagenStellplaetze: { aufgeschluesselt: false, positionen: [] },
    investition: {
      grundUndBoden: 0,
      gebaeudeInklNebenkosten: 0,
      ausstattung: 0,
      direkterBaukostenzuschuss: 0,
      tilgungszuschussNachlass: 0,
      nichtAktivierbareKosten: 0,
    },
    restnutzungsdauer: {
      gebaeudeJahre: 0,
      aussenanlagenJahre: 0,
      ausstattungJahre: 0,
      beurteilungszeitraumJahre: 0,
    },
    grundstueck: { flaecheM2: 0, bodenwertEurM2: 0, wertsteigerungProzent: 0 },
    energetischeSanierung: {
      aktiv: false,
      wdvs: { aktiv: false, menge: 0 },
      pvAnlage: { aktiv: false, menge: 0 },
      fenstertausch: { aktiv: false, menge: 0 },
      dachdaemmung: { aktiv: false, menge: 0 },
      kellerdaemmung: { aktiv: false, menge: 0 },
    },
  }
}

export function erzeugeErtraegeAufwendungen(): ErtraegeAufwendungen {
  return {
    sollmietenAufgeschluesselt: true,
    sollmieten: [
      {
        id: neueId('ep'),
        titel: 'Sollmieten 1: Wohnungen freifinanziert',
        satz: 15.6,
        satzEinheit: '€/m²',
        mietausfallProzent: 2,
        steigerung: 5,
        steigerungEinheit: '€/m²',
        turnusJahre: 3,
        loeschbar: false,
      },
      {
        id: neueId('ep'),
        titel: 'Sollmieten 2: Wohnungen öffentlich gefördert',
        satz: 8.9,
        satzEinheit: '€/m²',
        mietausfallProzent: 2,
        steigerung: 5,
        steigerungEinheit: '€/m²',
        turnusJahre: 3,
        loeschbar: false,
      },
      {
        id: neueId('ep'),
        titel: 'Sollmieten 3: Garagen / Stellplätze Miete',
        satz: 2.99,
        satzEinheit: '€',
        mietausfallProzent: null,
        steigerung: 5,
        steigerungEinheit: '%',
        turnusJahre: 3,
        loeschbar: false,
      },
    ],
    instandhaltung: {
      modus: 'staffel',
      staffel: { von1bis5: 2, von6bis10: 5, von11bis15: 10, von16bis20: 12.5, ab20: 15 },
      linearEurM2: 9,
    },
    verwaltungskostenJeEinheit: 300,
  }
}

export function erzeugeFinanzierung(): Finanzierung {
  return {
    eigenkapitalProzent: 50,
    darlehen: [
      {
        id: neueId('dar'),
        typ: 'Annuitaet',
        nominalbetrag: 390000,
        tilgungsfreieAnlaufjahre: 0,
        bearbeitungsentgeltProzent: 0,
        zinsbindungsphasen: [
          { id: neueId('zbp'), reihenfolge: 1, zinsbindungJahre: 0, zinssatzProzent: 0, tilgungssatzProzent: 0 },
        ],
        foerderdarlehen: null,
      },
    ],
  }
}

/** Leerer Startzustand für Erträge/Aufwendungen – wird verwendet, wenn beim
 *  Anlegen eines neuen Szenarios der Bereich "Erträge und Aufwendungen"
 *  bewusst NICHT aus dem Basisszenario übernommen wird. Struktur bleibt
 *  identisch, aber alle Zahlenfelder starten leer (0). */
export function erzeugeLeereErtraegeAufwendungen(): ErtraegeAufwendungen {
  return {
    sollmietenAufgeschluesselt: true,
    sollmieten: [],
    instandhaltung: {
      modus: 'staffel',
      staffel: { von1bis5: 0, von6bis10: 0, von11bis15: 0, von16bis20: 0, ab20: 0 },
      linearEurM2: 0,
    },
    verwaltungskostenJeEinheit: 0,
  }
}

/** Leerer Startzustand für Finanzierung – analog zu oben. */
export function erzeugeLeereFinanzierung(): Finanzierung {
  return {
    eigenkapitalProzent: 0,
    darlehen: [],
  }
}

export function erzeugeSzenarioDaten(objektIst: ObjektIst, erp: ErpObjekt | undefined): SzenarioDaten {
  const objektdaten = erzeugeObjektdaten(objektIst)
  if (erp) {
    objektdaten.grundstueck.flaecheM2 = erp.grundstuecksflaecheM2
    objektdaten.grundstueck.bodenwertEurM2 = erp.bodenwertEurM2
  }
  return {
    objektdaten,
    ertraegeAufwendungen: erzeugeErtraegeAufwendungen(),
    finanzierung: erzeugeFinanzierung(),
  }
}

/**
 * Seed-Kommentare/-Aufgaben angelehnt an die Klickstrecke (Folien 14–17).
 * Sie werden beim Anlegen eines Projekts erzeugt, damit die Kommentarliste der
 * Projektbeteiligten (Sachbearbeiter, Manager, Berater) gefüllt ist.
 */
export function erzeugeSeedKommentare(projektId: string, basisSzenarioId: string): KommentarAufgabe[] {
  const refGrund = {
    szenarioId: basisSzenarioId,
    schritt: 2 as const,
    feldKey: 'investition.grundUndBoden',
    bereichLabel: 'Basis/Objektdaten',
  }
  const grundThread: KommentarAufgabe = {
    id: neueId('kom'),
    nr: 10,
    projektId,
    feldReferenz: refGrund,
    autorId: 'p-anna',
    text: 'Diese Daten müssen mit der Tabelle aus unseren früheren Berichten abgeglichen werden, da es hier einen Fehler zu geben scheint',
    zeitstempel: '2023-10-27T08:56:00',
    typ: 'Kommentar',
  }
  return [
    {
      id: neueId('kom'),
      nr: 11,
      projektId,
      feldReferenz: { szenarioId: basisSzenarioId, schritt: 2, feldKey: 'investition.gebaeudeInklNebenkosten', bereichLabel: 'Basis/Objektdaten' },
      autorId: 'p-herbert',
      text: 'Die Mietsteigerungen erscheinen mir in der Realität nicht durchsetzbar.',
      zeitstempel: '2023-11-01T12:30:00',
      typ: 'Aufgabe',
      aufgabenstatus: 'Erledigt',
      zugewiesenAnId: 'p-anna',
    },
    grundThread,
    {
      id: neueId('kom'),
      nr: 10,
      projektId,
      feldReferenz: refGrund,
      autorId: 'p-herbert',
      text: 'Bitte sagen Sie mir, wo ich diese Daten sehen kann',
      zeitstempel: '2023-10-27T11:32:00',
      typ: 'Kommentar',
      parentId: grundThread.id,
    },
    {
      id: neueId('kom'),
      nr: 10,
      projektId,
      feldReferenz: refGrund,
      autorId: 'p-anna',
      text: 'Sie finden hilfreiche Informationen hier: https://docs.google.com/spreadsheets/d/1ROWhpRGBs1',
      zeitstempel: '2023-10-27T16:13:00',
      typ: 'Kommentar',
      parentId: grundThread.id,
    },
    {
      id: neueId('kom'),
      nr: 9,
      projektId,
      feldReferenz: { szenarioId: basisSzenarioId, schritt: 2, feldKey: 'investition.tilgungszuschussNachlass', bereichLabel: 'Basis/Objektdaten' },
      autorId: 'p-anna',
      text: 'Bitte Prüfen Sie noch mal den Tilgungszuschuss. Gibt nicht wieder welche im neuen KfW-Programm?',
      zeitstempel: '2023-11-01T12:30:00',
      typ: 'Aufgabe',
      aufgabenstatus: 'In Bearbeitung',
      zugewiesenAnId: 'p-herbert',
    },
    {
      id: neueId('kom'),
      nr: 8,
      projektId,
      feldReferenz: { szenarioId: basisSzenarioId, schritt: 4, feldKey: 'finanzierung.eigenkapital', bereichLabel: 'Basis/Finanzierung' },
      autorId: 'p-robert',
      text: 'Wieso ist der Betrachtungszeitraum auf 30 Jahre eingestellt?',
      zeitstempel: '2023-11-01T12:30:00',
      typ: 'Kommentar',
    },
  ]
}
