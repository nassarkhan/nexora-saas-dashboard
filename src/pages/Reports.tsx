import { useState } from 'react'
import { Download, FileText, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import type { ReportItem, ReportKind } from '../lib/types'
import { Badge, Btn, Card, EmptyState, Field, Modal, RowMenu, SelectInput, TextInput } from '../components/ui'
import { RANGE_DAYS, RANGE_LABELS, downloadBlob, downloadCsv, formatDate, generatePdf } from '../lib/utils'

const KINDS: ReportKind[] = ['Revenue', 'Customers', 'Transactions', 'PDF summary']

export default function Reports() {
  const { data, format, createReport, deleteReport, pushToast } = useStore()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', kind: 'Revenue' as ReportKind, range: '30d' as ReportItem['range'] })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const rowsFor = (r: ReportItem) => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[r.range])
    if (r.kind === 'Transactions') return data.transactions.filter((t) => new Date(t.date) >= cutoff)
    if (r.kind === 'Customers') return data.customers.filter((c) => new Date(c.joined) >= cutoff)
    return data.transactions.filter((t) => new Date(t.date) >= cutoff && t.status === 'Completed')
  }

  const exportReport = (r: ReportItem) => {
    if (r.kind === 'PDF summary') {
      const rows = rowsFor(r)
      const total = rows.reduce((s, t) => s + ((t as { amount?: number }).amount ?? 0), 0)
      const lines = [
        r.name,
        '',
        `Range: ${RANGE_LABELS[r.range]}`,
        `Generated: ${new Date().toLocaleDateString('en-US')}`,
        '',
        `Transactions in range: ${rows.length}`,
        `Total revenue (USD): ${total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
        `Customers: ${data.customers.length}`,
        `Active projects: ${data.projects.filter((p) => p.status === 'Active' || p.status === 'On Track').length}`,
        '',
        'Top transactions:',
        ...rows.slice(0, 10).map((t) => {
          const txn = t as { id: string; customerName: string; amount: number; status: string }
          return `${txn.id} - ${txn.customerName} - $${txn.amount.toLocaleString()} - ${txn.status}`
        }),
      ]
      downloadBlob(generatePdf(r.name, lines), `${r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`)
      pushToast('PDF report downloaded')
      return
    }
    if (r.kind === 'Transactions') {
      const rows = rowsFor(r) as Array<{ id: string; customerName: string; date: string; amount: number; method: string; status: string }>
      downloadCsv(`${r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`,
        ['Transaction ID', 'Customer', 'Date', 'Amount (USD)', 'Payment method', 'Status'],
        rows.map((t) => [t.id, t.customerName, t.date.slice(0, 10), t.amount, t.method, t.status]))
    } else if (r.kind === 'Customers') {
      const rows = rowsFor(r) as Array<{ name: string; email: string; company: string; plan: string; status: string }>
      downloadCsv(`${r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`,
        ['Name', 'Email', 'Company', 'Plan', 'Status'],
        rows.map((c) => [c.name, c.email, c.company, c.plan, c.status]))
    } else {
      // Revenue: one row per day in range, from the daily series via transactions is lossy,
      // so export the completed transactions that make up the revenue, with a total row.
      const rows = rowsFor(r) as Array<{ id: string; customerName: string; date: string; amount: number; status: string }>
      const total = rows.reduce((s, t) => s + t.amount, 0)
      downloadCsv(`${r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`,
        ['Transaction ID', 'Customer', 'Date', 'Amount (USD)', 'Status'],
        [...rows.map((t) => [t.id, t.customerName, t.date.slice(0, 10), t.amount, t.status]), ['TOTAL', '', '', total, '']])
    }
    pushToast(`Exported "${r.name}" for ${RANGE_LABELS[r.range].toLowerCase()}`)
  }

  const submit = () => {
    const errs: Record<string, string> = {}
    if (form.name.trim().length < 3) errs.name = 'Report name is required.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    createReport({ name: form.name.trim(), kind: form.kind, range: form.range })
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Reports</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Generate and export reports. Every export honours the report's own date range.</p>
        </div>
        <Btn onClick={() => { setForm({ name: '', kind: 'Revenue', range: '30d' }); setErrors({}); setCreating(true) }}><Plus className="h-4 w-4" /> New report</Btn>
      </div>

      {data.reports.length === 0 ? (
        <Card><EmptyState title="No reports yet" body="Create your first report to export revenue, customer or transaction data." action={<Btn onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New report</Btn>} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.reports.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{r.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Created {formatDate(r.created)} · {RANGE_LABELS[r.range]} · {rowsFor(r).length} rows in range</p>
                  </div>
                </div>
                <RowMenu
                  label={`Actions for ${r.name}`}
                  items={[
                    { label: r.kind === 'PDF summary' ? 'Download PDF' : 'Download CSV', icon: <Download className="h-4 w-4" />, onClick: () => exportReport(r) },
                    { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => deleteReport(r.id) },
                  ]}
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge>{r.kind}</Badge>
                <Btn variant="secondary" onClick={() => exportReport(r)}>
                  <Download className="h-4 w-4" /> {r.kind === 'PDF summary' ? 'Download PDF' : 'Export CSV'}
                </Btn>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {r.kind === 'Customers'
                  ? `${rowsFor(r).length} customers joined in range`
                  : `Sample total in range: ${format(rowsFor(r).reduce((s, t) => s + ((t as { amount?: number }).amount ?? 0), 0))}`}
              </p>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <Modal title="New report" onClose={() => setCreating(false)}>
          <div className="space-y-4">
            <Field label="Report name" error={errors.name}><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monthly Revenue Summary" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <SelectInput value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ReportKind })}>
                  {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </SelectInput>
              </Field>
              <Field label="Date range">
                <SelectInput value={form.range} onChange={(e) => setForm({ ...form, range: e.target.value as ReportItem['range'] })}>
                  <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="12m">Last 12 months</option>
                </SelectInput>
              </Field>
            </div>
            <p className="text-xs text-slate-400">“PDF summary” downloads a real generated PDF. All other types download CSV with proper quote escaping.</p>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => setCreating(false)}>Cancel</Btn>
              <Btn onClick={submit}>Create report</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
