import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Projekt } from '../types'
import { szenarienFuerProjekt, useApp, useStore } from '../state/store'
import { ProjektTopBar } from '../components/TopBar'
import { SzenarienNav } from '../components/SzenarienNav'
import { KommentarPanel } from '../components/KommentarPanel'
import { HilfePanelProvider, HilfePanelContext, useHilfePanel } from '../components/HilfePanelContext'
import { HilfePanelMultiTab } from '../components/HilfePanelMultiTab'
import { Modal } from '../components/ui'
import { BalkenGruppe, LinienDiagramm, szenarioFarbe } from '../components/charts'
import { berechnung } from '../calc/berechnung'
import { formatZahl } from '../utils/format'

export function ProjektLayout({
  projekt,
  children,
  fussLinks,
  fussRechts,
}: {
  projekt: Projekt
  children: ReactNode
  fussLinks?: ReactNode
  fussRechts?: ReactNode
}) {
  return (
    <HilfePanelProvider>
      <ProjektLayoutInner projekt={projekt} fussLinks={fussLinks} fussRechts={fussRechts}>
        {children}
      </ProjektLayoutInner>
    </HilfePanelProvider>
  )
}

function ProjektLayoutInner({
  projekt,
  children,
  fussLinks,
  fussRechts,
}: {
  projekt: Projekt
  children: ReactNode
  fussLinks?: ReactNode
  fussRechts?: ReactNode
}) {
  const app = useApp()
  const store = useStore()
  const hilfe = useHilfePanel()
  const [panelBreite, setPanelBreite] = useState(300)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startBreite = useRef(300)

  function onDragStart(e: React.MouseEvent) {
    isDragging.current = true
    startX.current = e.clientX
    startBreite.current = panelBreite
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    function onMove(ev: MouseEvent) {
      if (!isDragging.current) return
      const delta = startX.current - ev.clientX
      const neu = Math.max(220, Math.min(600, startBreite.current + delta))
      setPanelBreite(neu)
    }
    function onUp() {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    if (app.ui.rechtePanelAnsicht === 'kommentare') hilfe.schliesse()
  }, [app.ui.rechtePanelAnsicht])

  return (
    <HilfePanelContext.Provider value={{
      offen: hilfe.offen,
      tabs: hilfe.tabs,
      aktiverTabId: hilfe.aktiverTabId,
      oeffne: (tab) => { store.schliesseKommentare(); hilfe.oeffne(tab) },
      schliesse: hilfe.schliesse,
      schliesseTab: hilfe.schliesseTab,
      setAktiverTab: hilfe.setAktiverTab,
    }}>
    <div className="seite">
      <ProjektTopBar
        projekt={projekt}
        onZurueck={() => store.navigiere({ view: 'dashboard' })}
      />
      <div className="projekt-layout">
        <div className="projekt-layout__inhalt">
          <div className="projekt-layout__scroll">{children}</div>
          <div className="projekt-layout__fuss">
            <div className="projekt-layout__fuss-links">{fussLinks}</div>
            <div className="projekt-layout__fuss-rechts">{fussRechts}</div>
          </div>
        </div>
        <div className="projekt-layout__panel-wrapper" style={{ width: panelBreite, flexShrink: 0 }}>
          <div className="projekt-layout__drag-handle" onMouseDown={onDragStart} />
          {hilfe.offen ? (
            <HilfePanelMultiTab onPanelClose={hilfe.schliesse} />
          ) : app.ui.rechtePanelAnsicht === 'kommentare' ? (
            <KommentarPanel projekt={projekt} />
          ) : (
            <SzenarienNav projekt={projekt} />
          )}
        </div>
      </div>

      {app.ui.grafikenPopupOffen && <GrafikenPopup projekt={projekt} />}
    </div>
    </HilfePanelContext.Provider>
  )
}

/** "Grafiken"-Popup (Folie 18): Diagramme mit Stub-Daten je Szenario */
function GrafikenPopup({ projekt }: { projekt: Projekt }) {
  const app = useApp()
  const store = useStore()
  const jahre = projekt.betrachtungszeitraumJahre
  const szenarien = szenarienFuerProjekt(app, projekt.id)
  // Für jedes Szenario eine eigene Serie in den Diagrammen.
  const linienSerien = szenarien.map((s, i) => ({
    name: s.name,
    werteJahresergebnisse: berechnung.jahresergebnisse(i, jahre),
    werteCashflows: berechnung.cashflows(i, jahre),
    ekRendite: berechnung.eigenkapitalrendite(i),
    endwert: berechnung.endwert(i),
  }))
  return (
    <Modal titel="Grafiken" breite={1020} onClose={() => store.setzeGrafikenPopup(false)}>
      <p className="hinweis-dezent">
        Vorschau mit Platzhalterwerten – die fachliche Berechnungslogik folgt in einer späteren Ausbaustufe.
      </p>
      <div className="grafiken-legende">
        {szenarien.map((s, i) => (
          <span key={s.id} className="grafiken-legende__eintrag">
            <i className="grafiken-legende__punkt" style={{ background: szenarioFarbe(i) }} />
            {s.name}
          </span>
        ))}
      </div>
      <div className="grafiken-raster">
        <LinienDiagramm
          titel="Jahresergebnisse"
          serien={linienSerien.map((l) => ({ name: l.name, werte: l.werteJahresergebnisse }))}
        />
        <LinienDiagramm
          titel="Cashflows"
          serien={linienSerien.map((l) => ({ name: l.name, werte: l.werteCashflows }))}
        />
        <BalkenGruppe
          titel="Eigenkapitalrendite"
          eintraege={linienSerien.map((l) => ({ name: l.name, wert: l.ekRendite, zeigeLabel: true }))}
          maxWert={5}
          labelFormat={(w) => `${formatZahl(w, 1)}%`}
        />
        <BalkenGruppe
          titel="Endwert am Ende des Betrachtungszeitraums"
          eintraege={linienSerien.map((l) => ({ name: l.name, wert: l.endwert, zeigeLabel: true }))}
          maxWert={8}
          labelFormat={(w) => `${formatZahl(w, 1)} Mio. €`}
        />
      </div>
    </Modal>
  )
}
