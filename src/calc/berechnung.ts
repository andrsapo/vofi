/**
 * Austauschbare Berechnungsschicht.
 *
 * In dieser Ausbaustufe ist AUSSCHLIESSLICH die Grundstückswert-Formel fachlich
 * implementiert (einzige im Mockup dokumentierte Berechnung). Alle übrigen
 * Kennzahlen, Summen und Zeitreihen sind Platzhalter-/Stub-Werte: Sie kommen aus
 * `StubBerechnung` und können später durch eine echte VoFi-Engine ersetzt
 * werden, ohne dass sich die UI ändert (nur diese Datei austauschen bzw. eine
 * andere Implementierung von `Berechnungsschicht` injizieren).
 */

import type { Objektdaten, Projekt, SzenarioDaten } from '../types'

export interface KennzahlWert {
  key: string
  label: string
  /** eingerückte Nebenkennzahl (wie "Interner Zinsfuß" im Mockup) */
  sekundaer?: boolean
  formatiert: string
}

export interface ErtragsSumme {
  erstesJahr: number
  gesamterZeitraum: number
}

export interface Berechnungsschicht {
  /** ECHTE Formel (Akzeptanzkriterium): Grundstückswert am Ende des Betrachtungszeitraums */
  grundstueckswertAmEnde(
    flaecheM2: number,
    bodenwertEurM2: number,
    wertsteigerungProzent: number,
    betrachtungszeitraumJahre: number,
  ): number

  /** Stub: Investitionssumme (Summe der Investitionsfelder aus Schritt 2) */
  investitionssumme(daten: Objektdaten): number
  /** Stub: "Investition ohne Grundstück vor Zuschüssen je m²" */
  investitionOhneGrundstueckJeM2(daten: Objektdaten): number
  /** Stub: "Durchschnittliche Wohn-/Nutzfläche" */
  durchschnittlicheWohnNutzflaeche(daten: Objektdaten): number

  /** Stub: Kopfzahlen einer Ertrags-/Aufwandsspalte in Schritt 3 */
  ertragsSummeJeKategorie(satz: number, index: number, jahre: number): ErtragsSumme
  aufwandsSummeInstandhaltung(daten: SzenarioDaten, jahre: number): ErtragsSumme
  aufwandsSummeVerwaltung(daten: SzenarioDaten, jahre: number): ErtragsSumme
  ertraegeGesamt(daten: SzenarioDaten, jahre: number): ErtragsSumme
  aufwendungenGesamt(daten: SzenarioDaten, jahre: number): ErtragsSumme

  /** Stub: berechneter Tilgungsnachlass-Betrag eines Förderdarlehens */
  foerderTilgungsnachlassBetrag(nominalbetrag: number, nachlassProzent: number): number

  /** Stub: Kennzahlen der Auswertungstabelle (Szenarien analysieren / Bericht) */
  kennzahlen(projekt: Projekt, daten: SzenarioDaten, szenarioIndex: number): KennzahlWert[]

  /** Stub: Zeitreihen für die Diagramme (Jahresergebnisse / Cashflows) */
  jahresergebnisse(szenarioIndex: number, jahre: number): number[]
  cashflows(szenarioIndex: number, jahre: number): number[]
  /** Stub: Balkendiagramm-Werte je Szenario */
  eigenkapitalrendite(szenarioIndex: number): number
  endwert(szenarioIndex: number): number
}

import { formatEuro, formatZahl } from '../utils/format'

class StubBerechnung implements Berechnungsschicht {
  grundstueckswertAmEnde(
    flaecheM2: number,
    bodenwertEurM2: number,
    wertsteigerungProzent: number,
    betrachtungszeitraumJahre: number,
  ): number {
    // ANNAHME: Die in der Klickstrecke (Folie 20) eingeblendete Formeldarstellung
    // "Fläche · Bodenwert · ((r^n − 1) / (r − 1))" mit r = Wertsteigerung/100
    // reproduziert den dort gezeigten Beispielwert NICHT (sie ergäbe für
    // 1.245 m² · 2.380 €/m² · 3 % · 20 Jahre ≈ 3.054.742 €). Der im Mockup und
    // in den Akzeptanzkriterien dokumentierte Zielwert 5.351.688,20 € entspricht
    // exakt der Zinseszins-Aufzinsung Fläche · Bodenwert · (1 + r)^n.
    // Umgesetzt ist daher die Zinseszins-Variante; mit dem Fachbereich zu klären.
    const r = wertsteigerungProzent / 100
    return flaecheM2 * bodenwertEurM2 * Math.pow(1 + r, betrachtungszeitraumJahre)
  }

  investitionssumme(daten: Objektdaten): number {
    // Stub: einfache Summe der Investitionseingaben abzüglich Zuschüsse.
    const i = daten.investition
    return (
      i.grundUndBoden +
      i.gebaeudeInklNebenkosten +
      i.ausstattung +
      i.nichtAktivierbareKosten -
      i.direkterBaukostenzuschuss -
      i.tilgungszuschussNachlass
    )
  }

  investitionOhneGrundstueckJeM2(daten: Objektdaten): number {
    const flaeche = this.gesamtflaeche(daten)
    if (flaeche <= 0) return 0
    const i = daten.investition
    return (i.gebaeudeInklNebenkosten + i.ausstattung + i.nichtAktivierbareKosten) / flaeche
  }

  durchschnittlicheWohnNutzflaeche(daten: Objektdaten): number {
    const anzahl = daten.wohnungen.positionen.reduce((s, p) => s + p.anzahl, 0)
    if (anzahl <= 0) return 0
    return this.gesamtflaeche(daten) / anzahl
  }

  private gesamtflaeche(daten: Objektdaten): number {
    return daten.wohnungen.positionen.reduce((s, p) => s + (p.flaeche ?? 0), 0)
  }

  ertragsSummeJeKategorie(satz: number, index: number, jahre: number): ErtragsSumme {
    // Stub: grobe Skalierung des Eingabewerts, damit Eingriffe sichtbar reagieren.
    const erstesJahr = Math.round(satz * 12 * (12 + index * 8))
    return { erstesJahr, gesamterZeitraum: erstesJahr * jahre * 1.24 }
  }

  aufwandsSummeInstandhaltung(daten: SzenarioDaten, jahre: number): ErtragsSumme {
    const s = daten.ertraegeAufwendungen.instandhaltung
    const satz =
      s.modus === 'linear'
        ? s.linearEurM2
        : (s.staffel.von1bis5 + s.staffel.von6bis10 + s.staffel.von11bis15 + s.staffel.von16bis20 + s.staffel.ab20) / 5
    const erstesJahr = -Math.round(satz * 144.6 * 1)
    return { erstesJahr, gesamterZeitraum: erstesJahr * jahre }
  }

  aufwandsSummeVerwaltung(daten: SzenarioDaten, jahre: number): ErtragsSumme {
    const erstesJahr = -Math.round(daten.ertraegeAufwendungen.verwaltungskostenJeEinheit * 4.36)
    return { erstesJahr, gesamterZeitraum: erstesJahr * jahre }
  }

  ertraegeGesamt(daten: SzenarioDaten, jahre: number): ErtragsSumme {
    const summen = daten.ertraegeAufwendungen.sollmieten.map((p, i) =>
      this.ertragsSummeJeKategorie(p.satz, i, jahre),
    )
    return {
      erstesJahr: summen.reduce((s, x) => s + x.erstesJahr, 0),
      gesamterZeitraum: summen.reduce((s, x) => s + x.gesamterZeitraum, 0),
    }
  }

  aufwendungenGesamt(daten: SzenarioDaten, jahre: number): ErtragsSumme {
    const a = this.aufwandsSummeInstandhaltung(daten, jahre)
    const b = this.aufwandsSummeVerwaltung(daten, jahre)
    return {
      erstesJahr: a.erstesJahr + b.erstesJahr,
      gesamterZeitraum: a.gesamterZeitraum + b.gesamterZeitraum,
    }
  }

  foerderTilgungsnachlassBetrag(nominalbetrag: number, nachlassProzent: number): number {
    return (nominalbetrag * nachlassProzent) / 100
  }

  kennzahlen(projekt: Projekt, daten: SzenarioDaten, _szenarioIndex: number): KennzahlWert[] {
    // Stub-Kennzahlen: Werte werden ausschließlich aus den Szenario-Daten
    // abgeleitet, damit zwei Szenarien mit identischen Eingaben (z. B. direkt
    // nach dem Kopieren) auch identische Auswertungswerte zeigen. Änderungen
    // an Eingabefeldern (Sollmieten, EK-Anteil, Instandhaltung usw.) wirken
    // deterministisch auf die Kennzahlen.
    const investition = this.investitionssumme(daten.objektdaten)
    const ekProzent = daten.finanzierung.eigenkapitalProzent
    // Grober Ertrags-/Aufwands-Delta gegenüber Referenz (aus Sollmieten und
    // Instandhaltungs-Staffelung). Reine Platzhalter-Heuristik – wird später
    // durch die echte VoFi-Berechnung ersetzt.
    const sollmietenSumme = daten.ertraegeAufwendungen.sollmieten.reduce((s, p) => s + p.satz, 0)
    const instand = daten.ertraegeAufwendungen.instandhaltung
    const instandSumme =
      instand.modus === 'linear'
        ? instand.linearEurM2 * 5
        : instand.staffel.von1bis5 +
          instand.staffel.von6bis10 +
          instand.staffel.von11bis15 +
          instand.staffel.von16bis20 +
          instand.staffel.ab20
    // Delta = 0, solange Werte den Basis-Defaultwerten entsprechen; erst
    // Bearbeitungen im Szenario lassen die Auswertungswerte auseinanderlaufen.
    const delta = (sollmietenSumme - 24.5) * 0.1 - (instandSumme - 44.5) * 0.02 + (ekProzent - 50) * 0.01
    return [
      { key: 'betrachtungszeitraum', label: 'Betrachtungszeitraum', formatiert: `${projekt.betrachtungszeitraumJahre} Jahre` },
      { key: 'ekRendite', label: 'Eigenkapital-Rendite p.a.', formatiert: `${formatZahl(1.78 + delta)} %` },
      { key: 'planungsreserve', label: 'Planungsreserve/-ziel', formatiert: formatEuro(-258537 + delta * 50000, 0) },
      { key: 'ekEinsatz', label: 'Eigenkapitaleinsatz', formatiert: `${formatZahl(ekProzent, 0)}%` },
      { key: 'kapitalwert', label: 'Kapitalwert (bei 2% Rendite)', formatiert: formatEuro(-515000 + delta * 45000, 0) },
      { key: 'zinsfuss', label: 'Interner Zinsfuß', sekundaer: true, formatiert: `${formatZahl(0.7 + delta * 0.5, 1)} %` },
      { key: 'amortisation', label: 'Amortisationszeitpunkt', formatiert: `Jahr ${Math.max(1, Math.round(43 - delta * 12))}` },
      { key: 'apAbschreibungen', label: 'Notwendige a.p. Abschreibungen', formatiert: formatEuro(0, 0) },
      { key: 'drohverlust', label: 'Drohverlustrückstellungsbedarf', formatiert: formatEuro(0, 0) },
      { key: 'investitionsvolumen', label: 'Investitionsvolumen', formatiert: formatEuro(investition, 0) },
      { key: 'dcf', label: 'DCF-Wert (einschl. Grundstück)', formatiert: formatEuro(Math.round(1401 + delta * 500), 0) },
      { key: 'rohertragsfaktor', label: 'Rohertragsfaktor', sekundaer: true, formatiert: formatZahl(2.16 + delta * 0.5) },
      { key: 'restwert', label: 'Restwert am Ende des Betrachtungszeitraums', formatiert: formatEuro(Math.round(726 - delta * 250), 0) },
    ]
  }

  jahresergebnisse(szenarioIndex: number, jahre: number): number[] {
    // Stub-Kurvenform angelehnt an Folie 32 (Delle in den ersten Jahren, dann Anstieg)
    const n = Math.min(Math.max(jahre, 8), 11)
    return Array.from({ length: n }, (_, i) => {
      const basis = -2.6 * Math.exp(-((i - 2.6) ** 2) / 6) + 0.4 + i * 0.18
      return Math.round((basis + szenarioIndex * 0.55) * 100) / 100
    })
  }

  cashflows(szenarioIndex: number, jahre: number): number[] {
    const n = Math.min(Math.max(jahre, 8), 11)
    return Array.from({ length: n }, (_, i) => {
      const basis = 3.6 - 1.1 * Math.exp(-((i - 2.2) ** 2) / 5) + (i > 5 ? (i - 5) * 0.75 : 0)
      return Math.round((basis + szenarioIndex * 0.5) * 100) / 100
    })
  }

  eigenkapitalrendite(szenarioIndex: number): number {
    return 1.78 + szenarioIndex * 0.42
  }

  endwert(szenarioIndex: number): number {
    return 3.1 + szenarioIndex * 1.1
  }
}

/** Zentrale Instanz – später gegen echte Engine austauschbar */
export const berechnung: Berechnungsschicht = new StubBerechnung()
