import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3, Bell, ChevronRight, ChevronsLeft, ChevronsRight, FileText, FolderKanban,
  HelpCircle, Home, LayoutDashboard, LogOut, Menu, Moon, Receipt, Search, Settings as SettingsIcon,
  Sun, User, Users, X, Zap,
} from 'lucide-react'
import { cn, renderAmountText, timeAgo } from '../lib/utils'
import { useStore } from '../lib/store'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

const CRUMBS: Record<string, string> = {
  '/': 'Overview', '/analytics': 'Analytics', '/projects': 'Projects', '/customers': 'Customers',
  '/transactions': 'Transactions', '/reports': 'Reports', '/notifications': 'Notifications', '/settings': 'Settings',
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { data } = useStore()
  const unread = data.notifications.filter((n) => !n.read).length
  return (
    <div className="flex h-full flex-col">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-4 py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
          <Zap className="h-5 w-5" />
        </span>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Nexora</span>
        )}
      </Link>
      <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
              collapsed && 'justify-center px-2',
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span className="flex-1">{label}</span>}
            {!collapsed && label === 'Notifications' && unread > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{unread}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <Link to="/settings" onClick={onNavigate} className={cn('flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800', collapsed && 'justify-center')}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {data.settings.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{data.settings.name}</span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{data.settings.email}</span>
            </span>
          )}
        </Link>
      </div>
    </div>
  )
}

function GlobalSearch() {
  const { data, openItem, format } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const out: Array<{ type: 'customer' | 'project' | 'transaction'; id: string; title: string; sub: string; to: string }> = []
    for (const c of data.customers) {
      if (c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)) {
        out.push({ type: 'customer', id: c.id, title: c.name, sub: `${c.company} · ${c.plan}`, to: '/customers' })
      }
    }
    for (const p of data.projects) {
      if (p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)) {
        out.push({ type: 'project', id: p.id, title: p.name, sub: `${p.client} · ${p.status}`, to: '/projects' })
      }
    }
    for (const t of data.transactions) {
      if (t.id.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q)) {
        out.push({ type: 'transaction', id: t.id, title: `${t.id} — ${t.customerName}`, sub: `${format(t.amount)} · ${t.status} · ${t.method}`, to: '/transactions' })
      }
    }
    return out.slice(0, 7)
  }, [query, data])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open ])

  const pick = (r: (typeof results)[number]) => {
    setOpen(false)
    setQuery('')
    if (location.pathname !== r.to) navigate(r.to)
    // Always open the exact item, even when already on that page.
    setTimeout(() => openItem({ type: r.type, id: r.id }), location.pathname !== r.to ? 60 : 0)
  }

  return (
    <div className="relative hidden w-full max-w-md sm:block" ref={ref}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        placeholder="Search customers, projects, transactions…"
        aria-label="Global search"
        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">No results for “{query}”.</p>
          ) : (
            results.map((r) => (
              <button key={`${r.type}-${r.id}`} type="button" onClick={() => pick(r)} className="flex w-full flex-col px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{r.title}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{r.sub}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function BellMenu() {
  const { data, markAllNotificationsRead, format } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = data.notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open ])

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={`Notifications, ${unread} unread`} aria-expanded={open} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
            <button type="button" onClick={markAllNotificationsRead} className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Mark all read</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.slice(0, 6).map((n) => (
              <button key={n.id} type="button" onClick={() => { setOpen(false); navigate('/notifications') }} className="block w-full border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-700">
                <span className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
                  <span>
                    <span className="block text-sm font-medium text-slate-900 dark:text-white">{n.title}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{renderAmountText(n.body, n.amountUsd, format)}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(n.time)}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setOpen(false); navigate('/notifications') }} className="block w-full rounded-b-lg px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}

function AvatarMenu() {
  const { data, updateSettings, pushToast } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open ])
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Account menu" aria-expanded={open} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
        {data.settings.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{data.settings.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{data.settings.email}</p>
          </div>
          <button type="button" onClick={() => { setOpen(false); navigate('/settings') }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
            <User className="h-4 w-4" /> Profile & settings
          </button>
          <button type="button" onClick={() => { setOpen(false); updateSettings({ theme: data.settings.theme === 'dark' ? 'light' : 'dark' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
            {data.settings.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Switch to {data.settings.theme === 'dark' ? 'light' : 'dark'} mode
          </button>
          <button type="button" onClick={() => { setOpen(false); pushToast('This demo has no sign-in — there is no account to sign out of.', 'error') }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-slate-50 dark:text-rose-400 dark:hover:bg-slate-700">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const location = useLocation()
  const { data, updateSettings, pushToast } = useStore()
  const [collapsed, setCollapsed] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const dark = data.settings.theme === 'dark'

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop sidebar */}
      <aside className={cn('sticky top-0 hidden h-screen shrink-0 border-r border-slate-200 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 lg:block', collapsed ? 'w-16' : 'w-64')}>
        <SidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawer(false)} role="presentation" />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl dark:bg-slate-900">
            <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-3 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent collapsed={false} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </button>
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm md:flex">
            <Link to="/" className="flex items-center gap-1 font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <Home className="h-4 w-4" /> Home
            </Link>
            {location.pathname !== '/' && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                <span className="font-medium text-slate-900 dark:text-white">{CRUMBS[location.pathname] ?? 'Page'}</span>
              </>
            )}
          </nav>
          <div className="flex-1" />
          <GlobalSearch />
          <button
            type="button"
            onClick={() => pushToast('Support: support@nexora.io — replies within one business day (demo).')}
            aria-label="Help and support"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ theme: dark ? 'light' : 'dark' })}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <BellMenu />
          <AvatarMenu />
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          Nexora · Demo workspace — sample data is stored locally in your browser. No real customers or payments.
        </footer>
      </div>
    </div>
  )
}
