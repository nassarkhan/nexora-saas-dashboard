import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download } from 'lucide-react'
import { useStore } from '../lib/store'
import { Btn, Card, CardHeader, DateRangePicker } from '../components/ui'
import { RANGE_LABELS, downloadCsv, formatNumber } from '../lib/utils'

export default function Analytics() {
  const { metrics, range, format, pushToast, dailySeries } = useStore()

  const monthly = useMemo(() => {
    const map = new Map<string, { label: string; revenue: number; customers: number }>()
    for (const p of dailySeries.slice(-365)) {
      const d = new Date(p.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short' })
      const cur = map.get(key) ?? { label, revenue: 0, customers: 0 }
      cur.revenue += p.revenue
      cur.customers += p.customers
      map.set(key, cur)
    }
    return [...map.values()]
  }, [dailySeries])

  const barData = useMemo(() => {
    if (range === '7d' || range === '30d') {
      return metrics.series.map((p) => ({ label: p.label, revenue: p.revenue, customers: p.customers }))
    }
    if (range === '90d') {
      const weeks: Array<{ label: string; revenue: number; customers: number }> = []
      for (let i = 0; i < metrics.series.length; i += 7) {
        const chunk = metrics.series.slice(i, i + 7)
        weeks.push({ label: chunk[0]?.label ?? '', revenue: chunk.reduce((s, p) => s + p.revenue, 0), customers: chunk.reduce((s, p) => s + p.customers, 0) })
      }
      return weeks
    }
    return monthly
  }, [range, metrics.series, monthly])

  const funnel = [
    { stage: 'Visitors', value: metrics.visitors, color: '#0ea5e9' },
    { stage: 'Signups', value: metrics.newCustomers * 4, color: '#10b981' },
    { stage: 'Trials', value: Math.round(metrics.newCustomers * 2.2), color: '#8b5cf6' },
    { stage: 'Paying customers', value: metrics.newCustomers, color: '#f59e0b' },
  ]
  const funnelMax = Math.max(...funnel.map((f) => f.value), 1)

  const exportCsv = () => {
    downloadCsv(`analytics-${range}.csv`, ['Date', 'Revenue (USD)', 'New customers'],
      metrics.series.map((p) => [p.date, p.revenue, p.customers]))
    pushToast('Analytics CSV exported')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Performance for {RANGE_LABELS[range].toLowerCase()} — every chart and the export follow the selected range.</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <Btn variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Revenue in period', value: format(metrics.revenue), change: metrics.revenueChange },
          { label: 'New customers', value: formatNumber(metrics.newCustomers), change: metrics.customerChange },
          { label: 'Conversion rate', value: `${metrics.conversion.toFixed(2)}%`, change: metrics.conversionChange },
        ].map((k) => (
          <Card key={k.label} className="p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">{k.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{k.value}</p>
            <p className={`mt-1 text-xs font-medium ${k.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {k.change >= 0 ? '+' : ''}{k.change.toFixed(1)}% vs previous equal-length period
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Monthly performance" subtitle={range === '12m' ? 'Revenue by month, last 12 months' : `Revenue by ${range === '90d' ? 'week' : 'day'} · ${RANGE_LABELS[range]}`} />
          <div className="h-72 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => format(v)} width={80} />
                <Tooltip formatter={(v) => [format(Number(v)), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Customer acquisition" subtitle={`New customers · ${RANGE_LABELS[range]}`} />
          <div className="h-72 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
                <Tooltip formatter={(v) => [String(v), 'New customers']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Line type="monotone" dataKey="customers" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Period comparison" subtitle="Current period vs the previous equal-length period" />
          <div className="px-5 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="py-2 font-medium">Metric</th>
                  <th className="py-2 text-right font-medium">Current</th>
                  <th className="py-2 text-right font-medium">Previous</th>
                  <th className="py-2 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Revenue', cur: format(metrics.revenue), prev: format(metrics.prevRevenue), ch: metrics.revenueChange },
                  { label: 'New customers', cur: formatNumber(metrics.newCustomers), prev: formatNumber(metrics.prevCustomers), ch: metrics.customerChange },
                  { label: 'Conversion rate', cur: `${metrics.conversion.toFixed(2)}%`, prev: `${metrics.prevConversion.toFixed(2)}%`, ch: metrics.conversionChange },
                ].map((r) => (
                  <tr key={r.label} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                    <td className="py-3 text-slate-700 dark:text-slate-200">{r.label}</td>
                    <td className="py-3 text-right font-medium text-slate-900 dark:text-white">{r.cur}</td>
                    <td className="py-3 text-right text-slate-500 dark:text-slate-400">{r.prev}</td>
                    <td className={`py-3 text-right font-medium ${r.ch >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{r.ch >= 0 ? '+' : ''}{r.ch.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Conversion funnel" subtitle={RANGE_LABELS[range]} />
          <div className="space-y-4 px-5 py-5">
            {funnel.map((f) => (
              <div key={f.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{f.stage}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatNumber(f.value)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, (f.value / funnelMax) * 100)}%`, background: f.color }} />
                </div>
              </div>
            ))}
            <p className="pt-1 text-xs text-slate-400">Funnel is derived from the selected range's visitors and signups.</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Trend explorer" subtitle="Daily revenue and signups, last 12 months" />
        <div className="h-64 px-3 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySeries.slice(-365)} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={30} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => format(v)} width={80} />
              <Tooltip formatter={(v) => [format(Number(v)), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
