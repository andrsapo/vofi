/**
 * Austauschbare Datenschicht: Mock-/In-Memory-Repository, das später gegen eine
 * echte ERP-/Backend-Anbindung ersetzt werden kann. Die UI kennt ausschließlich
 * das `ErpRepository`-Interface.
 */

import type { Person, Rolle } from '../types'

function neueInitialen(name: string): string {
  const teile = name.trim().split(/\s+/)
  if (teile.length >= 2) return (teile[0][0] + teile[teile.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/** Roh-Objektstammdaten, wie sie die ERP-API liefern würde */
export interface ErpObjekt {
  id: string
  name: string
  adresse: string
  baujahr: number
  anzahlWohneinheiten: number
  nutzflaecheWohnen: number
  anzahlGewerbeeinheiten: number
  nutzflaecheGewerbe: number
  anzahlGaragenStellplaetze: number
  grundUndBoden: number
  gebaeudeInklNebenkosten: number
  ausstattung: number
  anschaffungsHerstellungskosten: number
  rndJahre: number
  energieeffizienzklasse: string
  co2AusstossKgM2a: number
  jahresnettokaltmiete: number
  durchschnittlicheM2Miete: number
  mietausfallProzent: number
  leerstandMonate: number
  grundstuecksflaecheM2: number
  bodenwertEurM2: number
}

export interface ErpRepository {
  ladeObjekte(): ErpObjekt[]
  ladeObjekt(id: string): ErpObjekt | undefined
  ladePersonen(): Person[]
  ladePerson(id: string): Person | undefined
  ladePersonenNachRolle(rolle: Rolle): Person[]
  aktualisierePerson(person: Person): void
  loeschePerson(id: string): void
  fuegePersonHinzu(person: Person): void
}

/** Werte angelehnt an die Klickstrecke (Herdweg 52, Folien 9–20) */
const MOCK_OBJEKTE: ErpObjekt[] = [
  {
    id: 'obj-herdweg-52',
    name: 'Herdweg 52',
    adresse: 'Herdweg 52, 70174 Stuttgart',
    baujahr: 1998,
    anzahlWohneinheiten: 5,
    nutzflaecheWohnen: 734,
    anzahlGewerbeeinheiten: 2,
    nutzflaecheGewerbe: 870,
    anzahlGaragenStellplaetze: 15,
    grundUndBoden: 420862.0,
    gebaeudeInklNebenkosten: 1894342.0,
    ausstattung: 4876.62,
    anschaffungsHerstellungskosten: 2859876.6,
    rndJahre: 23,
    energieeffizienzklasse: 'B',
    co2AusstossKgM2a: 28.58,
    jahresnettokaltmiete: 72500.89,
    durchschnittlicheM2Miete: 9.5,
    mietausfallProzent: 2,
    leerstandMonate: 1.5,
    grundstuecksflaecheM2: 1245,
    bodenwertEurM2: 2380,
  },
  {
    id: 'obj-wilhelmsplatz',
    name: 'Wilhelmsplatz 3',
    adresse: 'Wilhelmsplatz 3, 70182 Stuttgart',
    baujahr: 1976,
    anzahlWohneinheiten: 12,
    nutzflaecheWohnen: 1120,
    anzahlGewerbeeinheiten: 1,
    nutzflaecheGewerbe: 240,
    anzahlGaragenStellplaetze: 8,
    grundUndBoden: 611200.0,
    gebaeudeInklNebenkosten: 2410550.0,
    ausstattung: 12890.4,
    anschaffungsHerstellungskosten: 3034640.4,
    rndJahre: 18,
    energieeffizienzklasse: 'D',
    co2AusstossKgM2a: 44.1,
    jahresnettokaltmiete: 118400.0,
    durchschnittlicheM2Miete: 8.7,
    mietausfallProzent: 3,
    leerstandMonate: 2,
    grundstuecksflaecheM2: 980,
    bodenwertEurM2: 2610,
  },
  {
    id: 'obj-lindenstrasse',
    name: 'Lindenstraße 14',
    adresse: 'Lindenstraße 14, 70563 Stuttgart',
    baujahr: 2004,
    anzahlWohneinheiten: 8,
    nutzflaecheWohnen: 692,
    anzahlGewerbeeinheiten: 0,
    nutzflaecheGewerbe: 0,
    anzahlGaragenStellplaetze: 10,
    grundUndBoden: 388000.0,
    gebaeudeInklNebenkosten: 1633200.0,
    ausstattung: 8420.0,
    anschaffungsHerstellungskosten: 2029620.0,
    rndJahre: 34,
    energieeffizienzklasse: 'C',
    co2AusstossKgM2a: 31.2,
    jahresnettokaltmiete: 64980.0,
    durchschnittlicheM2Miete: 10.4,
    mietausfallProzent: 1.5,
    leerstandMonate: 1,
    grundstuecksflaecheM2: 810,
    bodenwertEurM2: 2150,
  },
]

const STORAGE_KEY = 'immology.personen'

const PERSONEN_INITIAL: Person[] = [
  { id: 'p-herbert', name: 'Herbert Zimmermann', rolle: 'Sachbearbeiter', initialen: 'HZ', farbe: '#5b8def', istAdmin: true },
  { id: 'p-emilia', name: 'Emilia Fischer', rolle: 'AR', initialen: 'EF', farbe: '#e8964b' },
  { id: 'p-jenny', name: 'Jenny Wilson', rolle: 'AR', initialen: 'JW', farbe: '#9a6ee8' },
  {
    id: 'p-miriam', name: 'Miriam Schmidt', rolle: 'Manager', initialen: 'MS', farbe: '#2f9ec4',
    bio: 'Miriam leitet komplexe Modernisierungs- und Investitionsprojekte und begleitet Eigentümer von der ersten Kalkulation bis zum Beschluss. Ihr Schwerpunkt liegt auf wirtschaftlichen Sanierungsstrategien.',
    fachgebiet: 'Investitionsplanung', standort: 'Stuttgart', sprachen: 'DE, EN',
    email: 'm.schmidt@immology.de', telefon: '+49 711 234 567', linkedin: 'https://linkedin.com/in/miriam-schmidt',
  },
  {
    id: 'p-annette', name: 'Annette Black', rolle: 'Manager', initialen: 'AB', farbe: '#2fae7e',
    bio: 'Annette verantwortet die strategische Projektsteuerung und unterstützt Kunden bei der Portfoliooptimierung mit Fokus auf ESG-konforme Immobilienbewirtschaftung.',
    fachgebiet: 'Portfoliomanagement', standort: 'Frankfurt', sprachen: 'DE, EN, FR',
    email: 'a.black@immology.de', telefon: '+49 69 123 456', linkedin: 'https://linkedin.com/in/annette-black',
  },
  {
    id: 'p-anna', name: 'Anna Rita Müller', rolle: 'Manager', initialen: 'AM', farbe: '#d2699e',
    bio: 'Anna Rita begleitet Neubauprojekte von der Konzeptphase bis zur Fertigstellung und bringt tiefgreifende Erfahrung in der Projektkalkulation und Finanzierungsstrukturierung mit.',
    fachgebiet: 'Projektentwicklung', standort: 'München', sprachen: 'DE, IT',
    email: 'a.mueller@immology.de', telefon: '+49 89 876 543', linkedin: 'https://linkedin.com/in/anna-rita-mueller',
  },
  {
    id: 'p-robert', name: 'Robert Glaser', rolle: 'Berater', initialen: 'RG', farbe: '#7a86d6',
    bio: 'Robert ist spezialisiert auf die Analyse und Bewertung von Gewerbeimmobilien und unterstützt Kunden bei Due-Diligence-Prozessen und Transaktionsbegleitung.',
    fachgebiet: 'Gewerbeimmobilien', standort: 'Berlin', sprachen: 'DE, EN',
    email: 'r.glaser@immology.de', telefon: '+49 30 555 789', linkedin: 'https://linkedin.com/in/robert-glaser',
  },
  {
    id: 'p-paul', name: 'Paul Hoffmann', rolle: 'Berater', initialen: 'PH', farbe: '#b0873c',
    bio: 'Paul berät Wohnungsbaugesellschaften und private Investoren in Fragen der Modernisierungsplanung, Fördermittelbeantragung und energetischen Sanierung.',
    fachgebiet: 'Wohnimmobilien', standort: 'Hamburg', sprachen: 'DE',
    email: 'p.hoffmann@immology.de', telefon: '+49 40 321 654', linkedin: 'https://linkedin.com/in/paul-hoffmann',
  },
]

function ladeAusStorage(): Person[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Person[]
  } catch { /* ignore */ }
  return PERSONEN_INITIAL.map((p) => ({ ...p }))
}

function speichereInStorage(personen: Person[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(personen))
  } catch { /* ignore */ }
}

/** Personen wie im Sende-Dialog der Klickstrecke (Folie 34) */
let MOCK_PERSONEN: Person[] = ladeAusStorage()

class MockErpRepository implements ErpRepository {
  ladeObjekte(): ErpObjekt[] {
    return MOCK_OBJEKTE
  }
  ladeObjekt(id: string): ErpObjekt | undefined {
    return MOCK_OBJEKTE.find((o) => o.id === id)
  }
  ladePersonen(): Person[] {
    return MOCK_PERSONEN
  }
  ladePerson(id: string): Person | undefined {
    return MOCK_PERSONEN.find((p) => p.id === id)
  }
  ladePersonenNachRolle(rolle: Rolle): Person[] {
    return MOCK_PERSONEN.filter((p) => p.rolle === rolle)
  }
  aktualisierePerson(person: Person): void {
    const idx = MOCK_PERSONEN.findIndex((p) => p.id === person.id)
    if (idx !== -1) {
      MOCK_PERSONEN[idx] = person
      speichereInStorage(MOCK_PERSONEN)
      window.dispatchEvent(new CustomEvent('erpchange'))
      import('./supabaseRepository').then(({ upsertPerson }) => upsertPerson(person)).catch(() => {})
    }
  }
  loeschePerson(id: string): void {
    MOCK_PERSONEN = MOCK_PERSONEN.filter((p) => p.id !== id)
    speichereInStorage(MOCK_PERSONEN)
    window.dispatchEvent(new CustomEvent('erpchange'))
    import('./supabaseRepository').then(({ deletePersonDB }) => deletePersonDB(id)).catch(() => {})
  }
  fuegePersonHinzu(person: Person): void {
    MOCK_PERSONEN.push(person)
    speichereInStorage(MOCK_PERSONEN)
    window.dispatchEvent(new CustomEvent('erpchange'))
    import('./supabaseRepository').then(({ upsertPerson }) => upsertPerson(person)).catch(() => {})
  }
}

export const erpRepository: ErpRepository = new MockErpRepository()

/** Lädt Personen aus der DB und synchronisiert mit dem In-Memory-Cache.
 *  Wird beim App-Start in BootstrapLayer aufgerufen. */
export async function ladeUndSyncPersonen(): Promise<void> {
  try {
    const { ladePersonenDB } = await import('./supabaseRepository')
    const dbPersonen = await ladePersonenDB()
    if (dbPersonen.length > 0) {
      MOCK_PERSONEN = dbPersonen
      speichereInStorage(MOCK_PERSONEN)
      window.dispatchEvent(new CustomEvent('erpchange'))
    } else {
      // DB leer → lokale Personen in DB hochladen
      const { upsertPerson } = await import('./supabaseRepository')
      await Promise.all(MOCK_PERSONEN.map(upsertPerson))
    }
  } catch (e) {
    console.warn('[erpRepository] DB-Sync fehlgeschlagen, verwende localStorage:', e)
  }
}

/** Stellt sicher, dass ein Supabase-Nutzer als Person in localStorage existiert.
 *  Wird einmalig nach dem Login aufgerufen. */
export function sicherstelleNutzer(supabaseUser: { id: string; email: string; name?: string; rolle?: string }): void {
  const vorhanden = MOCK_PERSONEN.find((p) => p.id === supabaseUser.id)
  if (vorhanden) {
    // Name + Rolle aus Metadaten aktualisieren falls vorhanden
    let changed = false
    if (supabaseUser.name && vorhanden.name !== supabaseUser.name) {
      vorhanden.name = supabaseUser.name
      vorhanden.initialen = neueInitialen(supabaseUser.name)
      changed = true
    }
    if (supabaseUser.rolle && vorhanden.rolle !== supabaseUser.rolle) {
      vorhanden.rolle = supabaseUser.rolle as Person['rolle']
      vorhanden.istAdmin = supabaseUser.rolle === 'Administrator'
      changed = true
    }
    if (changed) {
      speichereInStorage(MOCK_PERSONEN)
      window.dispatchEvent(new CustomEvent('erpchange'))
    }
    return
  }
  const nameRaw = supabaseUser.name || supabaseUser.email.split('@')[0]
  const rolle = (supabaseUser.rolle as Person['rolle']) || 'Administrator'
  const person: Person = {
    id: supabaseUser.id,
    name: nameRaw,
    rolle,
    initialen: neueInitialen(nameRaw),
    farbe: '#5b8def',
    istAdmin: rolle === 'Administrator',
    email: supabaseUser.email,
  }
  MOCK_PERSONEN.push(person)
  speichereInStorage(MOCK_PERSONEN)
  window.dispatchEvent(new CustomEvent('erpchange'))
}
