import type { Currency, DateRangeKey } from './types'

export const RATES: Record<Currency, number> = { USD: 1, EUR: 0.92, GBP: 0.79, PKR: 278 }
export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: 'US Dollar ($)', EUR: 'Euro (€)', GBP: 'British Pound (£)', PKR: 'Pakistani Rupee (Rs)',
}

export function formatMoney(amountUsd: number, currency: Currency): string {
  const converted = amountUsd * RATES[currency]
  return new Intl.NumberFormat(currency === 'PKR' ? 'en-PK' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'PKR' ? 0 : 2,
  }).format(converted)
}

/** Render text containing a {amount} placeholder, formatted in the given currency. */
export function renderAmountText(text: string, amountUsd: number | undefined, format: (n: number) => string): string {
  if (amountUsd === undefined) return text
  return text.replaceAll('{amount}', format(amountUsd))
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function timeAgo(iso: string, now = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

export const RANGE_DAYS: Record<DateRangeKey, number> = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 }
export const RANGE_LABELS: Record<DateRangeKey, string> = {
  '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', '12m': 'Last 12 months',
}

/** Start of day `days` ago, as a Date. */
export function daysAgoDate(days: number, from = new Date()): Date {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d
}

export function isoDaysAgo(days: number, hour = 12): string {
  const d = daysAgoDate(days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

/** Escape one CSV field per RFC 4180. */
export function csvEscape(value: string | number): string {
  const s = String(value)
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const lines = [headers.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))]
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }), filename)
}

function pdfEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[^\x20-\x7E]/g, '')
}

/** Generate a real, valid single/multi-page PDF (Helvetica, no dependencies). */
export function generatePdf(title: string, lines: string[]): Blob {
  const pageLines: string[][] = []
  let cur: string[] = []
  for (const line of lines) {
    cur.push(line)
    if (cur.length >= 42) { pageLines.push(cur); cur = [] }
  }
  if (cur.length > 0 || pageLines.length === 0) pageLines.push(cur)

  const objects: string[] = []
  // 1: catalog, 2: pages (filled later), then per page: page obj + content obj, then font obj
  const fontObj = 3 + pageLines.length * 2
  const pageObjIds = pageLines.map((_, i) => 3 + i * 2)
  const contentObjIds = pageLines.map((_, i) => 4 + i * 2)
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageLines.length} >>`
  pageLines.forEach((pl, i) => {
    objects[pageObjIds[i]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObjIds[i]} 0 R >>`
    const content: string[] = ['BT /F1 18 Tf 56 740 Td (' + pdfEscape(title) + ') Tj ET']
    if (i === 0) content.push('BT /F1 10 Tf 56 722 Td (Nexora SaaS Dashboard - generated ' + pdfEscape(new Date().toLocaleDateString('en-US')) + ') Tj ET')
    pl.forEach((line, j) => {
      const y = 690 - j * 15
      content.push(`BT /F1 11 Tf 56 ${y} Td (${pdfEscape(line)}) Tj ET`)
    })
    content.push(`BT /F1 9 Tf 56 36 Td (Page ${i + 1} of ${pageLines.length}) Tj ET`)
    const stream = content.join('\n')
    objects[contentObjIds[i]] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  })
  objects[fontObj] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]
  for (let i = 1; i <= fontObj; i++) {
    offsets[i] = pdf.length
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xrefPos = pdf.length
  pdf += `xref\n0 ${fontObj + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= fontObj; i++) pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n'
  pdf += `trailer\n<< /Size ${fontObj + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
