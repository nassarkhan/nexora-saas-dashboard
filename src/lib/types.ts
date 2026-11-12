export type Currency = 'USD' | 'EUR' | 'GBP' | 'PKR'
export type DateRangeKey = '7d' | '30d' | '90d' | '12m'
export type Theme = 'light' | 'dark'
export type ProjectStatus = 'Active' | 'On Track' | 'At Risk' | 'Completed' | 'On Hold'
export type TxnStatus = 'Completed' | 'Pending' | 'Refunded' | 'Failed'
export type ReportKind = 'Revenue' | 'Customers' | 'Transactions' | 'PDF summary'

export interface Project {
  id: string
  name: string
  client: string
  status: ProjectStatus
  progress: number
  budget: number
  spent: number
  deadline: string // ISO date
  team: string[]
  description: string
}

export interface Customer {
  id: string
  name: string
  email: string
  company: string
  plan: 'Starter' | 'Growth' | 'Enterprise'
  status: 'Active' | 'Trial' | 'Churned'
  joined: string
  lastActive: string
}

export interface Transaction {
  id: string
  customerId: string
  customerName: string
  date: string // ISO date
  amount: number // USD
  method: 'Card' | 'Bank Transfer' | 'PayPal' | 'Stripe'
  status: TxnStatus
}

export interface NotificationItem {
  id: string
  title: string
  /** Use {amount} as a placeholder for the amount — it is formatted in the viewer's currency at render time. */
  body: string
  amountUsd?: number
  time: string // ISO datetime
  read: boolean
  kind: 'payment' | 'project' | 'system' | 'customer'
}

export interface ReportItem {
  id: string
  name: string
  kind: ReportKind
  range: DateRangeKey
  created: string
}

export interface ActivityEvent {
  id: string
  /** Use {amount} as a placeholder for the amount — formatted in the viewer's currency at render time. */
  text: string
  amountUsd?: number
  time: string // ISO datetime
}

export interface Settings {
  name: string
  email: string
  company: string
  currency: Currency
  theme: Theme
  language: string
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
}

export interface DayPoint {
  date: string // ISO date
  revenue: number
  customers: number
  label: string
}

export interface StoreData {
  projects: Project[]
  customers: Customer[]
  transactions: Transaction[]
  notifications: NotificationItem[]
  reports: ReportItem[]
  activity: ActivityEvent[]
  settings: Settings
}
