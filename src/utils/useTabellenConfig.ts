/**
 * Persistenter Konfigurationszustand für Data-Grid-Tabellen: Spaltenbreiten
 * und ausgeblendete Spalten – pro Benutzer und pro Tabelle.
 *
 * Umgesetzte Tickets:
 *  - "Erweiterte Tabellenfunktionalität": Drag & Drop Resize, Ein-/Ausblenden
 *    von Spalten, Mindestbreite, benutzerspezifische Persistenz.
 *  - "Layout-Anpassung Berichte/Aufgaben": flexible vs. feste Spalten. Die
 *    Tabelle nutzt die volle Container-Breite (`width: 100%`), horizontale
 *    Scrollbalken erscheinen erst, wenn tatsächlich mehr Platz verlangt wird
 *    als vorhanden. Solange der Nutzer eine flexible Spalte NICHT explizit
 *    resized, bekommt sie in der colgroup keine Breite und teilt sich den
 *    Restplatz mit den anderen flexiblen Spalten (Standard-Verhalten von
 *    `table-layout: fixed`).
 */

import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface SpaltenDefinition {
  schluessel: string
  label: string
  /** Startbreite als Anhaltspunkt (wird nur verwendet, wenn kein Nutzerwert
   *  vorliegt und die Spalte nicht flexibel ist). */
  standardBreite: number
  /** Untergrenze beim Resize, damit die Zelle nicht auf 0 gezogen werden kann. */
  minBreite: number
  /** Flexible Spalten sollen den Restplatz füllen. Solange kein Nutzerwert
   *  gesetzt ist, bekommt die Spalte keine col-Breite → die Tabelle verteilt
   *  den Restplatz auf alle flexiblen Spalten (Ticket "Layout-Anpassung"). */
  flexibel?: boolean
  /** Manche Spalten (z. B. Admin-Aktionen) erscheinen nicht im Konfig-Menü. */
  fest?: boolean
}

interface TabellenConfig {
  breiten: Record<string, number>
  versteckt: Record<string, boolean>
}

const LEERE_CONFIG: TabellenConfig = { breiten: {}, versteckt: {} }

/** Konsolidierte Spalte für die Anzeige. `nutzerBreite` ist gesetzt, wenn
 *  der Nutzer die Breite explizit gezogen hat – nur dann wird sie in der
 *  colgroup ausgegeben. `flexibel + !nutzerBreite` heißt: keine Breite
 *  setzen, Browser verteilt den Restplatz. */
export interface AktuelleSpalte extends SpaltenDefinition {
  nutzerBreite: number | undefined
}

export interface TabellenConfigApi {
  breite: (schluessel: string) => number
  sichtbar: (schluessel: string) => boolean
  setzeBreite: (schluessel: string, breite: number) => void
  /** Setzt für mehrere Spalten in einem Rutsch eine Breite. Wird beim
   *  Beginn eines Drag-Vorgangs verwendet, um alle bisher flexiblen Spalten
   *  auf ihre aktuellen DOM-Breiten einzufrieren – dadurch wechselt die
   *  Tabelle vom flexiblen Layout auf ein festes Excel-artiges Layout, ohne
   *  dass sich Nachbarspalten während des Ziehens bewegen. Werte, die
   *  bereits gesetzt sind, werden NICHT überschrieben. */
  friereBreitenEin: (breiten: Record<string, number>) => void
  setzeSichtbar: (schluessel: string, sichtbar: boolean) => void
  zuruecksetzen: () => void
}

export function useTabellenConfig(
  tabelle: string,
  nutzerId: string,
  spalten: SpaltenDefinition[],
): [AktuelleSpalte[], TabellenConfigApi] {
  const storageKey = `immology.tabelle.${nutzerId}.${tabelle}`
  const [config, setzeConfig] = useLocalStorage<TabellenConfig>(storageKey, LEERE_CONFIG)

  const sichtbareSpalten = useMemo<AktuelleSpalte[]>(() => {
    return spalten
      .filter((s) => s.fest || config.versteckt[s.schluessel] !== true)
      .map((s) => ({ ...s, nutzerBreite: config.breiten[s.schluessel] }))
  }, [spalten, config])

  const breite = useCallback(
    (schluessel: string) => {
      const def = spalten.find((s) => s.schluessel === schluessel)
      return config.breiten[schluessel] ?? def?.standardBreite ?? 120
    },
    [spalten, config.breiten],
  )

  const sichtbar = useCallback(
    (schluessel: string) => {
      const def = spalten.find((s) => s.schluessel === schluessel)
      if (def?.fest) return true
      return config.versteckt[schluessel] !== true
    },
    [spalten, config.versteckt],
  )

  const setzeBreite = useCallback(
    (schluessel: string, neueBreite: number) => {
      const def = spalten.find((s) => s.schluessel === schluessel)
      const min = def?.minBreite ?? 60
      const gerundet = Math.round(Math.max(min, neueBreite))
      setzeConfig((prev) => ({
        ...prev,
        breiten: { ...prev.breiten, [schluessel]: gerundet },
      }))
    },
    [spalten, setzeConfig],
  )

  const friereBreitenEin = useCallback(
    (breiten: Record<string, number>) => {
      setzeConfig((prev) => {
        const zusammen: Record<string, number> = { ...prev.breiten }
        for (const [schluessel, wert] of Object.entries(breiten)) {
          // Nur setzen, wenn noch nicht gepinnt – wir überschreiben bewusst
          // keine vom Nutzer vorher explizit gezogenen Breiten.
          if (zusammen[schluessel] === undefined) {
            const def = spalten.find((s) => s.schluessel === schluessel)
            const min = def?.minBreite ?? 60
            zusammen[schluessel] = Math.round(Math.max(min, wert))
          }
        }
        return { ...prev, breiten: zusammen }
      })
    },
    [spalten, setzeConfig],
  )

  const setzeSichtbar = useCallback(
    (schluessel: string, sichtbar: boolean) => {
      const def = spalten.find((s) => s.schluessel === schluessel)
      if (def?.fest) return
      setzeConfig((prev) => {
        const versteckt = { ...prev.versteckt }
        if (sichtbar) delete versteckt[schluessel]
        else versteckt[schluessel] = true
        return { ...prev, versteckt }
      })
    },
    [spalten, setzeConfig],
  )

  const zuruecksetzen = useCallback(() => {
    setzeConfig(LEERE_CONFIG)
  }, [setzeConfig])

  return [sichtbareSpalten, { breite, sichtbar, setzeBreite, friereBreitenEin, setzeSichtbar, zuruecksetzen }]
}

/**
 * Berechnet das Inline-Style-Objekt für die <table>. Zwei Modi:
 *
 *  - Solange KEINE Spalte eine `nutzerBreite` hat: `width: 100%` und
 *    `minWidth: <Summe der Standard-/Min-Breiten>`. Das flexible Layout
 *    verteilt den Restplatz auf flexible Spalten.
 *  - Sobald mindestens EINE Spalte eine `nutzerBreite` besitzt (was nach
 *    dem ersten Drag der Fall ist, weil `friereBreitenEin` alle sichtbaren
 *    Spalten auf einmal pinnt), setzen wir `width` = Summe der Nutzerbreiten.
 *    Weiteres Ziehen einer Spalte ändert nur deren Breite und passt die
 *    Tabellenbreite entsprechend an – die Nachbarn behalten ihre Breite
 *    (Ticket "Fehler bei der Spaltenbreiten-Anpassung"). Übersteigt die
 *    Summe die Container-Breite, greift `overflow-x: auto` und der
 *    horizontale Scrollbalken erscheint.
 *
 *  @param extraBreite zusätzliche Breite für Nicht-Spalten-<col> (z. B. die
 *    Admin-Aktionsspalte, 48 px), damit die Tabellenbreite auch diese Zelle
 *    berücksichtigt.
 */
export function tabellenBreitenStyle(
  sichtbareSpalten: AktuelleSpalte[],
  extraBreite: number,
): React.CSSProperties {
  const hatNutzerbreite = sichtbareSpalten.some((s) => s.nutzerBreite !== undefined)
  if (!hatNutzerbreite) {
    // Flexibles Layout: 100% Container-Breite, Minimum ist die Summe der
    // Mindestbreiten, damit auf sehr schmalen Viewports korrekt gescrollt
    // werden kann.
    const min = sichtbareSpalten.reduce((sum, s) => sum + s.minBreite, 0) + extraBreite
    return { width: '100%', minWidth: min }
  }
  const summe =
    sichtbareSpalten.reduce((sum, s) => sum + (s.nutzerBreite ?? s.standardBreite), 0) + extraBreite
  return { width: summe, minWidth: summe }
}
