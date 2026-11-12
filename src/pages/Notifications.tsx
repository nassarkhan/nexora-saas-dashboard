import { useMemo, useState } from 'react'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Btn, Card, EmptyState } from '../components/ui'
import { cn, renderAmountText, timeAgo } from '../lib/utils'

const KIND_STYLE: Record<string, string> = {
  payment: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  project: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  customer: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  system: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

export default function Notifications() {
  const { data, markNotificationRead, markAllNotificationsRead, deleteNotification, format } = useStore()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const unread = data.notifications.filter((n) => !n.read).length

  const list = useMemo(() => {
    const sorted = [...data.notifications].sort((a, b) => Number(a.read) - Number(b.read) || b.time.localeCompare(a.time))
    return filter === 'unread' ? sorted.filter((n) => !n.read) : sorted
  }, [data.notifications, filter])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{unread} unread of {data.notifications.length} total</p>
        </div>
        <Btn variant="secondary" onClick={markAllNotificationsRead} disabled={unread === 0}>
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Btn>
      </div>

      <div className="flex gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn('rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors', filter === f ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800')}
          >
            {f === 'all' ? `All (${data.notifications.length})` : `Unread (${unread})`}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            body={filter === 'unread' ? 'You are all caught up. New payments, project updates and system events will appear here.' : 'Notifications about payments, projects and system events will appear here.'}
          />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {list.map((n) => (
              <li key={n.id} className={cn('flex items-start gap-3 px-5 py-4', !n.read && 'bg-sky-50/50 dark:bg-sky-500/5')}>
                <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', KIND_STYLE[n.kind])}>
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                    {!n.read && <Badge>Unread</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{renderAmountText(n.body, n.amountUsd, format)}</p>
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(n.time)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => markNotificationRead(n.id, !n.read)}
                    aria-label={n.read ? `Mark ${n.title} as unread` : `Mark ${n.title} as read`}
                    title={n.read ? 'Mark as unread' : 'Mark as read'}
                    className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNotification(n.id)}
                    aria-label={`Delete ${n.title}`}
                    title="Delete"
                    className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
