import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Customer } from '../lib/types'
import { Badge, Btn, Card, EmptyState, Field, Modal, Pagination, RowMenu, SelectInput, TextInput } from '../components/ui'
import { formatDate, timeAgo } from '../lib/utils'

const PAGE_SIZE = 6
type Plan = Customer['plan']
type Status = Customer['status']

const EMPTY_CUSTOMER: Omit<Customer, 'id'> = {
  name: '', email: '', company: '', plan: 'Starter', status: 'Active',
  joined: new Date().toISOString(), lastActive: new Date().toISOString(),
}

export default function Customers() {
  const { data, createCustomer, updateCustomer, deleteCustomer, customerSpend, pendingOpen, clearPendingOpen, format } = useStore()
  const [query, setQuery] = useState('')
  const [plan, setPlan] = useState<Plan | 'All'>('All')
  const [status, setStatus] = useState<Status | 'All'>('All')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<Customer | null>(null)
  const [form, setForm] = useState(EMPTY_CUSTOMER)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (pendingOpen?.type === 'customer') {
      const c = data.customers.find((x) => x.id === pendingOpen.id)
      if (c) setViewing(c)
      clearPendingOpen()
    }
  }, [pendingOpen, data.customers, clearPendingOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.customers.filter((c) =>
      (plan === 'All' || c.plan === plan) &&
      (status === 'All' || c.status === status) &&
      (q === '' || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)),
    )
  }, [data.customers, query, plan, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [query, plan, status])

  const openCreate = () => { setForm(EMPTY_CUSTOMER); setErrors({}); setCreating(true) }
  const openEdit = (c: Customer) => {
    setForm({ name: c.name, email: c.email, company: c.company, plan: c.plan, status: c.status, joined: c.joined, lastActive: c.lastActive })
    setErrors({}); setEditing(c)
  }

  const submit = () => {
    const errs: Record<string, string> = {}
    if (form.name.trim().length < 2) errs.name = 'Name is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.'
    if (form.company.trim().length < 2) errs.company = 'Company is required.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    if (editing) updateCustomer(editing.id, form)
    else createCustomer(form)
    setCreating(false); setEditing(null)
  }

  const customerTxns = (id: string) => data.transactions.filter((t) => t.customerId === id).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Customers</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.customers.length} customers · {data.customers.filter((c) => c.status === 'Active').length} active</p>
        </div>
        <Btn onClick={openCreate}><Plus className="h-4 w-4" /> Add customer</Btn>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or company…" aria-label="Search customers" className="pl-9" />
          </div>
          <SelectInput value={plan} onChange={(e) => setPlan(e.target.value as Plan | 'All')} aria-label="Filter by plan" className="w-36">
            <option value="All">All plans</option><option>Starter</option><option>Growth</option><option>Enterprise</option>
          </SelectInput>
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value as Status | 'All')} aria-label="Filter by status" className="w-36">
            <option value="All">All statuses</option><option>Active</option><option>Trial</option><option>Churned</option>
          </SelectInput>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState title="No customers match" body="Try a different search or filter, or add a new customer." action={<Btn onClick={openCreate}><Plus className="h-4 w-4" /> Add customer</Btn>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Lifetime spend</th>
                    <th className="px-5 py-3 font-medium">Last active</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3">
                        <button type="button" onClick={() => setViewing(c)} className="text-left font-medium text-slate-900 hover:underline dark:text-white">{c.name}</button>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{c.email} · {c.company}</p>
                      </td>
                      <td className="px-5 py-3"><Badge>{c.plan}</Badge></td>
                      <td className="px-5 py-3"><Badge>{c.status}</Badge></td>
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{format(customerSpend(c.id))}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{timeAgo(c.lastActive)}</td>
                      <td className="px-5 py-3 text-right">
                        <RowMenu
                          label={`Actions for ${c.name}`}
                          items={[
                            { label: 'View profile', icon: <Eye className="h-4 w-4" />, onClick: () => setViewing(c) },
                            { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(c) },
                            { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => deleteCustomer(c.id) },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={safePage} totalPages={totalPages} onPage={setPage} total={filtered.length} label="customers" />
          </>
        )}
      </Card>

      {(creating || editing) && (
        <Modal title={editing ? 'Edit customer' : 'Add customer'} onClose={() => { setCreating(false); setEditing(null) }}>
          <div className="space-y-4">
            <Field label="Full name" error={errors.name}><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Olivia Bennett" /></Field>
            <Field label="Email" error={errors.email}><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="olivia@company.com" /></Field>
            <Field label="Company" error={errors.company}><TextInput value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Northwind Traders" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Plan">
                <SelectInput value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as Plan })}>
                  <option>Starter</option><option>Growth</option><option>Enterprise</option>
                </SelectInput>
              </Field>
              <Field label="Status">
                <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}>
                  <option>Active</option><option>Trial</option><option>Churned</option>
                </SelectInput>
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => { setCreating(false); setEditing(null) }}>Cancel</Btn>
              <Btn onClick={submit}>{editing ? 'Save changes' : 'Add customer'}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.name} onClose={() => setViewing(null)}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Email</dt><dd className="font-medium text-slate-900 dark:text-white">{viewing.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Company</dt><dd className="font-medium text-slate-900 dark:text-white">{viewing.company}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Plan</dt><dd><Badge>{viewing.plan}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Status</dt><dd><Badge>{viewing.status}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Lifetime spend</dt><dd className="font-medium text-slate-900 dark:text-white">{format(customerSpend(viewing.id))}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Joined</dt><dd className="font-medium text-slate-900 dark:text-white">{formatDate(viewing.joined)}</dd></div>
          </dl>
          <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-900 dark:text-white">Recent transactions</h3>
          {customerTxns(viewing.id).length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No transactions yet for this customer.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {customerTxns(viewing.id).map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-200">{t.id} · {formatDate(t.date)}</span>
                  <span className="flex items-center gap-2"><Badge>{t.status}</Badge><span className="font-medium text-slate-900 dark:text-white">{format(t.amount)}</span></span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setViewing(null)}>Close</Btn>
            <Btn onClick={() => { const c = viewing; setViewing(null); openEdit(c) }}>Edit customer</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
