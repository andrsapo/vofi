import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    emailjs: any
  }
}

const EMAILJS_KEY = 'kFAoFsSYn72fIp3Cl'
const SERVICE_ID  = 'service_190370'

const DAYS  = [
  { wd: 'Mo', date: '13.07.' },
  { wd: 'Di', date: '14.07.' },
  { wd: 'Mi', date: '15.07.' },
  { wd: 'Do', date: '16.07.' },
  { wd: 'Fr', date: '17.07.' },
]
const TIMES = ['09:00','09:30','10:00','11:00','13:30','14:00','15:30','16:00']
const TAKEN_BY_DAY = [[1,4],[0,5,6],[2],[3,7],[1,2,6]]
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

interface DemoBuchenModalProps {
  open: boolean
  onClose: () => void
}

export function DemoBuchenModal({ open, onClose }: DemoBuchenModalProps) {
  const bodyRef   = useRef<HTMLDivElement>(null)
  const tabBRef   = useRef<HTMLButtonElement>(null)
  const tabARef   = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Load EmailJS once
  useEffect(() => {
    if (window.emailjs) return
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
    s.onload = () => window.emailjs?.init(EMAILJS_KEY)
    document.head.appendChild(s)
  }, [])

  // Run the modal engine whenever it opens
  useEffect(() => {
    if (!open) return
    const body    = bodyRef.current!
    const tabB    = tabBRef.current!
    const tabA    = tabARef.current!

    const s = {
      tab: 'buchen' as 'buchen' | 'anfragen',
      step: 'select' as 'select' | 'details' | 'done',
      dayIdx: 0, slotIdx: -1,
      name: '', email: '', company: '', note: '',
      reqName: '', reqEmail: '',
      sent: false,
    }

    function h(tag: string, attrs: Record<string, any> = {}, ...children: (HTMLElement | string | null)[]): HTMLElement {
      const el = document.createElement(tag)
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'className') el.className = v
        else if (k === 'style') el.style.cssText = v
        else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v)
        else el.setAttribute(k, String(v))
      }
      for (const c of children) {
        if (c == null) continue
        el.append(typeof c === 'string' ? document.createTextNode(c) : c)
      }
      return el
    }

    function pickedLabel() {
      if (s.slotIdx < 0) return ''
      const d = DAYS[s.dayIdx]
      return `${d.wd}, ${d.date}2026 · ${TIMES[s.slotIdx]} Uhr`
    }

    function renderSteps() {
      const stepDef = [
        { label: 'Termin wählen', key: 'select' },
        { label: 'Ihre Daten',    key: 'details' },
        { label: 'Bestätigung',   key: 'done'    },
      ]
      const order = ['select','details','done']
      const curIdx = order.indexOf(s.step)
      const wrap = h('div', { className: 'dm-steps' })
      stepDef.forEach((step, i) => {
        const done   = i < curIdx
        const active = i === curIdx
        const numBg    = done ? '#eaf6ee' : active ? '#12142a' : '#eceef4'
        const numColor = done ? '#2f9e5f' : active ? '#f6c945' : '#9aa0af'
        const txtColor = done ? '#2f9e5f' : active ? '#12142a' : '#9aa0af'
        const stepEl = h('span', { className: 'dm-step', style: `color:${txtColor}` },
          h('span', { className: 'dm-step-num', style: `background:${numBg};color:${numColor}` }, done ? '✓' : String(i+1)),
          step.label
        )
        wrap.append(stepEl)
        if (i < stepDef.length - 1) wrap.append(h('span', { className: 'dm-step-line' }))
      })
      return wrap
    }

    function renderSelect() {
      const taken = TAKEN_BY_DAY[s.dayIdx] || []
      const daysEl = h('div', { className: 'dm-days' },
        ...DAYS.map((d, i) => {
          const sel = i === s.dayIdx
          const btn = h('button', { className: 'dm-day' + (sel ? ' dm-sel' : ''), type: 'button' },
            h('div', { className: 'dm-day-wd' }, d.wd),
            h('div', { className: 'dm-day-dt' }, d.date)
          )
          btn.addEventListener('click', () => { s.dayIdx = i; s.slotIdx = -1; render() })
          return btn
        })
      )
      const slotsEl = h('div', { className: 'dm-slots' },
        ...TIMES.map((t, i) => {
          const isTaken = taken.includes(i)
          const isSel   = i === s.slotIdx
          const cls = 'dm-slot' + (isTaken ? ' dm-taken' : isSel ? ' dm-sel' : '')
          const btn = h('button', { className: cls, type: 'button' }, t) as HTMLButtonElement
          if (isTaken) btn.disabled = true
          else btn.addEventListener('click', () => { s.slotIdx = i; render() })
          return btn
        })
      )
      const hasSlot = s.slotIdx >= 0
      const hint = hasSlot
        ? `Ausgewählt: ${DAYS[s.dayIdx].wd}, ${DAYS[s.dayIdx].date}2026 · ${TIMES[s.slotIdx]} Uhr`
        : 'Bitte Tag und Uhrzeit wählen.'
      const ctaBtn = h('button', { className: 'dm-cta' + (hasSlot ? ' dm-cta-primary' : ''), type: 'button' }, 'Weiter zu Ihren Daten →') as HTMLButtonElement
      if (!hasSlot) ctaBtn.disabled = true
      ctaBtn.addEventListener('click', () => { if (hasSlot) { s.step = 'details'; render() } })
      return h('div', {},
        h('div', { style: 'font-size:14px;font-weight:600;color:#12142a;margin-bottom:12px' }, 'Tag wählen'),
        daysEl,
        h('div', { style: 'font-size:14px;font-weight:600;color:#12142a;margin-bottom:12px' },
          'Uhrzeit wählen ', h('span', { style: 'font-weight:400;color:#6b7180' }, '(MEZ)')
        ),
        slotsEl,
        h('div', { className: 'dm-foot' }, h('div', { className: 'dm-foot-hint' }, hint), ctaBtn)
      )
    }

    function renderDetails() {
      const apptCard = h('div', { className: 'dm-appt' },
        h('div', { style: 'display:flex;align-items:center;gap:12px' },
          h('div', { className: 'dm-appt-icon' }, '📅'),
          h('div', {},
            h('div', { style: 'font-size:14.5px;font-weight:700;color:#12142a' }, pickedLabel()),
            h('div', { style: 'font-size:12.5px;color:#6b7180' }, '30 Min. Videocall · M. Berger')
          )
        ),
        (() => { const btn = h('button', { className: 'dm-appt-change', type: 'button' }, 'Ändern'); btn.addEventListener('click', () => { s.step = 'select'; render() }); return btn })()
      )
      const nameInput    = h('input', { className: 'dm-input', type: 'text', placeholder: 'Vor- und Nachname', value: s.name }) as HTMLInputElement
      const companyInput = h('input', { className: 'dm-input', type: 'text', placeholder: 'z. B. Wohnbau GmbH', value: s.company }) as HTMLInputElement
      const emailInput   = h('input', { className: 'dm-input', type: 'email', placeholder: 'name@unternehmen.de', value: s.email }) as HTMLInputElement
      const noteInput    = h('input', { className: 'dm-input', type: 'text', placeholder: 'z. B. Steuermodellierung, Portfolio-Import …', value: s.note }) as HTMLInputElement

      const bookOk = () => nameInput.value.trim().length > 1 && EMAIL_RE.test(emailInput.value.trim())
      const bookBtn = h('button', { className: 'dm-cta', type: 'button' }, 'Verbindlich buchen →') as HTMLButtonElement
      bookBtn.disabled = true

      function updateBookBtn() {
        const ok = bookOk()
        bookBtn.disabled = !ok
        bookBtn.className = 'dm-cta' + (ok ? ' dm-cta-primary' : '')
      }
      nameInput.addEventListener('input',    () => { s.name    = nameInput.value;    updateBookBtn() })
      companyInput.addEventListener('input', () => { s.company = companyInput.value })
      emailInput.addEventListener('input',   () => { s.email   = emailInput.value;   updateBookBtn() })
      noteInput.addEventListener('input',    () => { s.note    = noteInput.value })

      bookBtn.addEventListener('click', () => {
        if (!bookOk()) return
        s.name = nameInput.value; s.email = emailInput.value
        s.company = companyInput.value; s.note = noteInput.value
        s.step = 'done'; render()
        window.emailjs?.send(SERVICE_ID, 'template_demo', {
          termin: pickedLabel(), name: s.name.trim(), email: s.email.trim(),
          company: s.company.trim() || '–', note: s.note.trim() || '–',
        }).catch((e: unknown) => console.error('[emailjs]', e))
      })

      return h('div', {},
        apptCard,
        h('div', { className: 'dm-grid2' },
          h('label', { className: 'dm-label', style: 'margin-bottom:0' }, 'Name*', nameInput),
          h('label', { className: 'dm-label', style: 'margin-bottom:0' }, 'Unternehmen', companyInput)
        ),
        h('label', { className: 'dm-label' }, 'Geschäftliche E-Mail*', emailInput),
        h('label', { className: 'dm-label' },
          h('span', {}, 'Worauf sollen wir eingehen? ', h('span', { style: 'font-weight:400;color:#6b7180' }, '(optional)')),
          noteInput
        ),
        h('div', { className: 'dm-foot', style: 'padding-top:20px' },
          h('div', { className: 'dm-privacy' },
            'Mit der Buchung stimmen Sie der Verarbeitung gemäß ', h('a', { href: '#' }, 'Datenschutzerklärung'), ' zu.'
          ),
          bookBtn
        )
      )
    }

    function renderDone() {
      const d = DAYS[s.dayIdx]; const t = TIMES[s.slotIdx] || ''
      const detail = `${d.wd}, ${d.date}2026 um ${t} Uhr – 30 Minuten Videocall mit M. Berger, Produktberatung immology.`
      const resetBtn = h('button', { className: 'dm-btn-sec', type: 'button' }, 'Termin ändern')
      resetBtn.addEventListener('click', () => { s.step = 'select'; render() })
      const calBtn = h('button', { className: 'dm-btn-dark', type: 'button' }, '+ Zum Kalender hinzufügen')
      calBtn.addEventListener('click', () => {
        const parts = d.date.split('.'); const day = parts[0].padStart(2,'0'); const month = parts[1].padStart(2,'0')
        const [hh, mm] = t.split(':')
        const startMin = parseInt(hh)*60 + parseInt(mm) - 120; const endMin = startMin + 30
        const fmt = (m: number) => { const h2 = String(Math.floor(((m%1440)+1440)%1440/60)).padStart(2,'0'); const m2 = String(m%60).padStart(2,'0'); return `2026${month}${day}T${h2}${m2}00Z` }
        const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//immology//Demo-Buchung//DE','CALSCALE:GREGORIAN','METHOD:REQUEST','BEGIN:VEVENT',`UID:demo-2026${month}${day}T${hh}${mm}-${Date.now()}@immology.de`,`DTSTART:${fmt(startMin)}`,`DTEND:${fmt(endMin)}`,'SUMMARY:Live-Demo immology','DESCRIPTION:30 Minuten Videocall mit M. Berger\\, Produktberatung immology.','ORGANIZER;CN=immology:mailto:demo@immology.de',`ATTENDEE;CN=${s.name}:mailto:${s.email}`,'END:VEVENT','END:VCALENDAR'].join('\r\n')
        const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
        const a = document.createElement('a'); a.href = url; a.download = 'immology-termin.ics'; a.click(); URL.revokeObjectURL(url)
      })
      return h('div', { className: 'dm-done' },
        h('div', { className: 'dm-done-ic' }, '✓'),
        h('div', { className: 'dm-done-h' }, 'Ihr Termin ist gebucht.'),
        h('div', { className: 'dm-done-sub' }, detail),
        h('div', { className: 'dm-done-list' },
          h('div', { className: 'dm-done-list-item' }, h('span', { className: 'dm-done-check' }, '✓'), 'Kalendereinladung mit Videocall-Link per E-Mail'),
          h('div', { className: 'dm-done-list-item' }, h('span', { className: 'dm-done-check' }, '✓'), 'Erinnerung 24 Stunden vorher'),
          h('div', { className: 'dm-done-list-item' }, h('span', { className: 'dm-done-check' }, '✓'), 'Verschieben oder Absagen jederzeit über den Link')
        ),
        h('div', { className: 'dm-done-btns' }, calBtn, resetBtn)
      )
    }

    function renderAnfragen() {
      if (s.sent) {
        const backBtn = h('button', { className: 'dm-btn-sec', type: 'button' }, 'Zurück')
        backBtn.addEventListener('click', () => { s.sent = false; render() })
        return h('div', { className: 'dm-done' },
          h('div', { className: 'dm-done-ic' }, '✓'),
          h('div', { className: 'dm-done-h' }, 'Anfrage gesendet.'),
          h('div', { className: 'dm-done-sub' }, 'Wir melden uns innerhalb eines Werktags mit einem konkreten Terminvorschlag bei Ihnen.'),
          h('div', { className: 'dm-done-btns', style: 'margin-top:24px' }, backBtn)
        )
      }
      const reqNameInput  = h('input', { className: 'dm-input', type: 'text',   placeholder: 'Vor- und Nachname', value: s.reqName }) as HTMLInputElement
      const reqCompany    = h('input', { className: 'dm-input', type: 'text',   placeholder: 'z. B. Wohnbau GmbH' }) as HTMLInputElement
      const reqEmailInput = h('input', { className: 'dm-input', type: 'email',  placeholder: 'name@unternehmen.de', value: s.reqEmail }) as HTMLInputElement
      const reqNoteTA     = h('textarea', { className: 'dm-textarea', placeholder: 'z. B. „Nächste Woche vormittags…"', rows: '3' }) as HTMLTextAreaElement
      const reqOk = () => reqNameInput.value.trim().length > 1 && EMAIL_RE.test(reqEmailInput.value.trim())
      const sendBtn = h('button', { className: 'dm-cta', type: 'button' }, 'Anfrage senden →') as HTMLButtonElement
      sendBtn.disabled = true
      function updateReqBtn() { const ok = reqOk(); sendBtn.disabled = !ok; sendBtn.className = 'dm-cta' + (ok ? ' dm-cta-primary' : '') }
      reqNameInput.addEventListener('input',  () => { s.reqName  = reqNameInput.value;  updateReqBtn() })
      reqEmailInput.addEventListener('input', () => { s.reqEmail = reqEmailInput.value; updateReqBtn() })
      sendBtn.addEventListener('click', () => {
        if (!reqOk()) return
        s.sent = true; render()
        window.emailjs?.send(SERVICE_ID, 'template_demo_anfrage', {
          name: reqNameInput.value.trim(), email: reqEmailInput.value.trim(),
          company: reqCompany.value.trim() || '–', note: reqNoteTA.value.trim() || '–',
        }).catch((e: unknown) => console.error('[emailjs]', e))
      })
      return h('div', {},
        h('p', { style: 'font-size:14px;color:#6b7180;line-height:1.6;margin:0 0 20px' }, 'Kein passender Slot dabei? Schreiben Sie uns Ihren Wunschzeitraum – wir melden uns innerhalb eines Werktags mit einem Terminvorschlag.'),
        h('div', { className: 'dm-grid2' },
          h('label', { className: 'dm-label', style: 'margin-bottom:0' }, 'Name*', reqNameInput),
          h('label', { className: 'dm-label', style: 'margin-bottom:0' }, 'Unternehmen', reqCompany)
        ),
        h('label', { className: 'dm-label', style: 'margin-top:14px' }, 'E-Mail*', reqEmailInput),
        h('label', { className: 'dm-label' }, h('span', {}, 'Wunschzeitraum / Nachricht'), reqNoteTA),
        h('div', { className: 'dm-foot', style: 'padding-top:20px' },
          h('div', { className: 'dm-privacy' }, 'Mit dem Absenden stimmen Sie der Verarbeitung gemäß ', h('a', { href: '#' }, 'Datenschutzerklärung'), ' zu.'),
          sendBtn
        )
      )
    }

    function render() {
      tabB.classList.toggle('dm-active', s.tab === 'buchen')
      tabA.classList.toggle('dm-active', s.tab === 'anfragen')
      body.innerHTML = ''
      if (s.tab === 'buchen') {
        if (s.step !== 'done') body.append(renderSteps())
        if (s.step === 'select')  body.append(renderSelect())
        if (s.step === 'details') body.append(renderDetails())
        if (s.step === 'done')    body.append(renderDone())
      } else {
        body.append(renderAnfragen())
      }
    }

    tabB.addEventListener('click', () => { s.tab = 'buchen';   render() })
    tabA.addEventListener('click', () => { s.tab = 'anfragen'; render() })
    render()
  }, [open])

  // ESC + body scroll lock
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="dm-overlay dm-open"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Demo buchen"
    >
      <div className="dm-modal">
        {/* Left info column */}
        <div className="dm-left">
          <div className="dm-logo">
            <div className="dm-logo-dot">immo</div>
            <span style={{ fontSize: '.90rem', fontWeight: 400, color: '#fff', letterSpacing: '-.01em' }}>logy</span>
          </div>
          <div className="dm-eyebrow">Live-Demo</div>
          <h2 className="dm-headline">30 Minuten, die Ihre Investitionsrechnung verändern.</h2>
          <p className="dm-sub">Wir zeigen Ihnen die VoFi-Rechnung live an einem Beispielobjekt aus Ihrem Bestand – ohne Vorbereitung Ihrerseits.</p>
          <div className="dm-checks">
            <div className="dm-check"><span className="dm-check-ic">✓</span>30 Min. per Videocall</div>
            <div className="dm-check"><span className="dm-check-ic">✓</span>Live am echten Rechenbeispiel</div>
            <div className="dm-check"><span className="dm-check-ic">✓</span>Unverbindlich &amp; kostenfrei</div>
          </div>
          <div className="dm-contact">
            <div className="dm-avatar">MB</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>M. Berger</div>
              <div style={{ fontSize: '12.5px', color: '#a6abc4' }}>Produktberatung immology</div>
            </div>
          </div>
        </div>

        {/* Right action column */}
        <div className="dm-right">
          <div className="dm-topbar">
            <div className="dm-tabs">
              <button className="dm-tab dm-active" ref={tabBRef}>Termin buchen</button>
              <button className="dm-tab" ref={tabARef}>Termin anfragen</button>
            </div>
            <button className="dm-close" onClick={onClose} aria-label="Schließen">×</button>
          </div>
          <div ref={bodyRef} id="dm-body-react" />
        </div>
      </div>
    </div>
  )
}
