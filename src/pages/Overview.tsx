import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowDownRight, ArrowUpRight, DollarSign, Eye, FolderKanban, Plus, Trash2, TrendingUp, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../lib/store'
import { Badge, Btn, Card, CardHeader, DateRangePicker, RowMenu } from '../components/ui'
import { RANGE_LABELS, cn, formatDate, formatDateTime, formatNumber, renderAmountText, timeAgo } from '../lib/utils'

function Kpi({ label, value, change, prevLabel, icon, spark, sparkColor }: {
  label: string; value: string; change?: number; prevLabel: string; icon: React.ReactNode; spark: number[]; sparkColor: string
}) {
  const up = (change ?? 0) >= 0
  const max = Math.max(...spark)
  const min = Math.min(...spark)
  const points = spark.map((v, i) => `${(i / (spark.length - 1)) * 100},${34 - ((v - min) / (max - min || 1)) * 30}`).join(' ')
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{icon}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          {change === undefined ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">—</span>
          ) : (
            <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium', up ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400')}>
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">vs {prevLabel}</p>
        </div>
        <svg width="100" height="36" viewBox="0 0 100 36" aria-hidden="true" className="shrink-0">
          <polyline points={points} fill="none" stroke={sparkColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
    </Card>
  )
}

const TRAFFIC = [
  { name: 'Organic Search', value: 42, color: '#0f172a' },
  { name: 'Direct', value: 28, color: '#0ea5e9' },
  { name: 'Referral', value: 18, color: '#10b981' },
  { name: 'Social', value: 12, color: '#f59e0b' },
]

export default function Overview() {
  const { data, metrics, range, format, updateTransactionStatus, deleteTransaction, pushToast } = useStore()
  const now = new Date()

  const chartData = useMemo(() => {
    if (range === '12m') {
      const months: Array<{ label: string; revenue: number }> = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = d.toISOString().slice(0, 7)
        const revenue = metrics.series
          .filter((p) => p.date.startsWith(key))
          .reduce((s, p) => s + p.revenue, 0)
        months.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), revenue })
      }
      // series only covers the current range; for months with no points, fall back to the full daily series via range data
      return months.map((m) => ({ ...m, revenue: m.revenue || 0 }))
    }
    if (range === '90d') {
      const weeks: Array<{ label: string; revenue: number }> = []
      for (let i = 0; i < metrics.series.length; i += 7) {
        const chunk = metrics.series.slice(i, i + 7)
        weeks.push({ label: chunk[0]?.label ?? '', revenue: chunk.reduce((s, p) => s + p.revenue, 0) })
      }
      return weeks
    }
    return metrics.series.map((p) => ({ label: p.label, revenue: p.revenue }))
  }, [metrics.series, range])

  const recentTxns = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const spark = (offset: number) => metrics.series.filter((_, i) => i % Math.max(1, Math.floor(metrics.series.length / 12)) === 0).map((p) => p.revenue + offset)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Demo workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {data.settings.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} — here is what is happening in your workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker />
          <Link to="/projects"><Btn><Plus className="h-4 w-4" /> New project</Btn></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total Revenue" value={format(metrics.revenue)} change={metrics.revenueChange} prevLabel={format(metrics.prevRevenue)} icon={<DollarSign className="h-4 w-4" />} spark={spark(0)} sparkColor="#0ea5e9" />
        <Kpi label="Total Customers" value={formatNumber(data.customers.length)} change={metrics.customerChange} prevLabel={`${metrics.prevCustomers} new in previous period`} icon={<Users className="h-4 w-4" />} spark={metrics.series.map((p) => p.customers * 900 + 1200)} sparkColor="#10b981" />
        <Kpi label="Active Projects" value={String(metrics.activeProjects)} prevLabel={`${data.projects.length} total projects`} icon={<FolderKanban className="h-4 w-4" />} spark={data.projects.map((p) => p.progress * 40)} sparkColor="#8b5cf6" />
        <Kpi label="Conversion Rate" value={`${metrics.conversion.toFixed(2)}%`} change={metrics.conversionChange} prevLabel={`${metrics.prevConversion.toFixed(2)}% previous period`} icon={<TrendingUp className="h-4 w-4" />} spark={metrics.series.map((p) => p.revenue / 40)} sparkColor="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Revenue overview" subtitle={`Daily revenue · ${RANGE_LABELS[range]}`} action={<span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total {format(metrics.revenue)}</span>} />
          <div className="h-72 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => format(v)} width={80} />
                <Tooltip formatter={(v) => [format(Number(v)), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Traffic sources" subtitle={RANGE_LABELS[range]} />
          <div className="flex flex-col items-center px-5 py-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={TRAFFIC} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2} strokeWidth={0}>
                    {TRAFFIC.map((t) => <Cell key={t.name} fill={t.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 w-full space-y-2">
              {TRAFFIC.map((t) => (
                <li key={t.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                  <span className="flex-1 text-slate-600 dark:text-slate-300">{t.name}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{t.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Recent transactions" subtitle="Latest payments across all customers" action={<Link to="/transactions" className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400">View all</Link>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3 font-medium">Transaction</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{t.id}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.customerName}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatDate(t.date)}</td>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{format(t.amount)}</td>
                    <td className="px-5 py-3"><Badge>{t.status}</Badge></td>
                    <td className="px-5 py-3 text-right">
                      <RowMenu
                        label={`Actions for ${t.id}`}
                        items={[
                          { label: 'View details', icon: <Eye className="h-4 w-4" />, onClick: () => pushToast(`${t.id} · ${t.customerName} · ${format(t.amount)} · ${t.method} · ${t.status}`) },
                          { label: 'Mark refunded', icon: <Activity className="h-4 w-4" />, onClick: () => updateTransactionStatus(t.id, 'Refunded') },
                          { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => deleteTransaction(t.id) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent activity" subtitle="System and user events" />
          <ul className="divide-y divide-slate-50 px-5 dark:divide-slate-800/60">
            {data.activity.slice(0, 7).map((a) => (
              <li key={a.id} className="py-3">
                <p className="text-sm text-slate-700 dark:text-slate-200">{renderAmountText(a.text, a.amountUsd, format)}</p>
                <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(a.time)} · {timeAgo(a.time)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
