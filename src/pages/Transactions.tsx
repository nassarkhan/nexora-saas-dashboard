import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, Plus, Search, Trash2, Undo2 } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Transaction, TxnStatus } from '../lib/types'
import { Badge, Btn, Card, DateRangePicker, EmptyState, Field, Modal, Pagination, RowMenu, SelectInput, TextInput } from '../components/ui'
import { RANGE_DAYS, RANGE_LABELS, downloadCsv, formatDate } from '../lib/utils'

const PAGE_SIZE = 8

export default function Transactions() {
  const { data, range, createTransaction, updateTransactionStatus, deleteTransaction, pendingOpen, clearPendingOpen, format, pushToast } = useStore()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<TxnStatus | 'All'>('All')
  const [method, setMethod] = useState<Transaction['method'] | 'All'>('All')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<Transaction | null>(null)
  const [form, setForm] = useState({ customerId: '', amount: 100, method: 'Card' as Transaction['method'], status: 'Completed' as TxnStatus })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (pendingOpen?.type === 'transaction') {
      const t = data.transactions.find((x) => x.id === pendingOpen.id)
      if (t) setViewing(t)
      clearPendingOpen()
    }
  }, [pendingOpen, data.transactions, clearPendingOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range])
    return [...data.transactions]
      .filter((t) => new Date(t.date) >= cutoff)
      .filter((t) =>
        (status === 'All' || t.status === status) &&
        (method === 'All' || t.method === method) &&
        (q === '' || t.id.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [data.transactions, query, status, method, range])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const totalCompleted = filtered.filter((t) => t.status === 'Completed').reduce((s, t) => s + t.amount, 0)

  useEffect(() => { setPage(1) }, [query, status, method, range])

  const openCreate = () => {
    setForm({ customerId: data.customers[0]?.id ?? '', amount: 100, method: 'Card', status: 'Completed' })
    setErrors({}); setCreating(true)
  }

  const submit = () => {
    const errs: Record<string, string> = {}
    if (!form.customerId) errs.customerId = 'Choose a customer.'
    if (!(form.amount > 0)) errs.amount = 'Amount must be greater than 0.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const customer = data.customers.find((c) => c.id === form.customerId)
    if (!customer) return
    createTransaction({ customerId: customer.id, customerName: customer.name, date: new Date().toISOString(), amount: form.amount, method: form.method, status: form.status })
    setCreating(false)
  }

  const exportCsv = () => {
    downloadCsv(`transactions-${range}.csv`,
      ['Transaction ID', 'Customer', 'Date', 'Amount (USD)', 'Payment method', 'Status'],
      filtered.map((t) => [t.id, t.customerName, t.date.slice(0, 10), t.amount, t.method, t.status]))
    pushToast(`Exported ${filtered.length} transactions for ${RANGE_LABELS[range].toLowerCase()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} transactions in {RANGE_LABELS[range].toLowerCase()} · {format(totalCompleted)} completed
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker />
          <Btn variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Btn>
          <Btn onClick={openCreate}><Plus className="h-4 w-4" /> Record payment</Btn>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ID or customer…" aria-label="Search transactions" className="pl-9" />
          </div>
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value as TxnStatus | 'All')} aria-label="Filter by status" className="w-40">
            <option value="All">All statuses</option><option>Completed</option><option>Pending</option><option>Refunded</option><option>Failed</option>
          </SelectInput>
          <SelectInput value={method} onChange={(e) => setMethod(e.target.value as Transaction['method'] | 'All')} aria-label="Filter by payment method" className="w-44">
            <option value="All">All methods</option><option>Card</option><option>Bank Transfer</option><option>PayPal</option><option>Stripe</option>
          </SelectInput>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState title="No transactions in this range" body="Try a longer date range or a different filter, or record a new payment." action={<Btn onClick={openCreate}><Plus className="h-4 w-4" /> Record payment</Btn>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                    <th className="px-5 py-3 font-medium">Transaction ID</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Method</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((t) => (
                    <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{t.id}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.customerName}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatDate(t.date)}</td>
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{format(t.amount)}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.method}</td>
                      <td className="px-5 py-3"><Badge>{t.status}</Badge></td>
                      <td className="px-5 py-3 text-right">
                        <RowMenu
                          label={`Actions for ${t.id}`}
                          items={[
                            { label: 'View details', icon: <Eye className="h-4 w-4" />, onClick: () => setViewing(t) },
                            ...(t.status !== 'Refunded' ? [{ label: 'Mark refunded', icon: <Undo2 className="h-4 w-4" />, onClick: () => updateTransactionStatus(t.id, 'Refunded') }] : []),
                            ...(t.status !== 'Completed' ? [{ label: 'Mark completed', icon: <Eye className="h-4 w-4" />, onClick: () => updateTransactionStatus(t.id, 'Completed') }] : []),
                            { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => deleteTransaction(t.id) },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={safePage} totalPages={totalPages} onPage={setPage} total={filtered.length} label="transactions" />
          </>
        )}
      </Card>

      {creating && (
        <Modal title="Record payment" onClose={() => setCreating(false)}>
          <div className="space-y-4">
            <Field label="Customer" error={errors.customerId}>
              <SelectInput value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">Select a customer…</option>
                {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
              </SelectInput>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount (USD)" error={errors.amount}><TextInput type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
              <Field label="Payment method">
                <SelectInput value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as Transaction['method'] })}>
                  <option>Card</option><option>Bank Transfer</option><option>PayPal</option><option>Stripe</option>
                </SelectInput>
              </Field>
            </div>
            <Field label="Status">
              <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TxnStatus })}>
                <option>Completed</option><option>Pending</option><option>Failed</option>
              </SelectInput>
            </Field>
            <p className="text-xs text-slate-400">A completed payment updates the customer's lifetime spend, adds an activity entry and a notification. Refunding reverses the spend exactly.</p>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => setCreating(false)}>Cancel</Btn>
              <Btn onClick={submit}>Record payment</Btn>
            </div>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.id} onClose={() => setViewing(null)}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Customer</dt><dd className="font-medium text-slate-900 dark:text-white">{viewing.customerName}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Date</dt><dd className="font-medium text-slate-900 dark:text-white">{formatDate(viewing.date)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Amount</dt><dd className="font-medium text-slate-900 dark:text-white">{format(viewing.amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Method</dt><dd className="font-medium text-slate-900 dark:text-white">{viewing.method}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Status</dt><dd><Badge>{viewing.status}</Badge></dd></div>
          </dl>
          <div className="mt-5 flex justify-end gap-2">
            {viewing.status !== 'Refunded' && <Btn variant="secondary" onClick={() => { updateTransactionStatus(viewing.id, 'Refunded'); setViewing(null) }}>Mark refunded</Btn>}
            <Btn onClick={() => setViewing(null)}>Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
