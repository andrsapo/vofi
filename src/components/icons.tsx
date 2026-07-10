/** Kompakte Inline-SVG-Icons (Strichstil wie im Figma-Mockup) */

import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Basis({ size = 18, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconDashboard = (p: P) => (
  <Basis {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Basis>
)

export const IconBericht = (p: P) => (
  <Basis {...p}>
    <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </Basis>
)

export const IconAufgaben = (p: P) => (
  <Basis {...p}>
    <path d="M4 6.5l1.5 1.5L8 5.5" />
    <path d="M4 12.5l1.5 1.5L8 11.5" />
    <path d="M4 18.5l1.5 1.5L8 17.5" />
    <path d="M11 7h9M11 13h9M11 19h9" />
  </Basis>
)

export const IconRisiko = (p: P) => (
  <Basis {...p}>
    <path d="M4 19V5" />
    <path d="M4 6h10l-1.5 3H20l-2 5H8" />
  </Basis>
)

export const IconHilfe = (p: P) => (
  <Basis {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M9 3.5v17" />
  </Basis>
)

export const IconSuche = (p: P) => (
  <Basis {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Basis>
)

export const IconZahnrad = (p: P) => (
  <Basis {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h0a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h0a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v0a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
  </Basis>
)

export const IconPlusKreis = (p: P) => (
  <Basis {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8.5v7M8.5 12h7" />
  </Basis>
)

export const IconPlus = (p: P) => (
  <Basis {...p}>
    <path d="M12 5v14M5 12h14" />
  </Basis>
)

export const IconPapierkorb = (p: P) => (
  <Basis {...p}>
    <path d="M5 7h14" />
    <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
    <path d="M7 7l.8 12a2 2 0 0 0 2 1.9h4.4a2 2 0 0 0 2-1.9L17 7" />
  </Basis>
)

export const IconChevronLinks = (p: P) => (
  <Basis {...p}>
    <path d="M14.5 5.5L8 12l6.5 6.5" />
  </Basis>
)

export const IconChevronUnten = (p: P) => (
  <Basis {...p}>
    <path d="M6 9.5l6 6 6-6" />
  </Basis>
)

export const IconChevronOben = (p: P) => (
  <Basis {...p}>
    <path d="M6 14.5l6-6 6 6" />
  </Basis>
)

export const IconDoppelpfeil = (p: P) => (
  <Basis {...p}>
    <path d="M6.5 5.5L13 12l-6.5 6.5" />
    <path d="M12.5 5.5L19 12l-6.5 6.5" />
  </Basis>
)

export const IconKommentar = (p: P) => (
  <Basis {...p}>
    <path d="M20 12.5a7.5 7.5 0 0 1-7.5 7.5c-1.3 0-2.6-.3-3.7-.9L4 20l.9-4.8A7.5 7.5 0 1 1 20 12.5z" />
  </Basis>
)

export const IconGrafik = (p: P) => (
  <Basis {...p}>
    <path d="M4 19h16" />
    <path d="M5 15l4-5 3.5 3L17 7l2 2.5" />
  </Basis>
)

export const IconGlocke = (p: P) => (
  <Basis {...p}>
    <path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    <path d="M10.3 20a2 2 0 0 0 3.4 0" />
  </Basis>
)

export const IconInfo = (p: P) => (
  <Basis {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <circle cx="12" cy="8" r="0.4" fill="currentColor" />
  </Basis>
)

export const IconFrage = (p: P) => (
  <Basis {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.7 9.5a2.4 2.4 0 0 1 4.6.9c0 1.5-2.2 1.9-2.2 3.4" />
    <circle cx="12" cy="16.8" r="0.4" fill="currentColor" />
  </Basis>
)

export const IconCheckKreis = (p: P) => (
  <Basis {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12.3l2.4 2.4 4.6-5" />
  </Basis>
)

export const IconKamera = (p: P) => (
  <Basis {...p}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </Basis>
)

export const IconSchliessen = (p: P) => (
  <Basis {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Basis>
)

export const IconStift = (p: P) => (
  <Basis {...p}>
    <path d="M4 20l4.5-1L20 7.5a1.9 1.9 0 0 0 0-2.7l-.8-.8a1.9 1.9 0 0 0-2.7 0L5 15.5 4 20z" />
  </Basis>
)

export const IconDownload = (p: P) => (
  <Basis {...p}>
    <path d="M12 4v11" />
    <path d="M7.5 11.5L12 16l4.5-4.5" />
    <path d="M5 19.5h14" />
  </Basis>
)

export const IconSenden = (p: P) => (
  <Basis {...p}>
    <path d="M21 3.5L10.5 13.9" />
    <path d="M21 3.5l-6.8 17-3.7-6.6L3.5 10z" />
  </Basis>
)

export const IconFilter = (p: P) => (
  <Basis {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Basis>
)

export const IconRegler = (p: P) => (
  <Basis {...p}>
    <path d="M5 8h9M18 8h1" />
    <circle cx="16" cy="8" r="2" />
    <path d="M5 16h1M10 16h9" />
    <circle cx="8" cy="16" r="2" />
  </Basis>
)

export const IconMehr = (p: P) => (
  <Basis {...p}>
    <circle cx="12" cy="5.5" r="0.6" fill="currentColor" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    <circle cx="12" cy="18.5" r="0.6" fill="currentColor" />
  </Basis>
)

export const IconGebaeude = (p: P) => (
  <Basis {...p}>
    <path d="M4 20h16" />
    <path d="M6 20V6.5L12 4v16" />
    <path d="M12 8.5l6 2V20" />
    <path d="M8.5 9h1M8.5 12h1M8.5 15h1M14.5 13h1M14.5 16h1" />
  </Basis>
)

export const IconOrdner = (p: P) => (
  <Basis {...p}>
    <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7z" />
  </Basis>
)

export const IconPfeilHoch = (p: P) => (
  <Basis {...p}>
    <path d="M12 19V5M6.5 10.5L12 5l5.5 5.5" />
  </Basis>
)

export const IconPfeilRunter = (p: P) => (
  <Basis {...p}>
    <path d="M12 5v14M6.5 13.5L12 19l5.5-5.5" />
  </Basis>
)

export const IconMinus = (p: P) => (
  <Basis {...p}>
    <path d="M5 12h14" />
  </Basis>
)

export const IconVerlauf = (p: P) => (
  <Basis {...p}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </Basis>
)

// ---------- Direktzugriff-Kacheln (mehrfarbig, kein currentColor) ----------
// Diese Icons folgen dem Mockup und nutzen deshalb feste Farben aus dem
// Design-Token-Set (Primärblau + gelbes Accent + hellere Blautöne).

type DirektIconProps = { size?: number }

/** Assistent: drei gestaffelte Chevron-Pfeile nach rechts, hell nach dunkel. */
export const IconAssistent = ({ size = 36 }: DirektIconProps) => (
  <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
    <path d="M2 8 L13 17 L2 26 L6 17 Z"  fill="#a9c8f7" />
    <path d="M10 8 L21 17 L10 26 L14 17 Z" fill="#5b9bf6" />
    <path d="M18 8 L29 17 L18 26 L22 17 Z" fill="#2f6bd6" />
  </svg>
)

/** Manual: gelber Kreis überlappt mit blauem Kreis. */
export const IconManuell = ({ size = 36 }: DirektIconProps) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="15" cy="15" r="10" fill="var(--color-accent, #F2D551)" />
    <circle cx="25" cy="22" r="10" fill="#1E3A8A" />
    <path d="M25 12 A10 10 0 0 0 15 25 A10 10 0 0 0 25 12 Z" fill="#7C7A66" opacity="0.55" />
  </svg>
)

/** Risikomanagement: zwei sich überlappende Dreiecke, das linke dunkelblau,
 *  das rechte gelb; die Basis liegt unten, Spitzen zeigen an die obere Mitte.
 *  In der Überlappungszone entsteht ein Braun-Ton. */
export const IconRisikoBunt = ({ size = 36 }: DirektIconProps) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    {/* Linkes Dreieck (dunkelblau): oben-links → mittig-oben-rechts → unten-mittig */}
    <path d="M4 6 L26 6 L15 32 Z" fill="#1E3A8A" />
    {/* Rechtes Dreieck (gelb): oben-rechts → mittig-oben-links → unten-mittig */}
    <path d="M36 6 L14 6 L25 32 Z" fill="var(--color-accent, #F2D551)" opacity="0.9" />
    {/* Überlappungszone dezent verstärkt */}
    <path d="M14 6 L26 6 L20 20 Z" fill="#7C6A3C" opacity="0.55" />
  </svg>
)

/** Berichtsvorlagendesigner: navy-Rechteck + blauer Kreis + abgedunkelte Überlappung. */
export const IconBerichtvorlage = ({ size = 36 }: DirektIconProps) => (
  <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
    <rect x="14" y="4" width="14" height="22" fill="#1a2a6e" />
    <circle cx="13" cy="20" r="10" fill="#4d8cf5" />
    <path d="M14 26 L14 12.4 A10 10 0 0 1 17.7 26 Z" fill="#3a6fd8" opacity="0.85" />
  </svg>
)

export const IconMail = (p: P) => (
  <Basis {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="M3 8l9 6 9-6" />
  </Basis>
)

export const IconChatBubble = (p: P) => (
  <Basis {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Basis>
)

export const IconTelefon = (p: P) => (
  <Basis {...p}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2H7a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7A2 2 0 0 1 22 16.9z" />
  </Basis>
)
