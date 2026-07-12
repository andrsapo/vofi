export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#12142a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-family)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Geometrische Dreiecke – Hintergrund */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Linkes blaues Dreieck groß */}
        <polygon points="0,900 420,900 0,520" fill="#4a90d9" opacity="0.85" />
        {/* Linkes blaues Dreieck klein oben */}
        <polygon points="0,520 280,900 0,900" fill="#5b9fd4" opacity="0.5" />
        {/* Mittleres gelbes Dreieck */}
        <polygon points="320,900 560,580 700,900" fill="#f2d551" opacity="0.92" />
        {/* Weißes Dreieck rechts-mitte */}
        <polygon points="560,580 840,580 700,900" fill="#ffffff" opacity="0.90" />
        {/* Rechtes blaues Dreieck */}
        <polygon points="840,580 1100,900 700,900" fill="#4a90d9" opacity="0.80" />
        {/* Rechtes blaues Dreieck groß */}
        <polygon points="980,900 1400,900 1400,560" fill="#4a90d9" opacity="0.75" />
        {/* Kleines gelbes unten rechts */}
        <polygon points="1100,900 1400,900 1400,750" fill="#f2d551" opacity="0.60" />
        {/* Weißes kleines links unten */}
        <polygon points="0,900 180,900 0,780" fill="#ffffff" opacity="0.12" />
      </svg>

      {/* Headline */}
      <div style={{
        position: 'absolute',
        top: '48px',
        left: '56px',
        zIndex: 1,
        userSelect: 'none',
      }}>
        <div style={{
          fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-.03em',
          lineHeight: 1.1,
          marginBottom: '14px',
        }}>
          Willkommen!
        </div>
        <div style={{
          fontSize: 'clamp(.95rem, 1.8vw, 1.15rem)',
          color: 'rgba(255,255,255,.65)',
          fontWeight: 400,
          maxWidth: '540px',
        }}>
          Bereit für kluge Entscheidungen und erfolgreiche Planungen?
        </div>
      </div>

      {/* Formular-Karte */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '420px' }}>
        {children}
      </div>
    </div>
  )
}
