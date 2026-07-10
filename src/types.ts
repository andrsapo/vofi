/**
 * Zentrales Datenmodell des Sachbearbeiter-Prozesses (siehe Entwicklungs-Prompt,
 * Abschnitt "Datenmodell"). Reine UI-/Navigations-/Daten-Ausbaustufe ohne
 * Berechnungs-Engine.
 */

export type Rolle = 'Sachbearbeiter' | 'Manager' | 'Berater' | 'AR' | 'Administrator'

export interface Person {
  id: string
  name: string
  rolle: Rolle
  initialen: string
  /** Avatar-Hintergrundfarbe */
  farbe: string
  istAdmin?: boolean
  bio?: string
  fachgebiet?: string
  standort?: string
  sprachen?: string
  email?: string
  telefon?: string
  linkedin?: string
  /** Hochgeladenes Profilbild als Data-URL */
  avatarUrl?: string
  /** Ist im Beraterteam-Block favorisiert */
  favorisiert?: boolean
}

export type Investitionsart = 'Bestand' | 'Erwerb' | 'Neubau'

export type ProjektStatus = 'In Bearbeitung' | 'Beschlussreif' | 'Beschlossen'

export interface Projekt {
  id: string
  name: string
  beschreibung: string
  typ: string
  /** Nur bei Investitionsart "Bestand" gesetzt */
  objektId: string | null
  betrachtungszeitraumJahre: number
  inflationaereKostensteigerungProzent: number
  zugangsberechtigteIds: string[]
  titelbildUrl?: string
  status: ProjektStatus
  investitionsart: Investitionsart
  erstelltAm: string
  aktualisiertAm?: string
}

/**
 * ERP-vorbefüllbares Feld: `erp` hält den ursprünglichen ERP-Wert
 * (null bei Erwerb/Neubau ohne ERP-Quelle), `wert` den aktuell gültigen Wert.
 * Überschrieben = erp !== null && wert !== erp. Manuelle Werte haben Vorrang
 * in allen nachgelagerten Anzeigen/Stub-Berechnungen.
 */
export interface Overridable<T> {
  erp: T | null
  wert: T
}

/** Arbeitskopie "Objekt IST-Zustand" je Projekt (konstant über alle Szenarien) */
export interface ObjektIst {
  objektId: string | null
  name: Overridable<string>
  adresse: Overridable<string>
  baujahr: Overridable<number>
  anzahlWohneinheiten: Overridable<number>
  nutzflaecheWohnen: Overridable<number>
  anzahlGewerbeeinheiten: Overridable<number>
  nutzflaecheGewerbe: Overridable<number>
  anzahlGaragenStellplaetze: Overridable<number>
  grundUndBoden: Overridable<number>
  gebaeudeInklNebenkosten: Overridable<number>
  ausstattung: Overridable<number>
  anschaffungsHerstellungskosten: Overridable<number>
  rndJahre: Overridable<number>
  energieeffizienzklasse: Overridable<string>
  co2AusstossKgM2a: Overridable<number>
  jahresnettokaltmiete: Overridable<number>
  durchschnittlicheM2Miete: Overridable<number>
  mietausfallProzent: Overridable<number>
  leerstandMonate: Overridable<number>
}

export type ObjektIstFeldKey = Exclude<keyof ObjektIst, 'objektId'>

/** Zeile der wiederverwendbaren Aufschlüsselungs-Mechanik */
export interface KategoriePosition {
  id: string
  bezeichnung: string
  anzahl: number
  /** Nur bei Flächen-Aufschlüsselung (Wohnungen) gepflegt */
  flaeche: number | null
}

export interface AufschluesselungsState {
  aufgeschluesselt: boolean
  positionen: KategoriePosition[]
}

export interface SanierungsPosition {
  aktiv: boolean
  menge: number
}

/** Schritt 2 – Objektdaten (je Szenario) */
export interface Objektdaten {
  wohnungen: AufschluesselungsState
  garagenStellplaetze: AufschluesselungsState
  investition: {
    grundUndBoden: number
    gebaeudeInklNebenkosten: number
    ausstattung: number
    direkterBaukostenzuschuss: number
    tilgungszuschussNachlass: number
    nichtAktivierbareKosten: number
  }
  restnutzungsdauer: {
    gebaeudeJahre: number
    aussenanlagenJahre: number
    ausstattungJahre: number
    beurteilungszeitraumJahre: number
  }
  grundstueck: {
    flaecheM2: number
    bodenwertEurM2: number
    wertsteigerungProzent: number
  }
  energetischeSanierung: {
    aktiv: boolean
    wdvs: SanierungsPosition
    pvAnlage: SanierungsPosition
    fenstertausch: SanierungsPosition
    dachdaemmung: SanierungsPosition
    kellerdaemmung: SanierungsPosition
  }
}

/** Ertragskategorie (Sollmieten) – strukturell identisch zur Aufschlüsselung */
export interface ErtragsPosition {
  id: string
  titel: string
  /** monatliche Sollmiete */
  satz: number
  satzEinheit: '€/m²' | '€'
  /** Mietausfall p. a. in % der Sollmiete (nicht bei Garagen/Stellplätzen) */
  mietausfallProzent: number | null
  steigerung: number
  steigerungEinheit: '€/m²' | '%' | '€'
  turnusJahre: number
  /** Vom Nutzer ergänzte Kategorien sind löschbar, die drei Standardkategorien nicht */
  loeschbar: boolean
}

export interface ErtraegeAufwendungen {
  sollmieten: ErtragsPosition[]
  /** Toggle "Aufschlüsseln" (Folie 21): AUS = aggregierte Sammelkategorie,
   *  EIN = einzelne Sollmieten-Kategorien sichtbar. Werte bleiben in beiden
   *  Modi erhalten; der Toggle steuert nur die Darstellung. */
  sollmietenAufgeschluesselt: boolean
  instandhaltung: {
    modus: 'staffel' | 'linear'
    staffel: {
      von1bis5: number
      von6bis10: number
      von11bis15: number
      von16bis20: number
      ab20: number
    }
    linearEurM2: number
  }
  verwaltungskostenJeEinheit: number
}

export interface Zinsbindungsphase {
  id: string
  reihenfolge: number
  zinsbindungJahre: number
  zinssatzProzent: number
  tilgungssatzProzent: number
}

export interface Foerderdarlehen {
  bezugsgroesse: string
  tilgungsnachlassProzent: number
  verrechnungMitDarlehenImJahr: number
  verrechnungMitHerstellungskosten: string
}

export interface Darlehen {
  id: string
  typ: 'Annuitaet'
  nominalbetrag: number
  tilgungsfreieAnlaufjahre: number
  bearbeitungsentgeltProzent: number
  zinsbindungsphasen: Zinsbindungsphase[]
  /** Förderdarlehen-Toggle: getrennt verwaltet, aber in Gesamtfinanzierung eingerechnet */
  foerderdarlehen: Foerderdarlehen | null
}

export interface Finanzierung {
  eigenkapitalProzent: number
  darlehen: Darlehen[]
}

/** Bereichsdaten eines Szenarios (Schritte 2–4; Schritt 1 ist projektweit) */
export interface SzenarioDaten {
  objektdaten: Objektdaten
  ertraegeAufwendungen: ErtraegeAufwendungen
  finanzierung: Finanzierung
  /** Anwender-Overrides für einzelne Auswertungszeilen (key → formatierter
   *  String). Ist ein Wert hier gesetzt, überschreibt er die berechnete
   *  Anzeige. Erst durch das Setzen (nicht durch das reine Kopieren)
   *  weichen kopierte Szenarien in der Auswertung von der Basis ab. */
  auswertungOverrides?: Record<string, string>
}

export interface Szenario {
  id: string
  projektId: string
  name: string
  istBasis: boolean
  quellSzenarioId?: string
  uebernommeneBereiche: {
    objektdaten: boolean
    ertraegeUndAufwendungen: boolean
    finanzierung: boolean
  }
}

export type ProzessSchritt = 1 | 2 | 3 | 4

/** Feldbezug eines Kommentars: Szenario + Prozessschritt + Feldschlüssel.
 *  Erweiterung Ticket "Feldbezogene Kommentare und Aufgaben": zusätzlich
 *  wird der `Block` (z. B. "Investition") gespeichert – für die Anzeige im
 *  Kommentar-Popup und die Metadaten in der rechten Kommentarleiste. */
export interface FeldReferenz {
  szenarioId: string
  schritt: ProzessSchritt
  feldKey: string
  /** Anzeige wie im Mockup, z. B. "Basis/Objektdaten" */
  bereichLabel: string
  /** Optional: fachlicher Block innerhalb des Schritts, z. B.
   *  "Investition", "Restnutzungsdauer", "Sollmieten 1 …". */
  blockLabel?: string
  /** Optional: menschenlesbarer Feldname (nicht nur der Key), z. B.
   *  "Grund und Boden". Fällt zurück auf `feldKey`, wenn nicht gesetzt. */
  feldLabel?: string
}

export type AufgabenStatus = 'Offen' | 'In Bearbeitung' | 'Erledigt'

export interface KommentarAufgabe {
  id: string
  nr: number
  projektId: string
  feldReferenz?: FeldReferenz
  autorId: string
  text: string
  zeitstempel: string
  typ: 'Kommentar' | 'Aufgabe'
  aufgabenstatus?: AufgabenStatus
  zugewiesenAnId?: string
  /** Antworten verweisen auf den Wurzel-Kommentar */
  parentId?: string
  /** Wird "true", sobald der Benutzer die Aufgabe geöffnet hat.
   *  Steuert den Zähler-Badge in der Sidebar. */
  isRead?: boolean
  readAt?: string
  /** Ticket "Feldbezogene Kommentare und Aufgaben" (Punkte 2, 10, 11):
   *  Der formatierte Feldwert zum Zeitpunkt der Erstellung wird gespeichert
   *  ("kommentierter Wert"). Bleibt auch dann erhalten, wenn das Feld
   *  später geändert wird – im Popup werden dann kommentierter und
   *  aktueller Wert nebeneinander gezeigt. Nur bei Kommentaren/Aufgaben
   *  mit Feldbezug gesetzt. */
  valueAtCreation?: string
}

export type BerichtStatus =
  | 'In Bearbeitung'
  | 'Entwurf'
  | 'Diskutiert'
  | 'Beschlussreif'
  | 'Beschlossen'
  | 'Gesendet'
  | 'Archiviert'

export interface BerichtAnhang {
  id: string
  name: string
  groesseBytes: number
}

export interface Bericht {
  id: string
  projektId: string
  name: string
  einbezogeneSzenarien: string[]
  status: BerichtStatus
  empfaenger: { personId: string; rolle: Rolle }[]
  anhaenge: BerichtAnhang[]
  erstelltAm: string
  /** Autor (Nutzer-ID), wird beim Erzeugen gesetzt. */
  autorId?: string
  /** Version des Berichts – zunächst statisch 1, vorbereitet für spätere
   *  Versionierung (Ticket "Nächster sinnvoller Schritt"). */
  version?: number
  /** Freitext-Inhalt des Berichts (Kommentare, Anmerkungen etc.). */
  inhalt?: string
  /** Wird "true", sobald der Benutzer den Bericht geöffnet hat.
   *  Steuert den Zähler-Badge in der Sidebar. */
  isRead?: boolean
  readAt?: string
  /** Dekorative Alt-Einträge aus der Mock-Datenbasis (nicht Teil des Klickpfads) */
  istDemo?: boolean
}

/** Interne Navigation (bewusst ohne Router-Bibliothek gehalten) */
export type Route =
  | { view: 'dashboard' }
  | { view: 'assistent' }
  | { view: 'projekt'; projektId: string; szenarioId: string; schritt: ProzessSchritt }
  | { view: 'analyse'; projektId: string }
  | { view: 'bericht'; berichtId: string }
  | { view: 'berichte' }
  | { view: 'aufgaben' }
