/**
 * Einfache SVG-Diagrammkomponenten (Layout gemäß Klickstrecke, Folie 32).
 * Die Daten kommen ausschließlich aus der Stub-Berechnungsschicht –
 * keine fachliche Diagramm-Logik in dieser Ausbaustufe.
 */

import { formatZahl } from '../utils/format'

const SZENARIO_FARBEN = ['var(--color-szenario-1)', 'var(--color-szenario-2)', 'var(--color-szenario-3)', 'var(--color-szenario-4)']

export function szenarioFarbe(index: number): string {
  return SZENARIO_FARBEN[index % SZENARIO_FARBEN.length]
}

export function LinienDiagramm({
  titel,
  serien,
  startJahr = 2022,
  einheit = 'Mio. €',
}: {
  titel: string
  serien: { name: string; werte: number[] }[]
  startJahr?: number
  einheit?: string
}) {
  const breite = 460
  const hoehe = 190
  const padL = 44
  const padR = 12
  const padT = 14
  const padB = 26

  const alleWerte = serien.flatMap((s) => s.werte)
  const min = Math.min(0, ...alleWerte)
  const max = Math.max(0, ...alleWerte)
  const spanne = max - min || 1
  const n = Math.max(...serien.map((s) => s.werte.length), 2)

  const x = (i: number) => padL + (i / (n - 1)) * (breite - padL - padR)
  const y = (w: number) => padT + (1 - (w - min) / spanne) * (hoehe - padT - padB)

  const ticks = 5
  const tickWerte = Array.from({ length: ticks }, (_, i) => min + (spanne / (ticks - 1)) * i)

  return (
    <figure className="chart">
      <figcaption className="chart__titel">
        {titel}
        <span className="chart__expand">⤢</span>
      </figcaption>
      <svg viewBox={`0 0 ${breite} ${hoehe}`} role="img" aria-label={titel}>
        {tickWerte.map((t) => (
          <g key={t}>
            <line x1={padL} x2={breite - padR} y1={y(t)} y2={y(t)} className="chart__gitter" />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" className="chart__achse">
              {formatZahl(t, 0)} {einheit}
            </text>
          </g>
        ))}
        {Array.from({ length: n }, (_, i) => (
          <text key={i} x={x(i)} y={hoehe - 8} textAnchor="middle" className="chart__achse">
            {startJahr + i}
          </text>
        ))}
        {serien.map((s, si) => (
          <polyline
            key={s.name}
            points={s.werte.map((w, i) => `${x(i)},${y(w)}`).join(' ')}
            fill="none"
            stroke={szenarioFarbe(si)}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </figure>
  )
}

export function BalkenGruppe({
  titel,
  eintraege,
  maxWert,
  labelFormat,
}: {
  titel: string
  eintraege: { name: string; wert: number; zeigeLabel?: boolean }[]
  maxWert?: number
  labelFormat: (wert: number) => string
}) {
  const max = maxWert ?? Math.max(...eintraege.map((e) => e.wert), 1)
  return (
    <div className="balken-gruppe">
      <h4>{titel}</h4>
      {eintraege.map((e, i) => (
        <div key={e.name} className="balken-gruppe__zeile">
          <span className="balken-gruppe__name">{e.name}</span>
          <span className="balken-gruppe__spur">
            <span
              className="balken-gruppe__balken"
              style={{ width: `${Math.max((e.wert / max) * 100, 3)}%`, background: szenarioFarbe(i) }}
            />
            {e.zeigeLabel && <span className="balken-gruppe__wert">{labelFormat(e.wert)}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

/** ESG-Ringdiagramm (Dashboard, rein dekorativ) */
export function RingDiagramm({
  wert,
  gruen,
  gelb,
}: {
  wert: number
  gruen: number
  gelb: number
}) {
  const gesamt = Math.max(gruen + gelb, 1)
  const r = 30
  const umfang = 2 * Math.PI * r
  const gruenAnteil = (gruen / gesamt) * umfang
  return (
    <svg viewBox="0 0 80 80" width={84} height={84} role="img" aria-label={`Wert ${wert}`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="9" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="var(--color-szenario-2)"
        strokeWidth="9"
        strokeDasharray={`${gruenAnteil} ${umfang - gruenAnteil}`}
        strokeDashoffset={umfang / 4}
      />
      <text x="40" y="46" textAnchor="middle" className="ring__wert">
        {wert}
      </text>
    </svg>
  )
}
