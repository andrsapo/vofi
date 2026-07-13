/**
 * Zentraler In-Memory-Store (React Context + useSyncExternalStore).
 * Mutationen laufen über `store.mutate(...)`; fachliche Operationen sind als
 * Methoden gekapselt. Die Datenschicht (ERP-Mock) bleibt austauschbar.
 */

import { createContext, useContext, useSyncExternalStore, useState, type ReactNode } from 'react'
import type {
  AufgabenStatus,
  Bericht,
  BerichtStatus,
  FeldReferenz,
  Investitionsart,
  KommentarAufgabe,
  ObjektIst,
  ObjektIstFeldKey,
  Projekt,
  ProzessSchritt,
  Route,
  Szenario,
  SzenarioDaten,
} from '../types'
import { erpRepository } from '../data/erpRepository'
import {
  erzeugeLeereErtraegeAufwendungen,
  erzeugeLeereFinanzierung,
  erzeugeLeereObjektdaten,
  erzeugeObjektIst,
  erzeugeSzenarioDaten,
} from '../data/defaults'
import { neueId } from '../utils/format'

export interface UiState {
  /** rechte Leiste: Szenarien-Navigation oder Kommentarliste */
  rechtePanelAnsicht: 'navigation' | 'kommentare'
  kommentareUngelesen: boolean
  /** aktuell betrachteter Kommentar-Thread (Feld gelb markiert, Popup offen) */
  aktiveFeldReferenz: FeldReferenz | null
  grafikenPopupOffen: boolean
}

export interface AppState {
  route: Route
  aktuellerNutzerId: string
  projekte: Projekt[]
  /** Objekt IST-Zustand je Projekt (konstant über alle Szenarien) */
  objektIst: Record<string, ObjektIst>
  szenarien: Szenario[]
  /** Bereichsdaten je Szenario-Id */
  szenarioDaten: Record<string, SzenarioDaten>
  kommentare: KommentarAufgabe[]
  berichte: Bericht[]
  ui: UiState
}

function initialState(nutzerId: string): AppState {
  return {
    route: { view: 'dashboard' },
    aktuellerNutzerId: nutzerId,
    projekte: [],
    objektIst: {},
    szenarien: [],
    szenarioDaten: {},
    kommentare: [],
    berichte: [],
    ui: {
      rechtePanelAnsicht: 'navigation',
      kommentareUngelesen: true,
      aktiveFeldReferenz: null,
      grafikenPopupOffen: false,
    },
  }
}

/**
 * Persistenz-Schicht: der komplette fachliche State (Projekte, Szenarien,
 * Kommentare, Berichte inkl. Objektdaten je Szenario) wird in localStorage
 * gespeichert. Der UI-Zustand (offene Panels, Routen) wird bewusst NICHT
 * persistiert, damit die App beim erneuten Öffnen sauber auf dem Dashboard
 * landet und keine "hängen gebliebenen" Popups zeigt.
 *
 * Schema-Version: erhöht sich, wenn sich das Datenformat inkompatibel
 * ändert – der Fallback verwirft dann die alten Daten und startet neu.
 */
const STORAGE_KEY = 'immology.appState'
const STORAGE_VERSION = 2

interface PersistedState {
  v: number
  data: Pick<AppState, 'aktuellerNutzerId' | 'projekte' | 'objektIst' | 'szenarien' | 'szenarioDaten' | 'kommentare' | 'berichte'>
}

function ladePersistiertenState(nutzerId: string): AppState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed.v !== STORAGE_VERSION) return null
    return {
      ...initialState(nutzerId),
      ...parsed.data,
      aktuellerNutzerId: nutzerId,
      ui: initialState(nutzerId).ui,
      route: { view: 'dashboard' },
    }
  } catch {
    return null
  }
}

function speichereState(state: AppState): void {
  if (typeof window === 'undefined') return
  try {
    const p: PersistedState = {
      v: STORAGE_VERSION,
      data: {
        aktuellerNutzerId: state.aktuellerNutzerId,
        projekte: state.projekte,
        objektIst: state.objektIst,
        szenarien: state.szenarien,
        szenarioDaten: state.szenarioDaten,
        kommentare: state.kommentare,
        berichte: state.berichte,
      },
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* Quota überschritten oder Storage nicht verfügbar – im Prototyp still. */
  }
}

/** Schreibt eine einzelne Mutation fire-and-forget in die DB.
 *  Projekte werden vor Szenarien geschrieben (FK-Reihenfolge). */
function syncMutationZuDB(prev: AppState, next: AppState): void {
  import('../data/supabaseRepository').then(
    async ({
      upsertProjekt, deleteProjekt,
      upsertSzenario, deleteSzenario, upsertSzenarioDaten,
      upsertKommentar, deleteKommentar,
      upsertBericht, deleteBericht,
    }) => {
      // 1. Projekte zuerst (FK-Voraussetzung für Szenarien)
      const projektWrites: Promise<void>[] = []
      for (const p of next.projekte) {
        const alt = prev.projekte.find((x) => x.id === p.id)
        if (!alt || JSON.stringify(alt) !== JSON.stringify(p) || JSON.stringify(prev.objektIst[p.id]) !== JSON.stringify(next.objektIst[p.id])) {
          projektWrites.push(upsertProjekt(p, next.objektIst[p.id] ?? {}))
        }
      }
      // Gelöschte Projekte (Cascade löscht Szenarien/Daten automatisch)
      for (const p of prev.projekte) {
        if (!next.projekte.find((x) => x.id === p.id)) {
          projektWrites.push(deleteProjekt(p.id))
        }
      }
      if (projektWrites.length > 0) {
        await Promise.all(projektWrites).catch(console.error)
      }

      // 2. Szenarien (nach Projekten, FK-sicher)
      const szenarioWrites: Promise<void>[] = []
      for (const s of next.szenarien) {
        const alt = prev.szenarien.find((x) => x.id === s.id)
        if (!alt || JSON.stringify(alt) !== JSON.stringify(s) || JSON.stringify(prev.szenarioDaten[s.id]) !== JSON.stringify(next.szenarioDaten[s.id])) {
          szenarioWrites.push(upsertSzenario(s, next.szenarioDaten[s.id] ?? ({} as any)))
        }
      }
      for (const s of prev.szenarien) {
        if (!next.szenarien.find((x) => x.id === s.id)) {
          szenarioWrites.push(deleteSzenario(s.id))
        }
      }
      if (szenarioWrites.length > 0) {
        await Promise.all(szenarioWrites).catch(console.error)
      }

      // 3. SzenarioDaten-Updates ohne Szenario-Änderung
      for (const id of Object.keys(next.szenarioDaten)) {
        if (next.szenarien.find((s) => s.id === id) && prev.szenarien.find((s) => s.id === id) &&
            JSON.stringify(prev.szenarioDaten[id]) !== JSON.stringify(next.szenarioDaten[id])) {
          upsertSzenarioDaten(id, next.szenarioDaten[id]).catch(console.error)
        }
      }

      // 4. Kommentare & Berichte (parallel, keine FK-Abhängigkeit von Szenarien)
      for (const k of next.kommentare) {
        const alt = prev.kommentare.find((x) => x.id === k.id)
        if (!alt || JSON.stringify(alt) !== JSON.stringify(k)) {
          upsertKommentar(k).catch(console.error)
        }
      }
      for (const k of prev.kommentare) {
        if (!next.kommentare.find((x) => x.id === k.id)) {
          deleteKommentar(k.id).catch(console.error)
        }
      }
      for (const b of next.berichte) {
        const alt = prev.berichte.find((x) => x.id === b.id)
        if (!alt || JSON.stringify(alt) !== JSON.stringify(b)) {
          upsertBericht(b).catch(console.error)
        }
      }
      for (const b of prev.berichte) {
        if (!next.berichte.find((x) => x.id === b.id)) {
          deleteBericht(b.id).catch(console.error)
        }
      }
    }
  ).catch(console.error)
}

export class Store {
  state: AppState
  private version = 0
  private listeners = new Set<() => void>()

  constructor(nutzerId: string) {
    this.state = ladePersistiertenState(nutzerId) ?? initialState(nutzerId)
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getVersion = (): number => this.version

  mutate(fn: (state: AppState) => void): void {
    const prev = this.state
    // Snapshot für DB-Diff: objektIst und szenarioDaten tief klonen, da
    // Mutationen (setzeObjektFeld, aendereSzenarioDaten) in-place arbeiten
    // und ein flacher Klon dieselben Referenzen teilt – der Diff sieht sonst
    // nie eine Änderung und schreibt nichts in die DB.
    const prevObjektIstDeep: Record<string, ObjektIst> = {}
    for (const [id, oi] of Object.entries(prev.objektIst)) {
      prevObjektIstDeep[id] = JSON.parse(JSON.stringify(oi))
    }
    const prevSzenarioDatenDeep: Record<string, SzenarioDaten> = {}
    for (const [id, sd] of Object.entries(prev.szenarioDaten)) {
      prevSzenarioDatenDeep[id] = JSON.parse(JSON.stringify(sd))
    }
    const prevSnap: AppState = {
      ...prev,
      projekte: [...prev.projekte],
      szenarien: [...prev.szenarien],
      kommentare: [...prev.kommentare],
      berichte: [...prev.berichte],
      objektIst: prevObjektIstDeep,
      szenarioDaten: prevSzenarioDatenDeep,
    }
    fn(this.state)
    this.version += 1
    speichereState(this.state)
    syncMutationZuDB(prevSnap, this.state)
    this.listeners.forEach((l) => l())
  }

  async ladeVonServer(): Promise<void> {
    try {
      const { ladeAppDaten, migriereLokaldaten } = await import('../data/supabaseRepository')
      const { ladePersonen: ladePersonenLokal } = await import('../data/erpRepository')
      const dbDaten = await ladeAppDaten()

      if (!dbDaten) {
        let lokalerState: AppState | null = ladePersistiertenState(this.state.aktuellerNutzerId)
        if (!lokalerState || lokalerState.projekte.length === 0) {
          try {
            const raw = window.localStorage.getItem('immology.appState')
            if (raw) {
              const parsed = JSON.parse(raw)
              if (parsed?.data?.projekte?.length > 0) {
                lokalerState = { ...initialState(this.state.aktuellerNutzerId), ...parsed.data, aktuellerNutzerId: this.state.aktuellerNutzerId, ui: initialState(this.state.aktuellerNutzerId).ui, route: { view: 'dashboard' } }
              }
            }
          } catch { /* ignore */ }
        }

        if (lokalerState && lokalerState.projekte.length > 0) {
          await migriereLokaldaten(
            {
              projekte:      lokalerState.projekte,
              objektIst:     lokalerState.objektIst,
              szenarien:     lokalerState.szenarien,
              szenarioDaten: lokalerState.szenarioDaten,
              kommentare:    lokalerState.kommentare,
              berichte:      lokalerState.berichte,
            },
            ladePersonenLokal()
          )
          this.state = {
            ...this.state,
            projekte:      lokalerState.projekte,
            objektIst:     lokalerState.objektIst,
            szenarien:     lokalerState.szenarien,
            szenarioDaten: lokalerState.szenarioDaten,
            kommentare:    lokalerState.kommentare,
            berichte:      lokalerState.berichte,
          }
          speichereState(this.state)
          this.version += 1
          this.listeners.forEach((l) => l())
        }
        return
      }

      // Titelbilder: Storage-URLs direkt aus DB übernehmen
      // SzenarioDaten: DB-Stand übernehmen, leere Einträge mit Defaults reparieren
      const mergedSzenarioDaten: Record<string, SzenarioDaten> = { ...this.state.szenarioDaten }
      for (const [id, dbEintrag] of Object.entries(dbDaten.szenarioDaten)) {
        if (dbEintrag && Object.keys(dbEintrag).length > 0) mergedSzenarioDaten[id] = dbEintrag
      }
      const { erzeugeLeereObjektdaten, erzeugeLeereErtraegeAufwendungen, erzeugeLeereFinanzierung } = await import('../data/defaults')
      const { upsertSzenarioDaten } = await import('../data/supabaseRepository')
      for (const s of dbDaten.szenarien) {
        if (!mergedSzenarioDaten[s.id] || Object.keys(mergedSzenarioDaten[s.id]).length === 0) {
          const repariert: SzenarioDaten = {
            objektdaten: erzeugeLeereObjektdaten(),
            ertraegeAufwendungen: erzeugeLeereErtraegeAufwendungen(),
            finanzierung: erzeugeLeereFinanzierung(),
          }
          mergedSzenarioDaten[s.id] = repariert
          upsertSzenarioDaten(s.id, repariert).catch(console.error)
        }
      }
      this.state = {
        ...this.state,
        projekte:      dbDaten.projekte,
        objektIst:     { ...this.state.objektIst, ...dbDaten.objektIst },
        szenarien:     dbDaten.szenarien,
        szenarioDaten: mergedSzenarioDaten,
        kommentare:    dbDaten.kommentare,
        berichte:      dbDaten.berichte,
      }
      speichereState(this.state)
      this.version += 1
      this.listeners.forEach((l) => l())
    } catch (e) {
      console.warn('[store] ladeVonServer fehlgeschlagen:', e)
    }
  }

  /** Kompletten persistierten State löschen (z. B. für einen Reset-Button). */
  zuruecksetzen(): void {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* still */
      }
    }
    this.state = initialState(this.state.aktuellerNutzerId)
    this.version += 1
    this.listeners.forEach((l) => l())
  }

  // ---------- Navigation ----------

  navigiere(route: Route): void {
    this.mutate((s) => {
      s.route = route
      s.ui.aktiveFeldReferenz = null
    })
  }

  // ---------- Projekt anlegen ----------

  erstelleProjekt(eingabe: {
    name: string
    beschreibung: string
    typ: string
    investitionsart: Investitionsart
    objektId: string | null
    betrachtungszeitraumJahre: number
    inflationaereKostensteigerungProzent: number
    zugangsberechtigteIds: string[]
    titelbildUrl?: string
  }): Projekt {
    const projekt: Projekt = {
      id: neueId('prj'),
      name: eingabe.name,
      beschreibung: eingabe.beschreibung,
      typ: eingabe.typ,
      objektId: eingabe.objektId,
      betrachtungszeitraumJahre: eingabe.betrachtungszeitraumJahre,
      inflationaereKostensteigerungProzent: eingabe.inflationaereKostensteigerungProzent,
      zugangsberechtigteIds: eingabe.zugangsberechtigteIds,
      titelbildUrl: eingabe.titelbildUrl,
      status: 'In Bearbeitung',
      investitionsart: eingabe.investitionsart,
      erstelltAm: new Date().toISOString(),
    }
    const erp = eingabe.objektId ? erpRepository.ladeObjekt(eingabe.objektId) : undefined
    const objektIst = erzeugeObjektIst(eingabe.investitionsart, erp)
    const basis: Szenario = {
      id: neueId('szn'),
      projektId: projekt.id,
      name: 'Basis',
      istBasis: true,
      uebernommeneBereiche: { objektdaten: true, ertraegeUndAufwendungen: true, finanzierung: true },
    }
    this.mutate((s) => {
      s.projekte.push(projekt)
      s.objektIst[projekt.id] = objektIst
      s.szenarien.push(basis)
      s.szenarioDaten[basis.id] = erzeugeSzenarioDaten(objektIst, erp)
      s.route = { view: 'projekt', projektId: projekt.id, szenarioId: basis.id, schritt: 1 }
      s.ui.rechtePanelAnsicht = 'navigation'
      s.ui.kommentareUngelesen = false
    })
    return projekt
  }

  aktualisiereProjekt(projektId: string, aenderungen: {
    name?: string
    beschreibung?: string
    typ?: string
    objektId?: string | null
    betrachtungszeitraumJahre?: number
    inflationaereKostensteigerungProzent?: number
    zugangsberechtigteIds?: string[]
    titelbildUrl?: string | null
  }): void {
    this.mutate((s) => {
      const p = s.projekte.find((x) => x.id === projektId)
      if (!p) return
      if (aenderungen.name !== undefined) p.name = aenderungen.name
      if (aenderungen.beschreibung !== undefined) p.beschreibung = aenderungen.beschreibung
      if (aenderungen.typ !== undefined) p.typ = aenderungen.typ
      if (aenderungen.objektId !== undefined) p.objektId = aenderungen.objektId
      if (aenderungen.betrachtungszeitraumJahre !== undefined) p.betrachtungszeitraumJahre = aenderungen.betrachtungszeitraumJahre
      if (aenderungen.inflationaereKostensteigerungProzent !== undefined) p.inflationaereKostensteigerungProzent = aenderungen.inflationaereKostensteigerungProzent
      if (aenderungen.zugangsberechtigteIds !== undefined) p.zugangsberechtigteIds = aenderungen.zugangsberechtigteIds
      if (aenderungen.titelbildUrl !== undefined) p.titelbildUrl = aenderungen.titelbildUrl ?? undefined
      p.aktualisiertAm = new Date().toISOString()
    })
  }

  loescheProjekt(projektId: string): void {
    this.mutate((s) => {
      const szenarienIds = s.szenarien.filter((sz) => sz.projektId === projektId).map((sz) => sz.id)
      s.projekte = s.projekte.filter((p) => p.id !== projektId)
      delete s.objektIst[projektId]
      s.szenarien = s.szenarien.filter((sz) => sz.projektId !== projektId)
      szenarienIds.forEach((id) => { delete s.szenarioDaten[id] })
      s.kommentare = s.kommentare.filter((k) => k.projektId !== projektId)
      s.berichte = s.berichte.filter((b) => b.projektId !== projektId)
      if (s.route.view === 'projekt' && s.route.projektId === projektId) {
        s.route = { view: 'dashboard' }
      }
    })
  }

  // ---------- Objekt IST-Zustand (Override-Mechanik) ----------

  setzeObjektFeld<K extends ObjektIstFeldKey>(projektId: string, feld: K, wert: ObjektIst[K]['wert']): void {
    this.mutate((s) => {
      const objekt = s.objektIst[projektId]
      if (objekt) (objekt[feld] as { wert: unknown }).wert = wert
    })
  }

  setzeObjektFeldZurueck(projektId: string, feld: ObjektIstFeldKey): void {
    this.mutate((s) => {
      const objekt = s.objektIst[projektId]
      const f = objekt?.[feld]
      if (f && f.erp !== null) (f as { wert: unknown }).wert = f.erp
    })
  }

  /** Wechsel der Objektauswahl lädt die ERP-Daten neu (nur Bestand) */
  ladeObjektNeu(projektId: string, objektId: string): void {
    const erp = erpRepository.ladeObjekt(objektId)
    if (!erp) return
    this.mutate((s) => {
      s.objektIst[projektId] = erzeugeObjektIst('Bestand', erp)
      const projekt = s.projekte.find((p) => p.id === projektId)
      if (projekt) projekt.objektId = objektId
    })
  }

  // ---------- Szenario-Daten (Schritte 2–4) ----------

  aendereSzenarioDaten(szenarioId: string, fn: (daten: SzenarioDaten) => void): void {
    this.mutate((s) => {
      const daten = s.szenarioDaten[szenarioId]
      if (daten) fn(daten)
    })
  }

  // ---------- Szenarien ----------

  erstelleSzenario(
    projektId: string,
    name: string,
    uebernahme: { objektdaten: boolean; ertraegeUndAufwendungen: boolean; finanzierung: boolean },
  ): Szenario {
    const basis = this.state.szenarien.find((x) => x.projektId === projektId && x.istBasis)
    const basisDaten = basis ? this.state.szenarioDaten[basis.id] : undefined
    const szenario: Szenario = {
      id: neueId('szn'),
      projektId,
      name,
      istBasis: false,
      quellSzenarioId: basis?.id,
      uebernommeneBereiche: uebernahme,
    }
    // Duplizieren mit wählbarer bereichsweiser Übernahme.
    // - Ausgewählter Bereich: 1:1 Deep-Copy aus dem Basisszenario.
    // - Nicht ausgewählter Bereich: leerer Startzustand (Felder = 0),
    //   sodass der Anwender die Daten bewusst neu erfasst und keine
    //   impliziten Default-Werte übernommen werden.
    const daten: SzenarioDaten = {
      objektdaten:
        uebernahme.objektdaten && basisDaten
          ? structuredClone(basisDaten.objektdaten)
          : erzeugeLeereObjektdaten(),
      ertraegeAufwendungen:
        uebernahme.ertraegeUndAufwendungen && basisDaten
          ? structuredClone(basisDaten.ertraegeAufwendungen)
          : erzeugeLeereErtraegeAufwendungen(),
      finanzierung:
        uebernahme.finanzierung && basisDaten
          ? structuredClone(basisDaten.finanzierung)
          : erzeugeLeereFinanzierung(),
    }
    this.mutate((s) => {
      s.szenarien.push(szenario)
      s.szenarioDaten[szenario.id] = daten
    })
    return szenario
  }

  loescheSzenario(szenarioId: string): void {
    this.mutate((s) => {
      const szenario = s.szenarien.find((x) => x.id === szenarioId)
      if (!szenario || szenario.istBasis) return
      s.szenarien = s.szenarien.filter((x) => x.id !== szenarioId)
      delete s.szenarioDaten[szenarioId]
      if (s.route.view === 'projekt' && s.route.szenarioId === szenarioId) {
        const basis = s.szenarien.find((x) => x.projektId === szenario.projektId && x.istBasis)
        if (basis) s.route = { ...s.route, szenarioId: basis.id }
      }
    })
  }

  umbenenneSzenario(szenarioId: string, name: string): void {
    this.mutate((s) => {
      const szenario = s.szenarien.find((x) => x.id === szenarioId)
      if (!szenario) return
      szenario.name = name
    })
  }

  setzeAuswertungOverride(szenarioId: string, key: string, wert: string | null): void {
    this.mutate((s) => {
      const daten = s.szenarioDaten[szenarioId]
      if (!daten) return
      if (!daten.auswertungOverrides) daten.auswertungOverrides = {}
      if (wert === null || wert === '') delete daten.auswertungOverrides[key]
      else daten.auswertungOverrides[key] = wert
    })
  }

  // ---------- Kommentare & Aufgaben ----------

  oeffneKommentare(): void {
    this.mutate((s) => {
      s.ui.rechtePanelAnsicht = 'kommentare'
      s.ui.kommentareUngelesen = false
    })
  }

  schliesseKommentare(): void {
    this.mutate((s) => {
      s.ui.rechtePanelAnsicht = 'navigation'
      s.ui.aktiveFeldReferenz = null
    })
  }

  /** Klick auf Kommentar: zum referenzierten Feld springen + gelb markieren + Popup */
  springeZuKommentar(kommentar: KommentarAufgabe): void {
    const ref = kommentar.feldReferenz
    if (!ref) return
    this.mutate((s) => {
      s.route = {
        view: 'projekt',
        projektId: kommentar.projektId,
        szenarioId: ref.szenarioId,
        schritt: ref.schritt,
      }
      s.ui.aktiveFeldReferenz = ref
      s.ui.rechtePanelAnsicht = 'kommentare'
      s.ui.kommentareUngelesen = false
    })
  }

  schliesseFeldPopup(): void {
    this.mutate((s) => {
      s.ui.aktiveFeldReferenz = null
    })
  }

  /**
   * Erzeugt eine neue Aufgabe direkt aus der Aufgaben-Übersicht (Ticket
   * "Aufgabe erstellen"-Modal). Anders als `macheZurAufgabe` gibt es hier
   * keinen Ursprungs-Kommentar und keine Feldreferenz – die Aufgabe steht
   * für sich. Ein Projektbezug ist optional; ohne Projekt wird eine leere
   * `projektId` gesetzt (in der Tabelle als "—" dargestellt).
   */
  erstelleAufgabe(eingabe: { text: string; zugewiesenAnId: string; projektId?: string }): KommentarAufgabe {
    const naechsteNr = this.state.kommentare.reduce((max, k) => Math.max(max, k.nr), 0) + 1
    const aufgabe: KommentarAufgabe = {
      id: neueId('kom'),
      nr: naechsteNr,
      projektId: eingabe.projektId ?? '',
      autorId: this.state.aktuellerNutzerId,
      text: eingabe.text,
      zeitstempel: new Date().toISOString(),
      typ: 'Aufgabe',
      aufgabenstatus: 'Offen',
      zugewiesenAnId: eingabe.zugewiesenAnId,
      // Neu erstellte Aufgabe gilt als ungelesen (fetter Titel in der Übersicht,
      // +1 im Sidebar-Badge, bis der Zuständige sie geöffnet hat).
      isRead: false,
    }
    this.mutate((s) => {
      // Bewusst NEUE Array-Referenz zuweisen: useMemo/useSyncExternalStore-
      // Consumer, die `app.kommentare` in ihrer Dependency-Liste haben, sehen
      // sonst denselben Array (in-place push) und rendern nicht neu.
      s.kommentare = [...s.kommentare, aufgabe]
    })
    return aufgabe
  }

  macheZurAufgabe(kommentarId: string): void {
    this.mutate((s) => {
      s.kommentare = s.kommentare.map((k) => {
        if (k.id !== kommentarId || k.typ === 'Aufgabe') return k
        return {
          ...k,
          typ: 'Aufgabe' as const,
          aufgabenstatus: 'Offen' as const,
          // ANNAHME: Neue Aufgaben werden dem aktuell angemeldeten Nutzer zugewiesen
          // (Zähler-Badge im Menüpunkt "Aufgaben", Folie 17).
          zugewiesenAnId: s.aktuellerNutzerId,
          isRead: false,
          readAt: undefined,
        }
      })
    })
  }

  setzeAufgabenStatus(kommentarId: string, status: AufgabenStatus): void {
    this.mutate((s) => {
      s.kommentare = s.kommentare.map((k) => {
        if (k.id !== kommentarId || k.typ !== 'Aufgabe') return k
        // Ein Statuswechsel über das Dropdown ist eine bewusste Handlung des
        // Nutzers – die Aufgabe gilt damit implizit als gelesen.
        return { ...k, aufgabenstatus: status, isRead: true, readAt: new Date().toISOString() }
      })
    })
  }

  /** Ändert den Freitext und optional den Zuständigen einer Aufgabe. */
  bearbeiteAufgabenText(kommentarId: string, text: string, zugewiesenAnId?: string): void {
    this.mutate((s) => {
      // Neue Array-Referenz erzwingen, damit useMemo-Consumer (z. B. AufgabenListe)
      // die Änderung zuverlässig erkennen – analog zu erstelleAufgabe (vgl. Zeile ~400).
      s.kommentare = s.kommentare.map((k) => {
        if (k.id !== kommentarId || k.typ !== 'Aufgabe') return k
        return {
          ...k,
          text,
          ...(zugewiesenAnId !== undefined
            ? { zugewiesenAnId: zugewiesenAnId || undefined }
            : {}),
        }
      })
    })
  }

  /** Löscht eine Aufgabe endgültig. Nur für Admins vorgesehen; die
   *  Berechtigungsprüfung erfolgt in der UI (Aktionsmenü wird nur für
   *  Administratoren gerendert). */
  loescheAufgabe(kommentarId: string): void {
    this.mutate((s) => {
      // Auch etwaige Antworten (parentId → kommentarId) entfernen, damit
      // keine verwaisten Threads zurückbleiben.
      s.kommentare = s.kommentare.filter((k) => k.id !== kommentarId && k.parentId !== kommentarId)
    })
  }


  antworteAufKommentar(wurzel: KommentarAufgabe, text: string): void {
    this.mutate((s) => {
      s.kommentare = [
        ...s.kommentare,
        {
          id: neueId('kom'),
          nr: wurzel.nr,
          projektId: wurzel.projektId,
          feldReferenz: wurzel.feldReferenz,
          autorId: s.aktuellerNutzerId,
          text,
          zeitstempel: new Date().toISOString(),
          typ: 'Kommentar',
          parentId: wurzel.id,
        },
      ]
    })
  }

  /**
   * Erstellt einen feldbezogenen Kommentar (Ticket "Feldbezogene Kommentare
   * und Aufgaben"). Der aktuelle formatierte Wert wird als
   * `valueAtCreation` mitgeführt – dadurch bleibt später auch bei
   * Wertänderungen nachvollziehbar, worauf sich die Diskussion bezog.
   *
   * @param projektId          Projekt, zu dem der Kommentar gehört
   * @param referenz           vollständige Feldreferenz inkl. Block-/Feldname
   * @param text               Kommentartext
   * @param valueAtCreation    formatierter Feldwert zum Zeitpunkt der Erstellung
   * @param alsAufgabe         wenn true, wird direkt eine Aufgabe angelegt
   *                           (dem aktuellen Nutzer zugewiesen)
   */
  erstelleFeldKommentar(eingabe: {
    projektId: string
    referenz: FeldReferenz
    text: string
    valueAtCreation: string
    alsAufgabe?: boolean
  }): KommentarAufgabe {
    const naechsteNr = this.state.kommentare.reduce((max, k) => Math.max(max, k.nr), 0) + 1
    const neu: KommentarAufgabe = {
      id: neueId('kom'),
      nr: naechsteNr,
      projektId: eingabe.projektId,
      feldReferenz: eingabe.referenz,
      autorId: this.state.aktuellerNutzerId,
      text: eingabe.text,
      zeitstempel: new Date().toISOString(),
      typ: eingabe.alsAufgabe ? 'Aufgabe' : 'Kommentar',
      aufgabenstatus: eingabe.alsAufgabe ? 'Offen' : undefined,
      zugewiesenAnId: eingabe.alsAufgabe ? this.state.aktuellerNutzerId : undefined,
      valueAtCreation: eingabe.valueAtCreation,
      isRead: eingabe.alsAufgabe ? false : undefined,
    }
    this.mutate((s) => {
      s.kommentare = [...s.kommentare, neu]
      // Rechte Kommentarleiste öffnen, damit der neue Eintrag sofort
      // sichtbar ist (Ticket Punkt 6).
      s.ui.rechtePanelAnsicht = 'kommentare'
      s.ui.kommentareUngelesen = false
    })
    return neu
  }

  // ---------- Berichte ----------

  erstelleBericht(projektId: string, name: string): Bericht {
    const szenarien = this.state.szenarien.filter((x) => x.projektId === projektId)
    const bericht: Bericht = {
      id: neueId('ber'),
      projektId,
      name,
      einbezogeneSzenarien: szenarien.map((x) => x.id),
      // Initialstatus wie in der Klickstrecke (Folie 32): "Diskutiert"
      status: 'Diskutiert',
      empfaenger: [],
      anhaenge: [],
      erstelltAm: new Date().toISOString(),
      autorId: this.state.aktuellerNutzerId,
      version: 1,
      inhalt: '',
      // Neu angelegter Bericht ist ungelesen – erscheint mit "+1"-Badge in
      // der Sidebar, bis der Nutzer ihn öffnet.
      isRead: false,
    }
    this.mutate((s) => {
      s.berichte.push(bericht)
      s.route = { view: 'bericht', berichtId: bericht.id }
      // Direktes Öffnen zählt bereits als Lesen.
      bericht.isRead = true
      bericht.readAt = new Date().toISOString()
    })
    return bericht
  }

  /** Markiert einen Bericht als gelesen. Wird typischerweise beim Navigieren
   *  in die Detailansicht aufgerufen. */
  markiereBerichtGelesen(berichtId: string): void {
    const bericht = this.state.berichte.find((b) => b.id === berichtId)
    if (!bericht || bericht.isRead) return
    this.mutate(() => {
      bericht.isRead = true
      bericht.readAt = new Date().toISOString()
    })
  }

  /** Markiert eine Aufgabe als gelesen. */
  markiereAufgabeGelesen(kommentarId: string): void {
    const k = this.state.kommentare.find((x) => x.id === kommentarId)
    if (!k || k.isRead) return
    this.mutate(() => {
      k.isRead = true
      k.readAt = new Date().toISOString()
    })
  }

  /** Ändert den Status eines Berichts. Wird als atomare Änderung
   *  persistiert (Ticket "Automatische Speicherung"). */
  setzeBerichtStatus(berichtId: string, status: BerichtStatus): void {
    this.mutate((s) => {
      const bericht = s.berichte.find((b) => b.id === berichtId)
      if (bericht) bericht.status = status
    })
  }

  aktualisiereBericht(berichtId: string, aenderung: Partial<Pick<Bericht, 'name' | 'inhalt' | 'status'>>): void {
    this.mutate((s) => {
      const bericht = s.berichte.find((b) => b.id === berichtId)
      if (!bericht) return
      if (aenderung.name !== undefined) bericht.name = aenderung.name
      if (aenderung.inhalt !== undefined) bericht.inhalt = aenderung.inhalt
      if (aenderung.status !== undefined) bericht.status = aenderung.status
    })
  }

  /** Bericht duplizieren (Ticket "Löschen …" – Aktion "Duplizieren").
   *  Erstellt eine tiefe Kopie mit neuer ID, angehängtem "(Kopie)"-Suffix
   *  im Namen, aktuellem Datum und Status "In Bearbeitung". Anhänge werden
   *  mitkopiert (neue IDs). Der neue Bericht ist ungelesen. */
  dupliziereBericht(berichtId: string): Bericht | null {
    const original = this.state.berichte.find((b) => b.id === berichtId)
    if (!original) return null
    const kopie: Bericht = {
      ...structuredClone(original),
      id: neueId('ber'),
      name: `${original.name} (Kopie)`,
      status: 'In Bearbeitung',
      erstelltAm: new Date().toISOString(),
      autorId: this.state.aktuellerNutzerId,
      empfaenger: [],
      anhaenge: original.anhaenge.map((a) => ({ ...a, id: neueId('anh') })),
      isRead: false,
      readAt: undefined,
    }
    this.mutate((s) => {
      s.berichte = [...s.berichte, kopie]
    })
    return kopie
  }

  /** Löscht einen Bericht endgültig. Nur für Admins vorgesehen; die
   *  Berechtigungsprüfung erfolgt in der UI. */
  loescheBericht(berichtId: string): void {
    this.mutate((s) => {
      s.berichte = s.berichte.filter((b) => b.id !== berichtId)
      // Falls der gerade geöffnete Bericht gelöscht wurde: zurück zur Liste.
      if (s.route.view === 'bericht' && s.route.berichtId === berichtId) {
        s.route = { view: 'berichte' }
      }
    })
  }


  sendeBericht(berichtId: string, empfaengerIds: string[]): void {
    this.mutate((s) => {
      const bericht = s.berichte.find((b) => b.id === berichtId)
      if (!bericht) return
      bericht.empfaenger = empfaengerIds.map((personId) => ({
        personId,
        rolle: erpRepository.ladePerson(personId)?.rolle ?? 'Berater',
      }))
      bericht.status = 'Gesendet'
      const projekt = s.projekte.find((p) => p.id === bericht.projektId)
      if (projekt) projekt.status = 'Beschlussreif'
    })
  }

  fuegeBerichtAnhangHinzu(berichtId: string, name: string, groesseBytes: number): void {
    this.mutate((s) => {
      const bericht = s.berichte.find((b) => b.id === berichtId)
      if (bericht) bericht.anhaenge = [...bericht.anhaenge, { id: neueId('anh'), name, groesseBytes }]
    })
  }

  entferneBerichtAnhang(berichtId: string, anhangId: string): void {
    this.mutate((s) => {
      const bericht = s.berichte.find((b) => b.id === berichtId)
      if (bericht) bericht.anhaenge = bericht.anhaenge.filter((a) => a.id !== anhangId)
    })
  }

  // ---------- Grafiken-Popup ----------

  setzeGrafikenPopup(offen: boolean): void {
    this.mutate((s) => {
      s.ui.grafikenPopupOffen = offen
    })
  }
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children, nutzerId }: { children: ReactNode; nutzerId: string }) {
  const [store] = useState(() => new Store(nutzerId))
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const s = useContext(StoreContext)
  if (!s) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden')
  return s
}

/** Abonniert den Store und liefert den aktuellen Zustand */
export function useApp(): AppState {
  const s = useContext(StoreContext)
  if (!s) throw new Error('useApp muss innerhalb von StoreProvider verwendet werden')
  useSyncExternalStore(s.subscribe, s.getVersion)
  return s.state
}

// ---------- Abgeleitete Hilfen ----------

export function offeneAufgabenFuer(state: AppState, nutzerId: string): KommentarAufgabe[] {
  return state.kommentare.filter(
    (k) => k.typ === 'Aufgabe' && k.zugewiesenAnId === nutzerId && k.aufgabenstatus !== 'Erledigt',
  )
}

/** Aufgaben, die der Nutzer noch nicht als gelesen markiert hat (interne Nutzung). */
export function ungeleseneAufgabenFuer(state: AppState, nutzerId: string): KommentarAufgabe[] {
  return state.kommentare.filter(
    (k) => k.typ === 'Aufgabe' && k.zugewiesenAnId === nutzerId && k.isRead === false,
  )
}

/** Persönliche offene, ungelesene Aufgaben des angemeldeten Nutzers
 *  (Sidebar-Badge). Der Zähler soll die Anzahl der Aufgaben widerspiegeln,
 *  die der Nutzer aktiv "auf dem Tisch" hat – zugewiesen an ihn, noch nicht
 *  angesehen und noch nicht erledigt. */
export function persoenlicheUngeleseneAufgaben(state: AppState, nutzerId: string): KommentarAufgabe[] {
  return state.kommentare.filter(
    (k) =>
      k.typ === 'Aufgabe' &&
      k.zugewiesenAnId === nutzerId &&
      k.isRead === false &&
      (k.aufgabenstatus ?? 'Offen') !== 'Erledigt',
  )
}

/** Persönliche offene Aufgaben (unabhängig vom Gelesen-Status). Wird u. a.
 *  im Dashboard-Widget verwendet. */
export function persoenlicheOffeneAufgaben(state: AppState, nutzerId: string): KommentarAufgabe[] {
  return state.kommentare.filter(
    (k) =>
      k.typ === 'Aufgabe' &&
      k.zugewiesenAnId === nutzerId &&
      (k.aufgabenstatus ?? 'Offen') !== 'Erledigt',
  )
}

/** Berichte, die der Nutzer noch nicht geöffnet hat (Sidebar-Badge). */
export function ungeleseneBerichte(state: AppState): Bericht[] {
  return state.berichte.filter((b) => b.isRead === false)
}

export function szenarienFuerProjekt(state: AppState, projektId: string): Szenario[] {
  const liste = state.szenarien.filter((x) => x.projektId === projektId)
  return [...liste.filter((x) => x.istBasis), ...liste.filter((x) => !x.istBasis)]
}

export function wurzelKommentare(state: AppState, projektId: string): KommentarAufgabe[] {
  return state.kommentare
    .filter((k) => k.projektId === projektId && !k.parentId)
    .sort((a, b) => b.nr - a.nr)
}

export function kommentarThread(state: AppState, wurzel: KommentarAufgabe): KommentarAufgabe[] {
  return [wurzel, ...state.kommentare.filter((k) => k.parentId === wurzel.id)]
}

export function kommentareZuFeld(state: AppState, ref: FeldReferenz): KommentarAufgabe[] {
  return state.kommentare
    .filter((k) => k.feldReferenz && k.feldReferenz.szenarioId === ref.szenarioId && k.feldReferenz.feldKey === ref.feldKey)
    .sort((a, b) => a.zeitstempel.localeCompare(b.zeitstempel))
}

export function schrittRoute(projektId: string, szenarioId: string, schritt: ProzessSchritt): Route {
  return { view: 'projekt', projektId, szenarioId, schritt }
}
