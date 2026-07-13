/** Wurzelkomponente: Sidebar + interne Routen */

import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { FeldKontextProvider } from './components/felder'
import { useApp, useStore } from './state/store'
import { Assistent } from './screens/Assistent'
import { AufgabenListe } from './screens/AufgabenListe'
import { BerichtAnsicht } from './screens/BerichtAnsicht'
import { BerichteListe } from './screens/BerichteListe'
import { Dashboard } from './screens/Dashboard'
import { ProjektLayout } from './screens/ProjektLayout'
import { Schritt1IstZustand } from './screens/Schritt1IstZustand'
import { Schritt2Objektdaten } from './screens/Schritt2Objektdaten'
import { Schritt3Ertraege } from './screens/Schritt3Ertraege'
import { Schritt4Finanzierung } from './screens/Schritt4Finanzierung'
import { SzenarienAnalyse } from './screens/SzenarienAnalyse'

export default function App() {
  const app = useApp()
  const route = app.route

  return (
    <div className="app">
      <Sidebar />
      <main className="app__inhalt">
        {route.view === 'dashboard' && <Dashboard />}
        {route.view === 'assistent' && <Assistent />}
        {route.view === 'berichte' && <BerichteListe />}
        {route.view === 'aufgaben' && <AufgabenListe />}
        {route.view === 'bericht' && <BerichtRoute berichtId={route.berichtId} />}
        {route.view === 'projekt' && (
          <ProjektRoute projektId={route.projektId} szenarioId={route.szenarioId} schritt={route.schritt} />
        )}
        {route.view === 'analyse' && <AnalyseRoute projektId={route.projektId} />}
      </main>
    </div>
  )
}

function ProjektRoute({
  projektId,
  szenarioId,
  schritt,
}: {
  projektId: string
  szenarioId: string
  schritt: 1 | 2 | 3 | 4
}) {
  const app = useApp()
  const store = useStore()
  const projekt = app.projekte.find((p) => p.id === projektId)
  const szenario = app.szenarien.find((s) => s.id === szenarioId)

  // Szenario-ID ungültig → korrigiere auf erstes verfügbares Szenario des Projekts
  // (passiert wenn DB-Daten nach localStorage-Stand abweichen)
  useEffect(() => {
    if (projekt && !szenario) {
      const erstesSzenario = app.szenarien.find((s) => s.projektId === projektId)
      if (erstesSzenario) {
        store.navigiere({ view: 'projekt', projektId, szenarioId: erstesSzenario.id, schritt: 1 })
      } else {
        store.navigiere({ view: 'dashboard' })
      }
    }
  }, [projektId, szenarioId, !!szenario])

  if (!projekt || !szenario) return null

  // Einheitliche Navigations-Fußleiste für alle Prozessschritte.
  // Rendering an genau einer Stelle (ProjektLayout__fuss) → Buttons springen
  // zwischen Seiten nicht mehr in Position oder Reihenfolge.
  const zuSchritt = (ziel: 1 | 2 | 3 | 4) =>
    store.navigiere({ view: 'projekt', projektId, szenarioId, schritt: ziel })

  const zurueck = schritt === 1 ? null : (
    <button type="button" className="btn" onClick={() => zuSchritt((schritt - 1) as 1 | 2 | 3)}>
      Zurück
    </button>
  )
  const weiter =
    schritt === 4 ? (
      <button
        type="button"
        className="btn btn--primaer"
        onClick={() => store.navigiere({ view: 'analyse', projektId })}
      >
        Weiter
      </button>
    ) : (
      <button
        type="button"
        className="btn btn--primaer"
        onClick={() => zuSchritt((schritt + 1) as 2 | 3 | 4)}
      >
        Weiter
      </button>
    )

  return (
    <FeldKontextProvider
      wert={{ projektId, szenarioId, schritt, szenarioName: szenario.name }}
    >
      <ProjektLayout
        projekt={projekt}
        fussRechts={
          <>
            {zurueck}
            {weiter}
          </>
        }
      >
        {schritt === 1 && <Schritt1IstZustand projekt={projekt} />}
        {schritt === 2 && <Schritt2Objektdaten projekt={projekt} />}
        {schritt === 3 && <Schritt3Ertraege projekt={projekt} />}
        {schritt === 4 && <Schritt4Finanzierung projekt={projekt} />}
      </ProjektLayout>
    </FeldKontextProvider>
  )
}

function AnalyseRoute({ projektId }: { projektId: string }) {
  const app = useApp()
  const projekt = app.projekte.find((p) => p.id === projektId)
  if (!projekt) return <Dashboard />
  return <SzenarienAnalyse projekt={projekt} />
}

function BerichtRoute({ berichtId }: { berichtId: string }) {
  const app = useApp()
  const bericht = app.berichte.find((b) => b.id === berichtId)
  if (!bericht) return <BerichteListe />
  return <BerichtAnsicht bericht={bericht} />
}
