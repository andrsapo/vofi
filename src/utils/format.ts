/** Deutsche Zahlen-/Währungsformatierung für alle Anzeigen */

export function formatZahl(wert: number, nachkommastellen = 2): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: nachkommastellen,
    maximumFractionDigits: nachkommastellen,
  }).format(wert)
}

export function formatEuro(wert: number, nachkommastellen = 2): string {
  return `${formatZahl(wert, nachkommastellen)} €`
}

export function formatEuroKompakt(wert: number): string {
  const abs = Math.abs(wert)
  if (abs >= 1_000_000) return `${formatZahl(wert / 1_000_000, 1)} Mio. €`
  return formatEuro(wert, 0)
}

export function formatGanzzahl(wert: number): string {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(wert)
}

/** Signierte Anzeige wie im Mockup: "+6.245 €" / "-2.245 €" */
export function formatEuroSigniert(wert: number, nachkommastellen = 0): string {
  const vorzeichen = wert > 0 ? '+' : ''
  return `${vorzeichen}${formatZahl(wert, nachkommastellen)} €`
}

/** Parst deutsche Zahleneingaben ("1.859.124,6" → 1859124.6) */
export function parseZahl(eingabe: string): number | null {
  const bereinigt = eingabe.trim().replace(/\./g, '').replace(',', '.')
  if (bereinigt === '' || bereinigt === '-') return null
  const wert = Number(bereinigt)
  return Number.isFinite(wert) ? wert : null
}

export function formatDatum(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDatumKurz(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function formatZeitstempel(iso: string): string {
  const d = new Date(iso)
  const datum = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const zeit = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return `${datum} ${zeit}`
}

let idZaehler = 0
export function neueId(prefix: string): string {
  idZaehler += 1
  return `${prefix}-${Date.now().toString(36)}-${idZaehler}`
}
