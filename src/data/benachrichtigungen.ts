/**
 * Benachrichtigungscenter (Trigger: Glocke in der TopBar).
 *
 * Die Struktur ist so gehalten, dass sie später durch eine echte Datenquelle
 * ersetzt werden kann, ohne die UI zu ändern. Für den aktuellen Stand
 * (persistente Anwendung ohne Demo-Inhalte) startet die Liste leer –
 * Benachrichtigungen entstehen erst durch echte Ereignisse in der
 * Anwendung (Kommentare, Berichtsstatus etc.).
 */

export type BenachrichtigungTyp = 'system' | 'project'

export interface Benachrichtigung {
  id: string
  type: BenachrichtigungTyp
  title: string
  message: string
  project: string
  createdAt: string
  read: boolean
  /** Optionaler Badge (z. B. "Beschlossen", "Beschlussreif"). */
  badge?: { text: string; ton: 'beschlossen' | 'beschlussreif' | 'info' }
  /** Personen-IDs für Avatar-Anzeige; leere Liste → generisches Icon. */
  personenIds?: string[]
  /** Sammel-Anzeige "Xoxo und Y" statt Einzelavatar-Text. */
  personenLabel?: string
  /** Für System-Typen: Icon-Kategorie zur Darstellung. */
  systemKategorie?: 'bericht' | 'projekt'
}

export const BENACHRICHTIGUNGEN_SEED: Benachrichtigung[] = []
