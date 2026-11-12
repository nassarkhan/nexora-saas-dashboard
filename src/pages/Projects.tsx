import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Project, ProjectStatus } from '../lib/types'
import { Badge, Btn, Card, EmptyState, Field, Modal, Pagination, RowMenu, SelectInput, TextInput } from '../components/ui'
import { formatDate } from '../lib/utils'

const STATUSES: Array<ProjectStatus | 'All'> = ['All', 'Active', 'On Track', 'At Risk', 'Completed', 'On Hold']
const PAGE_SIZE = 6

const EMPTY_PROJECT: Omit<Project, 'id'> = {
  name: '', client: '', status: 'Active', progress: 0, budget: 10000, spent: 0,
  deadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), team: [], description: '',
}

export default function Projects() {
  const { data, createProject, updateProject, deleteProject, pendingOpen, clearPendingOpen, format } = useStore()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'All'>('All')
  const [sort, setSort] = useState<'deadline' | 'progress' | 'budget'>('deadline')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Project | null>(null)
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<Project | null>(null)
  const [form, setForm] = useState(EMPTY_PROJECT)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Global search can open a project even when already on this page.
  useEffect(() => {
    if (pendingOpen?.type === 'project') {
      const p = data.projects.find((x) => x.id === pendingOpen.id)
      if (p) setViewing(p)
      clearPendingOpen()
    }
  }, [pendingOpen, data.projects, clearPendingOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = data.projects.filter((p) =>
      (status === 'All' || p.status === status) &&
      (q === '' || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)),
    )
    list = [...list].sort((a, b) =>
      sort === 'deadline' ? a.deadline.localeCompare(b.deadline)
        : sort === 'progress' ? b.progress - a.progress
        : b.budget - a.budget,
    )
    return list
  }, [data.projects, query, status, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [query, status, sort])

  const openCreate = () => { setForm(EMPTY_PROJECT); setErrors({}); setCreating(true) }
  const openEdit = (p: Project) => {
    setForm({ name: p.name, client: p.client, status: p.status, progress: p.progress, budget: p.budget, spent: p.spent, deadline: p.deadline.slice(0, 10), team: p.team, description: p.description })
    setErrors({}); setEditing(p)
  }

  const submit = () => {
    const errs: Record<string, string> = {}
    if (form.name.trim().length < 2) errs.name = 'Project name is required.'
    if (form.client.trim().length < 2) errs.client = 'Client name is required.'
    if (form.budget <= 0) errs.budget = 'Budget must be greater than 0.'
    if (form.progress < 0 || form.progress > 100) errs.progress = 'Progress must be 0–100.'
    if (!form.deadline) errs.deadline = 'Deadline is required.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    if (editing) updateProject(editing.id, { ...form, team: form.team })
    else createProject({ ...form, team: form.team.length ? form.team : [form.client] })
    setCreating(false); setEditing(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.projects.length} projects · {data.projects.filter((p) => p.status === 'Active' || p.status === 'On Track').length} active</p>
        </div>
        <Btn onClick={openCreate}><Plus className="h-4 w-4" /> New project</Btn>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects or clients…" aria-label="Search projects" className="pl-9" />
          </div>
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus | 'All')} aria-label="Filter by status" className="w-40">
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>)}
          </SelectInput>
          <SelectInput value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort projects" className="w-44">
            <option value="deadline">Sort: deadline</option>
            <option value="progress">Sort: progress</option>
            <option value="budget">Sort: budget</option>
          </SelectInput>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState title="No projects match" body="Try a different search or status filter, or create a new project." action={<Btn onClick={openCreate}><Plus className="h-4 w-4" /> New project</Btn>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Progress</th>
                    <th className="px-5 py-3 font-medium">Budget</th>
                    <th className="px-5 py-3 font-medium">Deadline</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.client}</p>
                      </td>
                      <td className="px-5 py-3"><Badge>{p.status}</Badge></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-sky-500" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{format(p.budget)}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatDate(p.deadline)}</td>
                      <td className="px-5 py-3 text-right">
                        <RowMenu
                          label={`Actions for ${p.name}`}
                          items={[
                            { label: 'View details', icon: <Eye className="h-4 w-4" />, onClick: () => setViewing(p) },
                            { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(p) },
                            { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => deleteProject(p.id) },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={safePage} totalPages={totalPages} onPage={setPage} total={filtered.length} label="projects" />
          </>
        )}
      </Card>

      {(creating || editing) && (
        <Modal title={editing ? 'Edit project' : 'New project'} onClose={() => { setCreating(false); setEditing(null) }}>
          <div className="space-y-4">
            <Field label="Project name" error={errors.name}><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Website Redesign" /></Field>
            <Field label="Client" error={errors.client}><TextInput value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Northwind Traders" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
                  {STATUSES.filter((s) => s !== 'All').map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </Field>
              <Field label="Deadline" error={errors.deadline}><TextInput type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Budget (USD)" error={errors.budget}><TextInput type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} /></Field>
              <Field label="Spent (USD)"><TextInput type="number" min={0} value={form.spent} onChange={(e) => setForm({ ...form, spent: Number(e.target.value) })} /></Field>
              <Field label="Progress %" error={errors.progress}><TextInput type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Description"><TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this project about?" /></Field>
            <p className="text-xs text-slate-400">Amounts are entered in USD and shown in your selected currency.</p>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => { setCreating(false); setEditing(null) }}>Cancel</Btn>
              <Btn onClick={submit}>{editing ? 'Save changes' : 'Create project'}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.name} onClose={() => setViewing(null)}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Client</dt><dd className="font-medium text-slate-900 dark:text-white">{viewing.client}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Status</dt><dd><Badge>{viewing.status}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Progress</dt><dd className="font-medium text-slate-900 dark:text-white">{viewing.progress}%</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Budget</dt><dd className="font-medium text-slate-900 dark:text-white">{format(viewing.budget)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Spent</dt><dd className="font-medium text-slate-900 dark:text-white">{format(viewing.spent)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Deadline</dt><dd className="font-medium text-slate-900 dark:text-white">{formatDate(viewing.deadline)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Team</dt><dd className="font-medium text-slate-900 dark:text-white">{viewing.team.join(', ')}</dd></div>
            <p className="text-slate-600 dark:text-slate-300">{viewing.description}</p>
          </dl>
          <div className="mt-5 flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setViewing(null)}>Close</Btn>
            <Btn onClick={() => { const p = viewing; setViewing(null); openEdit(p) }}>Edit project</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
