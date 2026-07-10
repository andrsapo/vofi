/** Platzhalterdaten für Dashboard (Soll-Ist-Abgleich, ESG, Zuletzt verwendet) */

import type { ProjektStatus } from '../types'

export interface SollIstZeile {
  id: string
  position: string
  soll: number // T€
  ist: number // T€
  /** 'ertrag' = Einnahme/Umsatz, 'aufwand' = Kosten; steuert die Badge-Farblogik */
  typ: 'ertrag' | 'aufwand'
  kinder?: SollIstZeile[]
}

export const SOLL_IST_2023: SollIstZeile[] = [
  {
    id: 'umsatz',
    position: 'Umsatzerlöse',
    soll: 11975.4,
    ist: 12345.1,
    typ: 'ertrag',
    kinder: [
      { id: 'umsatz-1', position: 'Sollmieten Wohnen',   soll: 8420.2, ist: 8617.4, typ: 'ertrag' },
      { id: 'umsatz-2', position: 'Sollmieten Gewerbe',  soll: 2410.0, ist: 2489.9, typ: 'ertrag' },
      {
        id: 'umsatz-3',
        position: 'Umlagen und Nebenleistungen',
        soll: 1145.2,
        ist: 1237.8,
        typ: 'ertrag',
        kinder: [
          { id: 'umsatz-3-1', position: 'Betriebskostenumlagen',   soll: 918.4, ist: 991.2, typ: 'ertrag' },
          { id: 'umsatz-3-2', position: 'Sonstige Nebenleistungen', soll: 226.8, ist: 246.6, typ: 'ertrag' },
        ],
      },
    ],
  },
  { id: 'bestand',   position: 'Bestandsveränderungen',        soll: 139.2,   ist: 43.34,  typ: 'ertrag' },
  { id: 'sonstige',  position: 'Sonstige betriebliche Erträge', soll: 297.8,   ist: 0,      typ: 'ertrag' },
  {
    id: 'lieferungen',
    position: 'Aufwendungen für bezogene Lieferungen und Leistungen',
    soll: 4506.0,
    ist: 4985.3,
    typ: 'aufwand',
    kinder: [
      { id: 'lieferungen-1', position: 'Instandhaltung', soll: 2610.4, ist: 2999.1, typ: 'aufwand' },
      { id: 'lieferungen-2', position: 'Betriebskosten', soll: 1895.6, ist: 1986.2, typ: 'aufwand' },
    ],
  },
  { id: 'hausbewirtschaftung', position: 'Aufwendungen für Hausbewirtschaftung', soll: 5553.42, ist: 5023.41, typ: 'aufwand' },
  { id: 'personal',            position: 'Personalaufwand',                       soll: 2072.8,  ist: 2050.3,  typ: 'aufwand' },
  { id: 'abschreibungen',      position: 'Abschreibungen',                         soll: 3378.8,  ist: 3452.0,  typ: 'aufwand' },
]

export const SOLL_IST_SUMME: SollIstZeile = {
  id: 'summe',
  position: 'Jahresüberschuss/-fehlbetrag',
  soll: 1420.85,
  ist: 1023.51,
  typ: 'ertrag',
}

export interface EsgRing {
  titel: 'Environmental' | 'Social' | 'Governance'
  wert: number
  gruen: number
  gelb: number
  datenpunkte: number
  topLevelZiele: number
  zwischenZiele: number
}

export const ESG_RINGE: EsgRing[] = [
  { titel: 'Environmental', wert: 12, gruen: 9, gelb: 3, datenpunkte: 1, topLevelZiele: 4, zwischenZiele: 8 },
  { titel: 'Social',        wert: 3,  gruen: 1, gelb: 2, datenpunkte: 2, topLevelZiele: 2, zwischenZiele: 1 },
  { titel: 'Governance',    wert: 5,  gruen: 5, gelb: 0, datenpunkte: 1, topLevelZiele: 1, zwischenZiele: 3 },
]

export interface ZuletztVerwendetKarte {
  id: string
  titel: string
  anzahlProjekte: number
  datum: string
  status: ProjektStatus
}
