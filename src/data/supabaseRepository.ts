/**
 * Supabase-Datenschicht – kapselt alle DB-Operationen.
 * Jede Entität wird als JSONB gespeichert, damit sich das TypeScript-Datenmodell
 * ohne DB-Schema-Migration weiterentwickeln kann.
 */

import { supabase } from '../lib/supabaseClient'
import type {
  Bericht,
  KommentarAufgabe,
  ObjektIst,
  Person,
  Projekt,
  Szenario,
  SzenarioDaten,
} from '../types'

// ── Typ für den geladenen App-State ─────────────────────────────────────────

export interface AppDaten {
  projekte: Projekt[]
  objektIst: Record<string, ObjektIst>
  szenarien: Szenario[]
  szenarioDaten: Record<string, SzenarioDaten>
  kommentare: KommentarAufgabe[]
  berichte: Bericht[]
}

// ── Laden ────────────────────────────────────────────────────────────────────

export async function ladeAppDaten(): Promise<AppDaten | null> {
  const [
    { data: projRaw },
    { data: szRaw },
    { data: szDatenRaw },
    { data: oiRaw },
    { data: komRaw },
    { data: berRaw },
  ] = await Promise.all([
    supabase.from('projekte').select('data'),
    supabase.from('szenarien').select('data'),
    supabase.from('szenario_daten').select('szenario_id, data'),
    supabase.from('objekt_ist').select('projekt_id, data'),
    supabase.from('kommentare').select('data'),
    supabase.from('berichte').select('data'),
  ])

  // Alle Tabellen leer → noch keine Daten in der DB
  if (!projRaw || projRaw.length === 0) return null

  const objektIst: Record<string, ObjektIst> = {}
  for (const row of oiRaw ?? []) objektIst[row.projekt_id] = row.data

  const szenarioDaten: Record<string, SzenarioDaten> = {}
  for (const row of szDatenRaw ?? []) szenarioDaten[row.szenario_id] = row.data

  return {
    projekte:     (projRaw ?? []).map((r) => r.data as Projekt),
    szenarien:    (szRaw ?? []).map((r) => r.data as Szenario),
    objektIst,
    szenarioDaten,
    kommentare:   (komRaw ?? []).map((r) => r.data as KommentarAufgabe),
    berichte:     (berRaw ?? []).map((r) => r.data as Bericht),
  }
}

// ── Projekte ─────────────────────────────────────────────────────────────────

export async function upsertProjekt(p: Projekt, oi: ObjektIst): Promise<void> {
  await Promise.all([
    supabase.from('projekte').upsert({ id: p.id, data: p }),
    supabase.from('objekt_ist').upsert({ projekt_id: p.id, data: oi }),
  ])
}

export async function deleteProjekt(id: string): Promise<void> {
  // ON DELETE CASCADE löscht Szenarien, szenario_daten, objekt_ist automatisch
  await supabase.from('projekte').delete().eq('id', id)
}

// ── Szenarien ────────────────────────────────────────────────────────────────

export async function upsertSzenario(s: Szenario, d: SzenarioDaten): Promise<void> {
  await Promise.all([
    supabase.from('szenarien').upsert({ id: s.id, projekt_id: s.projektId, data: s }),
    supabase.from('szenario_daten').upsert({ szenario_id: s.id, data: d }),
  ])
}

export async function deleteSzenario(id: string): Promise<void> {
  await supabase.from('szenarien').delete().eq('id', id)
}

export async function upsertSzenarioDaten(szenarioId: string, d: SzenarioDaten): Promise<void> {
  await supabase.from('szenario_daten').upsert({ szenario_id: szenarioId, data: d })
}

// ── Kommentare & Aufgaben ─────────────────────────────────────────────────────

export async function upsertKommentar(k: KommentarAufgabe): Promise<void> {
  await supabase.from('kommentare').upsert({ id: k.id, projekt_id: k.projektId, data: k })
}

export async function deleteKommentar(id: string): Promise<void> {
  await supabase.from('kommentare').delete().eq('id', id)
}

export async function deleteKommentareVonProjekt(projektId: string): Promise<void> {
  await supabase.from('kommentare').delete().eq('projekt_id', projektId)
}

// ── Berichte ──────────────────────────────────────────────────────────────────

export async function upsertBericht(b: Bericht): Promise<void> {
  await supabase.from('berichte').upsert({ id: b.id, projekt_id: b.projektId, data: b })
}

export async function deleteBericht(id: string): Promise<void> {
  await supabase.from('berichte').delete().eq('id', id)
}

export async function deleteBerichteVonProjekt(projektId: string): Promise<void> {
  await supabase.from('berichte').delete().eq('projekt_id', projektId)
}

// ── Personen ──────────────────────────────────────────────────────────────────

export async function ladePersonenDB(): Promise<Person[]> {
  const { data } = await supabase.from('personen').select('data')
  return (data ?? []).map((r) => r.data as Person)
}

export async function upsertPerson(p: Person): Promise<void> {
  await supabase.from('personen').upsert({ id: p.id, data: p })
}

export async function deletePersonDB(id: string): Promise<void> {
  await supabase.from('personen').delete().eq('id', id)
}

// ── Einmalige Migration aus localStorage ──────────────────────────────────────

export async function migriereLokaldaten(daten: AppDaten, personen: Person[]): Promise<void> {
  // Projekte + ObjektIst
  const projektUpserts = daten.projekte.map((p) =>
    upsertProjekt(p, daten.objektIst[p.id] ?? {})
  )

  // Szenarien + SzenarioDaten (nach Projekten, da FK)
  await Promise.all(projektUpserts)
  const szenarioUpserts = daten.szenarien.map((s) =>
    upsertSzenario(s, daten.szenarioDaten[s.id] ?? ({} as SzenarioDaten))
  )

  // Kommentare + Berichte + Personen (parallel nach Szenarien)
  await Promise.all(szenarioUpserts)
  await Promise.all([
    ...daten.kommentare.map(upsertKommentar),
    ...daten.berichte.map(upsertBericht),
    ...personen.map(upsertPerson),
  ])
}
