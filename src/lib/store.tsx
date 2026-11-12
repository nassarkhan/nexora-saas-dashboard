import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ActivityEvent, Currency, Customer, DateRangeKey, DayPoint, NotificationItem, Project, ReportItem, Settings, StoreData, Transaction, TxnStatus } from './types'
import { buildSeed } from '../data/seed'
import { RANGE_DAYS, daysAgoDate, formatMoney, uid } from './utils'

const STORAGE_KEY = 'nexora-dashboard-v1'

function loadData(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoreData
      if (parsed && Array.isArray(parsed.projects) && Array.isArray(parsed.customers)) return parsed
    }
  } catch { /* corrupted storage: reseed below */ }
  const seed = buildSeed()
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)) } catch { /* storage unavailable */ }
  return seed
}

/** Deterministic daily series for the last 731 days (so a 12-month range has a full previous year). */
export function buildDailySeries(): DayPoint[] {
  const points: DayPoint[] = []
  const today = daysAgoDate(0)
  for (let i = 730; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const seed = Math.sin(i * 12.9898) * 43758.5453
    const frac = seed - Math.floor(seed)
    const seasonal = Math.sin(i / 29) * 320
    const revenue = Math.round(1500 + seasonal + frac * 900 + (i % 7 === 5 ? 420 : 0))
    const customers = Math.floor(frac * 4) + (i % 9 === 0 ? 2 : 0)
    points.push({
      date: d.toISOString().slice(0, 10),
      revenue,
      customers,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  return points
}

export interface RangeMetrics {
  revenue: number
  prevRevenue: number
  revenueChange: number
  newCustomers: number
  prevCustomers: number
  customerChange: number
  activeProjects: number
  conversion: number
  prevConversion: number
  conversionChange: number
  series: DayPoint[]
  visitors: number
}

export type OpenTarget = { type: 'customer' | 'project' | 'transaction'; id: string } | null

export interface Toast { id: string; message: string; kind: 'success' | 'error' }

export interface StoreValue {
  data: StoreData
  range: DateRangeKey
  setRange: (r: DateRangeKey) => void
  currency: Currency
  format: (amountUsd: number) => string
  metrics: RangeMetrics
  dailySeries: DayPoint[]
  toasts: Toast[]
  pushToast: (message: string, kind?: Toast['kind']) => void
  customerSpend: (customerId: string) => number
  createProject: (p: Omit<Project, 'id'>) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
  createCustomer: (c: Omit<Customer, 'id'>) => void
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
  createTransaction: (t: Omit<Transaction, 'id'>) => void
  updateTransactionStatus: (id: string, status: TxnStatus) => void
  deleteTransaction: (id: string) => void
  createReport: (r: Omit<ReportItem, 'id' | 'created'>) => void
  deleteReport: (id: string) => void
  markNotificationRead: (id: string, read: boolean) => void
  markAllNotificationsRead: () => void
  deleteNotification: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  pendingOpen: OpenTarget
  openItem: (t: NonNullable<OpenTarget>) => void
  clearPendingOpen: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(loadData)
  const [range, setRange] = useState<DateRangeKey>('30d')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pendingOpen, setPendingOpen] = useState<OpenTarget>(null)
  const savedOnce = useRef(false)

  useEffect(() => {
    if (!savedOnce.current) { savedOnce.current = true; return }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
  }, [data])

  // Apply saved theme to <html> immediately and on change.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.settings.theme === 'dark')
  }, [data.settings.theme])

  const pushToast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = uid('toast')
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])

  const dailySeries = useMemo(() => buildDailySeries(), [])

  const metrics: RangeMetrics = useMemo(() => {
    const days = RANGE_DAYS[range]
    const cur = dailySeries.slice(-days)
    const prev = dailySeries.slice(-days * 2, -days)
    const revenue = cur.reduce((s, p) => s + p.revenue, 0)
    const prevRevenue = prev.reduce((s, p) => s + p.revenue, 0)
    const newCustomers = cur.reduce((s, p) => s + p.customers, 0)
    const prevCustomers = prev.reduce((s, p) => s + p.customers, 0)
    const visitors = Math.round(revenue / 22)
    const prevVisitors = Math.round(prevRevenue / 22)
    const conversion = visitors ? (newCustomers / visitors) * 100 : 0
    const prevConversion = prevVisitors ? (prevCustomers / prevVisitors) * 100 : 0
    return {
      revenue, prevRevenue, revenueChange: pctChange(revenue, prevRevenue),
      newCustomers, prevCustomers, customerChange: pctChange(newCustomers, prevCustomers),
      activeProjects: data.projects.filter((p) => p.status === 'Active' || p.status === 'On Track').length,
      conversion, prevConversion, conversionChange: pctChange(conversion, prevConversion),
      series: cur, visitors,
    }
  }, [range, dailySeries, data.projects])

  const format = useCallback((amountUsd: number) => formatMoney(amountUsd, data.settings.currency), [data.settings.currency])

  const customerSpend = useCallback((customerId: string) => {
    return data.transactions
      .filter((t) => t.customerId === customerId && t.status === 'Completed')
      .reduce((s, t) => s + t.amount, 0)
  }, [data.transactions])

  const addActivity = useCallback((text: string, amountUsd?: number) => {
    const item: ActivityEvent = { id: uid('act'), text, amountUsd, time: new Date().toISOString() }
    setData((d) => ({ ...d, activity: [item, ...d.activity].slice(0, 30) }))
  }, [])

  const addNotification = useCallback((title: string, body: string, kind: NotificationItem['kind'], amountUsd?: number) => {
    const item: NotificationItem = { id: uid('not'), title, body, amountUsd, time: new Date().toISOString(), read: false, kind }
    setData((d) => ({ ...d, notifications: [item, ...d.notifications] }))
  }, [])

  const createProject = useCallback((p: Omit<Project, 'id'>) => {
    const project: Project = { ...p, id: uid('prj') }
    setData((d) => ({ ...d, projects: [project, ...d.projects] }))
    addActivity(`Project "${p.name}" was created`)
    pushToast('Project created')
  }, [addActivity, pushToast])

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setData((d) => ({ ...d, projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
    pushToast('Project updated')
  }, [pushToast])

  const deleteProject = useCallback((id: string) => {
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }))
    pushToast('Project deleted')
  }, [pushToast])

  const createCustomer = useCallback((c: Omit<Customer, 'id'>) => {
    const customer: Customer = { ...c, id: uid('cus') }
    setData((d) => ({ ...d, customers: [customer, ...d.customers] }))
    addActivity(`${c.name} joined as a customer`)
    pushToast('Customer added')
  }, [addActivity, pushToast])

  const updateCustomer = useCallback((id: string, patch: Partial<Customer>) => {
    setData((d) => ({ ...d, customers: d.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
    pushToast('Customer updated')
  }, [pushToast])

  const deleteCustomer = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      customers: d.customers.filter((c) => c.id !== id),
      transactions: d.transactions.filter((t) => t.customerId !== id),
    }))
    pushToast('Customer deleted')
  }, [pushToast])

  const createTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const txn: Transaction = { ...t, id: `txn-${1000 + Math.floor(Math.random() * 9000)}` }
    setData((d) => ({ ...d, transactions: [txn, ...d.transactions] }))
    if (t.status === 'Completed') {
      addActivity(`${t.customerName} paid {amount}`, t.amount)
      addNotification('Payment received', `${t.customerName} paid {amount}.`, 'payment', t.amount)
    }
    pushToast('Transaction recorded')
  }, [addActivity, addNotification, pushToast])

  const updateTransactionStatus = useCallback((id: string, status: TxnStatus) => {
    const txn = data.transactions.find((t) => t.id === id)
    setData((d) => ({ ...d, transactions: d.transactions.map((t) => (t.id === id ? { ...t, status } : t)) }))
    if (txn) {
      if (status === 'Refunded') {
        addActivity(`${txn.customerName} was refunded {amount}`, txn.amount)
        addNotification('Payment refunded', `${txn.customerName} was refunded {amount}.`, 'payment', txn.amount)
      } else if (status === 'Completed') {
        addActivity(`${txn.customerName} paid {amount}`, txn.amount)
        addNotification('Payment received', `${txn.customerName} paid {amount}.`, 'payment', txn.amount)
      }
    }
    pushToast(`Transaction marked ${status.toLowerCase()}`)
  }, [data.transactions, addActivity, addNotification, pushToast])

  const deleteTransaction = useCallback((id: string) => {
    setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }))
    pushToast('Transaction deleted')
  }, [pushToast])

  const createReport = useCallback((r: Omit<ReportItem, 'id' | 'created'>) => {
    const report: ReportItem = { ...r, id: uid('rep'), created: new Date().toISOString() }
    setData((d) => ({ ...d, reports: [report, ...d.reports] }))
    pushToast('Report created')
  }, [pushToast])

  const deleteReport = useCallback((id: string) => {
    setData((d) => ({ ...d, reports: d.reports.filter((r) => r.id !== id) }))
    pushToast('Report deleted')
  }, [pushToast])

  const markNotificationRead = useCallback((id: string, read: boolean) => {
    setData((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read } : n)) }))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setData((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) }))
    pushToast('All notifications marked as read')
  }, [pushToast])

  const deleteNotification = useCallback((id: string) => {
    setData((d) => ({ ...d, notifications: d.notifications.filter((n) => n.id !== id) }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
  }, [])

  const openItem = useCallback((t: NonNullable<OpenTarget>) => setPendingOpen(t), [])
  const clearPendingOpen = useCallback(() => setPendingOpen(null), [])

  const value: StoreValue = {
    data, range, setRange, currency: data.settings.currency, format, metrics, dailySeries,
    toasts, pushToast, customerSpend,
    createProject, updateProject, deleteProject,
    createCustomer, updateCustomer, deleteCustomer,
    createTransaction, updateTransactionStatus, deleteTransaction,
    createReport, deleteReport,
    markNotificationRead, markAllNotificationsRead, deleteNotification,
    updateSettings, pendingOpen, openItem, clearPendingOpen,
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
