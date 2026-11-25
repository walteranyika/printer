import { useMemo, useState } from 'react'
import qz from 'qz-tray'
import { configureQZ } from './utils/qz-setup.js'

const localDate = new Date()
const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`

const initialItems = [
  { id: 1, name: 'Mouse', quantity: '2', price: '450' },
  { id: 2, name: 'USB Cable', quantity: '1', price: '350' },
]

const designs = [
  { id: 'classic', name: 'Classic', detail: 'The timeless receipt' },
  { id: 'modern', name: 'Modern', detail: 'Clean & contemporary' },
  { id: 'bold', name: 'Bold', detail: 'Strong type, big impact' },
  { id: 'minimal', name: 'Minimal', detail: 'Less is more' },
  { id: 'market', name: 'Market', detail: 'A little handmade' },
]

const RECEIPT_COLUMNS = 48
const ESC = '\x1B'
const GS = '\x1D'
const NEWLINE = '\n'

const escInit = () => `${ESC}@`
const escAlign = (alignment) => `${ESC}a${String.fromCharCode(alignment)}`
const escBold = (enabled) => `${ESC}E${String.fromCharCode(enabled ? 1 : 0)}`
const escTextSize = (size) => `${GS}!${String.fromCharCode(size)}`
const escFeed = (lineCount) => `${ESC}d${String.fromCharCode(lineCount)}`
const escCut = () => `${GS}V\x00`

function cleanPrintText(value) {
  const printableText = Array.from(String(value ?? ''))
    .filter((character) => {
      const code = character.charCodeAt(0)
      return code >= 0x20 && code !== 0x7f
    })
    .join('')
  return printableText.replace(/\s+/g, ' ').trim()
}

function wrapText(value, width = RECEIPT_COLUMNS) {
  const words = cleanPrintText(value).split(' ').filter(Boolean)
  const lines = []
  let line = ''

  words.forEach((word) => {
    const characters = Array.from(word)
    if (characters.length > width) {
      if (line) lines.push(line)
      line = ''
      while (characters.length > width) lines.push(characters.splice(0, width).join(''))
      line = characters.join('')
      return
    }

    const candidate = line ? `${line} ${word}` : word
    if (Array.from(candidate).length > width) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  })

  if (line) lines.push(line)
  return lines
}

function padLine(label, value, width = RECEIPT_COLUMNS) {
  const right = cleanPrintText(value)
  const maxRightLength = Math.max(0, width - 2)
  const rightText = Array.from(right).slice(-maxRightLength).join('')
  const leftWidth = Math.max(0, width - Array.from(rightText).length - 1)
  const leftText = Array.from(cleanPrintText(label)).slice(0, leftWidth).join('')
  return `${leftText}${' '.repeat(width - Array.from(leftText).length - Array.from(rightText).length)}${rightText}`
}

function createEscPosReceipt({ business, items, total, currency, date, design, receiptNumber, footerMessage }) {
  const lines = [escInit(), escAlign(1)]
  const storeName = cleanPrintText(business.name) || 'Your business'

  if (design === 'market') lines.push(`${'*'.repeat(16)}${NEWLINE}`)
  if (design === 'bold') lines.push(escTextSize(0x10))
  if (design !== 'minimal') lines.push(escBold(true))
  lines.push(...wrapText(design === 'bold' ? storeName.toUpperCase() : storeName).map((line) => `${line}${NEWLINE}`))
  lines.push(escTextSize(0), escBold(false))
  if (business.location) lines.push(...wrapText(business.location).map((line) => `${line}${NEWLINE}`))
  if (business.phone) lines.push(...wrapText(business.phone).map((line) => `${line}${NEWLINE}`))
  lines.push(`${date}${NEWLINE}`)

  if (design === 'modern') lines.push(`${'='.repeat(RECEIPT_COLUMNS)}${NEWLINE}`)
  else if (design === 'market') lines.push(`${'*'.repeat(RECEIPT_COLUMNS)}${NEWLINE}`)
  else lines.push(`${'-'.repeat(RECEIPT_COLUMNS)}${NEWLINE}`)

  lines.push(escAlign(0), escBold(true))
  lines.push(`${padLine('ITEM', 'QTY  AMOUNT')}${NEWLINE}`)
  lines.push(escBold(false))
  items.forEach((item) => {
    const name = cleanPrintText(item.name) || 'Item'
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.price) || 0
    const subtotal = quantity * unitPrice
    lines.push(...wrapText(name).map((line) => `${line}${NEWLINE}`))
    lines.push(`${padLine(`${quantity} x ${currency} ${unitPrice.toFixed(2)}`, `${currency} ${subtotal.toFixed(2)}`)}${NEWLINE}`)
  })

  const separator = design === 'market' ? '*'.repeat(RECEIPT_COLUMNS) : design === 'modern' ? '='.repeat(RECEIPT_COLUMNS) : '-'.repeat(RECEIPT_COLUMNS)
  lines.push(`${separator}${NEWLINE}`, escBold(true))
  if (design === 'bold') lines.push(escTextSize(0x10))
  lines.push(`${padLine('TOTAL', `${currency} ${total.toFixed(2)}`)}${NEWLINE}`)
  lines.push(escTextSize(0), escBold(false), `${separator}${NEWLINE}`, escAlign(1))
  const cleanReceiptNumber = cleanPrintText(receiptNumber)
  if (cleanReceiptNumber) {
    lines.push(`${wrapText(`Receipt No: ${cleanReceiptNumber}`).join(NEWLINE)}${NEWLINE}`)
  }
  if (design !== 'minimal') lines.push(`Thanks for stopping by!${NEWLINE}`)
  const footerLines = String(footerMessage ?? '')
    .split(/\r?\n/)
    .flatMap((line) => wrapText(line))
  if (footerLines.length) lines.push(...footerLines.map((line) => `${line}${NEWLINE}`))
  lines.push(NEWLINE, NEWLINE, NEWLINE, escFeed(6), escCut())

  return lines
}

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (name === 'receipt') {
    return <svg {...common}><path d="M5 3.5h14v17l-3-2-4 2-4-2-3 2z" /><path d="M8 8h8M8 12h8M8 16h3" /></svg>
  }
  if (name === 'plus') {
    return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
  }
  if (name === 'trash') {
    return <svg {...common}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
  }
  if (name === 'print') {
    return <svg {...common}><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M7 14h10v7H7zM17 11h.01" /></svg>
  }
  if (name === 'sparkle') {
    return <svg {...common}><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></svg>
  }
  if (name === 'store') {
    return <svg {...common}><path d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6" /></svg>
  }
  if (name === 'bag') {
    return <svg {...common}><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
  }
  return null
}

function App() {
  const [business, setBusiness] = useState({
    name: 'Makims TechWorld',
    location: 'Nairobi CBD, Moi Avenue',
    phone: '0724963456',
    date: today,
  })
  const [items, setItems] = useState(initialItems)
  const [design, setDesign] = useState('classic')
  const [currency, setCurrency] = useState('Ksh')
  const [receiptNumber, setReceiptNumber] = useState('0001')
  const [footerMessage, setFooterMessage] = useState('WE APPRECIATE YOUR BUSINESS')
  const [qzStatus, setQzStatus] = useState('disconnected')
  const [printers, setPrinters] = useState([])
  const [selectedPrinter, setSelectedPrinter] = useState('')
  const [qzBusy, setQzBusy] = useState(false)
  const [qzMessage, setQzMessage] = useState('')

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0),
    [items],
  )

  const updateBusiness = (field, value) => {
    setBusiness((current) => ({ ...current, [field]: value }))
  }

  const updateItem = (id, field, value) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item))
  }

  const addItem = () => {
    setItems((current) => [...current, { id: Math.max(...current.map((item) => item.id)) + 1, name: '', quantity: '1', price: '' }])
  }

  const removeItem = (id) => {
    setItems((current) => current.length > 1 ? current.filter((item) => item.id !== id) : current)
  }

  const formatMoney = (value) => `${currency}${(Number(value) || 0).toFixed(2)}`
  const formatDate = (value) => {
    if (!value) return '—'
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB').replaceAll('/', '-');
  }

  const refreshPrinters = async () => {
    try {
      const availablePrinters = await qz.printers.find()
      let defaultPrinter = ''
      let defaultPrinterError = ''
      try {
        defaultPrinter = await qz.printers.getDefault()
      } catch (error) {
        defaultPrinterError = error instanceof Error ? error.message : 'Could not detect the default printer.'
      }

      setPrinters(availablePrinters)
      setSelectedPrinter((current) => (
        availablePrinters.includes(current)
          ? current
          : availablePrinters.includes(defaultPrinter)
            ? defaultPrinter
            : availablePrinters[0] || ''
      ))
      if (!availablePrinters.length) {
        setQzMessage('QZ Tray is connected, but no printers were found.')
      } else if (defaultPrinterError) {
        setQzMessage(`Could not detect the default printer. Choose one from the list. ${defaultPrinterError}`)
      } else {
        setQzMessage('')
      }
    } catch (error) {
      setQzMessage(error instanceof Error ? error.message : 'Could not load the printer list from QZ Tray.')
    }
  }

  const connectQz = async () => {
    setQzBusy(true)
    setQzMessage('')
    try {
      configureQZ()
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect({ retries: 1, delay: 1 })
      }
      setQzStatus('connected')
      await refreshPrinters()
    } catch (error) {
      setQzStatus(qz.websocket.isActive() ? 'connected' : 'disconnected')
      setQzMessage(error instanceof Error ? error.message : 'Could not connect to QZ Tray. Check that it is installed and running.')
    } finally {
      setQzBusy(false)
    }
  }

  const handlePrint = async (event) => {
    event.preventDefault()
    if (!qz.websocket.isActive()) {
      setQzStatus('disconnected')
      setQzMessage('Connect to QZ Tray before printing.')
      return
    }
    if (!selectedPrinter) {
      setQzMessage('Choose a printer before printing.')
      return
    }

    setQzBusy(true)
    setQzMessage('Sending receipt to printer…')
    try {
      const config = qz.configs.create(selectedPrinter, { rasterize: false })
      const data = createEscPosReceipt({
        business,
        items,
        total,
        currency,
        date: formatDate(business.date),
        design,
        receiptNumber,
        footerMessage,
      })
      await qz.print(config, data)
      setQzMessage('Receipt sent to printer.')
    } catch (error) {
      setQzMessage(error instanceof Error ? error.message : 'Could not send the receipt to the printer.')
    } finally {
      setQzBusy(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Tillie home">
          <span className="brand-mark"><Icon name="receipt" size={21} /></span>
          <span>tillie<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-right">
          <span className="saved-status"><span className="saved-dot" /> All changes saved</span>
          <span className="avatar" aria-label="Your profile">S</span>
        </div>
      </header>

      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR COUNTER, YOUR WAY</div>
          <h1>Make a receipt<span className="heading-period">.</span></h1>
          <p>Every great sale deserves a good-looking receipt.</p>
        </div>
        <div className="heading-note"><Icon name="sparkle" size={18} /><span>Made for the little things<br />that make your business yours.</span></div>
      </section>

      <form className="workspace" onSubmit={handlePrint}>
        <section className="editor-column" aria-label="Receipt details">
          <section className="panel business-panel">
            <div className="section-heading">
              <span className="section-icon"><Icon name="store" size={17} /></span>
              <div><h2>Your business</h2><p>The details at the top of your receipt.</p></div>
              <span className="step-number">01</span>
            </div>
            <div className="business-fields">
              <label className="field field-wide">
                <span>Business name</span>
                <input required value={business.name} onChange={(event) => updateBusiness('name', event.target.value)} placeholder="e.g. Sunday Supply" />
              </label>
              <label className="field">
                <span>Location</span>
                <input value={business.location} onChange={(event) => updateBusiness('location', event.target.value)} placeholder="City, State" />
              </label>
              <label className="field">
                <span>Phone number</span>
                <input type="tel" value={business.phone} onChange={(event) => updateBusiness('phone', event.target.value)} placeholder="(555) 000-0000" />
              </label>
              <label className="field">
                <span>Date</span>
                <input type="date" required value={business.date} onChange={(event) => updateBusiness('date', event.target.value)} />
              </label>
            </div>
          </section>

          <section className="panel products-panel">
            <div className="section-heading">
              <span className="section-icon"><Icon name="bag" size={17} /></span>
              <div><h2>What did they get?</h2><p>Add each item to the sale.</p></div>
              <span className="step-number">02</span>
            </div>
            <div className="product-labels" aria-hidden="true">
              <span>PRODUCT</span><span>QTY</span><span>PRICE</span><span />
            </div>
            <div className="product-list">
              {items.map((item, index) => (
                <div className="product-row" key={item.id}>
                  <label className="sr-only" htmlFor={`product-${item.id}`}>Product {index + 1} name</label>
                  <input id={`product-${item.id}`} required className="product-name" value={item.name} onChange={(event) => updateItem(item.id, 'name', event.target.value)} placeholder="Item name" />
                  <label className="sr-only" htmlFor={`quantity-${item.id}`}>Quantity for {item.name || `product ${index + 1}`}</label>
                  <input id={`quantity-${item.id}`} required type="number" min="1" step="1" className="product-quantity" value={item.quantity} onChange={(event) => updateItem(item.id, 'quantity', event.target.value)} />
                  <label className="sr-only" htmlFor={`price-${item.id}`}>Unit price for {item.name || `product ${index + 1}`}</label>
                  <div className="price-input"><span>{currency}</span><input id={`price-${item.id}`} required type="number" min="0" step="0.01" value={item.price} onChange={(event) => updateItem(item.id, 'price', event.target.value)} placeholder="0.00" /></div>
                  <button type="button" className="remove-button" onClick={() => removeItem(item.id)} disabled={items.length === 1} aria-label={`Remove ${item.name || `product ${index + 1}`}`}><Icon name="trash" size={16} /></button>
                </div>
              ))}
            </div>
            <button type="button" className="add-item-button" onClick={addItem}><Icon name="plus" size={16} /> Add another item</button>
            <div className="currency-field">
              <label htmlFor="currency">Currency</label>
              <select id="currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
                <option value="Ksh">Ksh — Ksh</option>
                <option value="$">USD — $</option>

              </select>
            </div>
          </section>
          <section className="panel footer-message-panel">
            <div className="section-heading">
              <span className="section-icon"><Icon name="sparkle" size={17} /></span>
              <div><h2>Receipt details</h2><p>Personalize the bottom of your receipt.</p></div>
              <span className="step-number">03</span>
            </div>
            <label className="field receipt-number-field" htmlFor="receipt-number">
              <span>Receipt number</span>
              <input
                id="receipt-number"
                value={receiptNumber}
                onChange={(event) => setReceiptNumber(event.target.value)}
                maxLength={40}
                placeholder="e.g. 0001"
              />
            </label>
            <label className="field footer-message-field" htmlFor="footer-message">
              <span>Closing message</span>
              <textarea
                id="footer-message"
                className="footer-message-input"
                value={footerMessage}
                onChange={(event) => setFooterMessage(event.target.value)}
                maxLength={240}
                rows={2}
                placeholder="e.g. Thanks for supporting local!"
              />
            </label>
          </section>
          <div className="editor-footer"><Icon name="sparkle" size={14} /> Your receipt, ready in a little over a minute.</div>
        </section>

        <section className="preview-column" aria-label="Receipt preview">
          <div className="preview-topline">
            <div><span className="preview-label">LIVE PREVIEW</span><span className="live-dot" /></div>
            <span className="preview-size">80mm · Standard</span>
          </div>

          <div className={`receipt-paper design-${design}`} id="receipt">
            <div className="receipt-print-area">
              <div className="receipt-brand">
                <div className="receipt-store">{business.name || 'Your business'}</div>
                {business.location && <div className="receipt-location">{business.location}</div>}
                {business.phone && <div className="receipt-phone">{business.phone}</div>}
              </div>
              <div className="receipt-meta"><span>SALE</span><span>{formatDate(business.date)}</span></div>
              <div className="receipt-table">
                <div className="receipt-table-head"><span>ITEM</span><span>QTY</span><span>AMOUNT</span></div>
                {items.map((item) => (
                  <div className="receipt-item" key={item.id}>
                    <span className="receipt-item-name">{item.name || 'Item name'}<small>{formatMoney(item.price)} each</small></span>
                    <span className="receipt-qty">{item.quantity || '0'}</span>
                    <span className="receipt-amount">{formatMoney((Number(item.quantity) || 0) * (Number(item.price) || 0))}</span>
                  </div>
                ))}
              </div>
              <div className="receipt-total"><span>TOTAL</span><strong>{formatMoney(total)}</strong></div>
              {receiptNumber.trim() && <div className="receipt-number">Receipt No: {receiptNumber}</div>}
              <div className="receipt-thanks"><span className="thanks-sparkle">✳</span><span>Thanks for stopping by!</span><span className="thanks-sparkle">✳</span></div>
              {footerMessage && <div className="receipt-footer">{footerMessage}</div>}
            </div>
            <div className="paper-tear" />
          </div>

          <div className="design-picker">
            <div className="design-heading"><span>Pick your look</span><span>05 DESIGNS</span></div>
            <div className="design-options" role="group" aria-label="Receipt design">
              {designs.map((option, index) => (
                <button key={option.id} type="button" className={`design-option ${design === option.id ? 'selected' : ''}`} onClick={() => setDesign(option.id)} aria-pressed={design === option.id} aria-label={`${option.name}: ${option.detail}`}>
                  <span className={`design-thumb thumb-${option.id}`}><span /><span /><span /></span>
                  <span className="design-option-name">{option.name}</span>
                  {index === 0 && <span className="sr-only">Selected</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="qz-panel">
            <div className="qz-panel-heading">
              <span className={`qz-status-dot ${qzStatus}`} />
              <span>{qzStatus === 'connected' ? 'QZ Tray connected' : 'QZ Tray not connected'}</span>
            </div>
            {qzStatus === 'connected' ? (
              <div className="printer-controls">
                <label className="sr-only" htmlFor="printer">Receipt printer</label>
                <select id="printer" value={selectedPrinter} onChange={(event) => setSelectedPrinter(event.target.value)} disabled={qzBusy || printers.length === 0}>
                  {printers.length === 0 && <option value="">No printers found</option>}
                  {printers.map((printer) => <option key={printer} value={printer}>{printer}</option>)}
                </select>
                <button type="button" className="refresh-printers" onClick={refreshPrinters} disabled={qzBusy} aria-label="Refresh printer list">↻</button>
              </div>
            ) : (
              <div className="qz-connect-row">
                <span>Connect to the QZ Tray desktop app to find your printer.</span>
                <button type="button" className="connect-button" onClick={connectQz} disabled={qzBusy}>{qzBusy ? 'Connecting…' : 'Connect'}</button>
              </div>
            )}
            {qzMessage && <p className="qz-message" role="status">{qzMessage}</p>}
            <p className="qz-security-note">QZ Tray may ask you to allow this connection. Silent printing requires a trusted certificate configured on a server.</p>
          </div>

          <button className="print-button" type="submit" disabled={qzBusy || qzStatus !== 'connected' || !selectedPrinter}><Icon name="print" size={18} /> {qzBusy ? 'Please wait…' : 'Print this receipt'} <span className="button-arrow">↗</span></button>
          <p className="print-hint">Sends raw ESC/POS commands to your selected printer.</p>
        </section>
      </form>

      <footer className="page-footer"><span>✳</span> A small tool for the big-hearted businesses. <span>✳</span></footer>
    </main>
  )
}

export default App
