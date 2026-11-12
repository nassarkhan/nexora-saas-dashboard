import type { ActivityEvent, Customer, NotificationItem, Project, ReportItem, Settings, StoreData, Transaction } from '../lib/types'
import { isoDaysAgo } from '../lib/utils'

/**
 * Demo data, seeded once into localStorage on first load.
 * All amounts are USD; the selected currency only changes display.
 * Replace this file (and src/lib/store.ts) with real API calls to go live.
 */

const CUSTOMERS: Array<Omit<Customer, 'id'>> = [
  { name: 'Olivia Bennett', email: 'olivia@northwind.co', company: 'Northwind Traders', plan: 'Enterprise', status: 'Active', joined: isoDaysAgo(320), lastActive: isoDaysAgo(0) },
  { name: 'Liam Carter', email: 'liam@brightpath.io', company: 'Brightpath', plan: 'Growth', status: 'Active', joined: isoDaysAgo(210), lastActive: isoDaysAgo(1) },
  { name: 'Sofia Ramirez', email: 'sofia@lumenlabs.com', company: 'Lumen Labs', plan: 'Growth', status: 'Active', joined: isoDaysAgo(180), lastActive: isoDaysAgo(0) },
  { name: 'Noah Thompson', email: 'noah@atlasware.dev', company: 'Atlasware', plan: 'Starter', status: 'Trial', joined: isoDaysAgo(12), lastActive: isoDaysAgo(2) },
  { name: 'Ava Mitchell', email: 'ava@corestack.app', company: 'Corestack', plan: 'Enterprise', status: 'Active', joined: isoDaysAgo(295), lastActive: isoDaysAgo(1) },
  { name: 'Ethan Brooks', email: 'ethan@fieldnote.co', company: 'Fieldnote', plan: 'Growth', status: 'Active', joined: isoDaysAgo(150), lastActive: isoDaysAgo(3) },
  { name: 'Mia Patel', email: 'mia@swiftcart.shop', company: 'Swiftcart', plan: 'Starter', status: 'Active', joined: isoDaysAgo(95), lastActive: isoDaysAgo(0) },
  { name: 'Lucas Meyer', email: 'lucas@orbitpay.eu', company: 'Orbitpay', plan: 'Enterprise', status: 'Active', joined: isoDaysAgo(260), lastActive: isoDaysAgo(4) },
  { name: 'Amelia Foster', email: 'amelia@havenly.co', company: 'Havenly', plan: 'Growth', status: 'Trial', joined: isoDaysAgo(8), lastActive: isoDaysAgo(1) },
  { name: 'James Sullivan', email: 'james@peakform.io', company: 'Peakform', plan: 'Starter', status: 'Churned', joined: isoDaysAgo(140), lastActive: isoDaysAgo(45) },
  { name: 'Isabella Chen', email: 'isabella@novacare.health', company: 'Novacare', plan: 'Enterprise', status: 'Active', joined: isoDaysAgo(230), lastActive: isoDaysAgo(0) },
  { name: 'Mason Reed', email: 'mason@driftly.ai', company: 'Driftly', plan: 'Growth', status: 'Active', joined: isoDaysAgo(120), lastActive: isoDaysAgo(2) },
  { name: 'Harper Diaz', email: 'harper@bloomly.co', company: 'Bloomly', plan: 'Starter', status: 'Active', joined: isoDaysAgo(60), lastActive: isoDaysAgo(5) },
  { name: 'Elijah Grant', email: 'elijah@summitline.com', company: 'Summitline', plan: 'Growth', status: 'Active', joined: isoDaysAgo(175), lastActive: isoDaysAgo(1) },
]

const PROJECTS: Array<Omit<Project, 'id'>> = [
  { name: 'Website Redesign', client: 'Northwind Traders', status: 'Active', progress: 72, budget: 48000, spent: 34500, deadline: isoDaysAgo(-18), team: ['Olivia Bennett', 'Liam Carter'], description: 'Full redesign of the Northwind storefront, checkout and customer portal.' },
  { name: 'Mobile App Launch', client: 'Brightpath', status: 'On Track', progress: 58, budget: 62000, spent: 36100, deadline: isoDaysAgo(-32), team: ['Sofia Ramirez', 'Noah Thompson'], description: 'iOS and Android launch for the Brightpath learning app.' },
  { name: 'Analytics Migration', client: 'Lumen Labs', status: 'At Risk', progress: 41, budget: 35000, spent: 22400, deadline: isoDaysAgo(-9), team: ['Ava Mitchell'], description: 'Migrate product analytics to the new warehouse and rebuild dashboards.' },
  { name: 'Payment Integration', client: 'Orbitpay', status: 'Active', progress: 84, budget: 28000, spent: 23900, deadline: isoDaysAgo(-12), team: ['Lucas Meyer', 'Mason Reed'], description: 'Add card and bank-transfer checkout to Orbitpay merchant pages.' },
  { name: 'Brand Refresh', client: 'Havenly', status: 'On Track', progress: 35, budget: 18000, spent: 6300, deadline: isoDaysAgo(-45), team: ['Amelia Foster'], description: 'New visual identity, logo system and marketing site for Havenly.' },
  { name: 'Customer Portal', client: 'Corestack', status: 'Completed', progress: 100, budget: 41000, spent: 39800, deadline: isoDaysAgo(14), team: ['Ava Mitchell', 'Ethan Brooks'], description: 'Self-service portal with billing, tickets and usage reports.' },
  { name: 'E-commerce Storefront', client: 'Swiftcart', status: 'Active', progress: 66, budget: 54000, spent: 35200, deadline: isoDaysAgo(-25), team: ['Mia Patel', 'Harper Diaz'], description: 'Headless storefront with search, recommendations and fast checkout.' },
  { name: 'Data Pipeline v2', client: 'Atlasware', status: 'On Hold', progress: 22, budget: 30000, spent: 7100, deadline: isoDaysAgo(-60), team: ['Noah Thompson'], description: 'Streaming pipeline rebuild, paused while Atlasware finalises scope.' },
  { name: 'Onboarding Flow', client: 'Novacare', status: 'Active', progress: 47, budget: 22000, spent: 10800, deadline: isoDaysAgo(-21), team: ['Isabella Chen'], description: 'Guided onboarding and clinician setup for Novacare clinics.' },
  { name: 'AI Support Bot', client: 'Driftly', status: 'On Track', progress: 61, budget: 39000, spent: 24100, deadline: isoDaysAgo(-38), team: ['Mason Reed', 'Sofia Ramirez'], description: 'AI assistant trained on Driftly help docs, with human handoff.' },
  { name: 'Inventory System', client: 'Bloomly', status: 'At Risk', progress: 29, budget: 26000, spent: 9400, deadline: isoDaysAgo(-15), team: ['Harper Diaz'], description: 'Real-time stock tracking across Bloomly warehouses.' },
  { name: 'Reporting Suite', client: 'Summitline', status: 'Completed', progress: 100, budget: 33000, spent: 32100, deadline: isoDaysAgo(30), team: ['Elijah Grant', 'Liam Carter'], description: 'Scheduled and ad-hoc reporting for Summitline operations.' },
]

// [customer index, days ago, amount USD, method, status]
const TXN_ROWS: Array<[number, number, number, Transaction['method'], Transaction['status']]> = [
  [0, 0, 4200, 'Card', 'Completed'],
  [1, 1, 1850, 'Stripe', 'Completed'],
  [2, 2, 2400, 'Card', 'Completed'],
  [4, 3, 5100, 'Bank Transfer', 'Completed'],
  [6, 4, 890, 'Card', 'Completed'],
  [0, 5, 4200, 'Card', 'Completed'],
  [10, 6, 3900, 'Stripe', 'Completed'],
  [3, 7, 450, 'Card', 'Pending'],
  [5, 8, 1650, 'Card', 'Completed'],
  [11, 9, 2100, 'PayPal', 'Completed'],
  [7, 11, 4750, 'Bank Transfer', 'Completed'],
  [13, 12, 1950, 'Card', 'Completed'],
  [2, 14, 2400, 'Card', 'Refunded'],
  [8, 15, 750, 'Card', 'Completed'],
  [1, 17, 1850, 'Stripe', 'Completed'],
  [4, 19, 5100, 'Bank Transfer', 'Completed'],
  [12, 21, 620, 'Card', 'Pending'],
  [0, 23, 4200, 'Card', 'Completed'],
  [6, 25, 890, 'Card', 'Failed'],
  [10, 27, 3900, 'Stripe', 'Completed'],
  [5, 29, 1650, 'Card', 'Completed'],
  [11, 32, 2100, 'PayPal', 'Completed'],
  [7, 35, 4750, 'Bank Transfer', 'Completed'],
  [13, 38, 1950, 'Card', 'Completed'],
  [2, 41, 2400, 'Card', 'Completed'],
  [4, 45, 5100, 'Bank Transfer', 'Completed'],
  [1, 52, 1850, 'Stripe', 'Completed'],
  [0, 60, 4200, 'Card', 'Completed'],
]

export function buildSeed(): StoreData {
  const customers: Customer[] = CUSTOMERS.map((c, i) => ({ ...c, id: `cus-${String(i + 1).padStart(2, '0')}` }))
  const projects: Project[] = PROJECTS.map((p, i) => ({ ...p, id: `prj-${String(i + 1).padStart(2, '0')}` }))
  const transactions: Transaction[] = TXN_ROWS.map(([ci, days, amount, method, status], i) => ({
    id: `txn-${1000 + i}`,
    customerId: customers[ci].id,
    customerName: customers[ci].name,
    date: isoDaysAgo(days),
    amount,
    method,
    status,
  }))
  const notifications: NotificationItem[] = [
    { id: 'not-01', title: 'Payment received', body: 'Olivia Bennett paid {amount} for Website Redesign.', amountUsd: 4200, time: isoDaysAgo(0, 9), read: false, kind: 'payment' },
    { id: 'not-02', title: 'Project milestone reached', body: 'Payment Integration is now 84% complete.', time: isoDaysAgo(0, 8), read: false, kind: 'project' },
    { id: 'not-03', title: 'New customer signed up', body: 'Amelia Foster started a Growth trial.', time: isoDaysAgo(1, 15), read: false, kind: 'customer' },
    { id: 'not-04', title: 'Invoice overdue', body: 'Invoice for Atlasware is 3 days overdue.', time: isoDaysAgo(1, 10), read: false, kind: 'payment' },
    { id: 'not-05', title: 'Weekly report ready', body: 'Your revenue report for last week is ready to download.', time: isoDaysAgo(2, 9), read: true, kind: 'system' },
    { id: 'not-06', title: 'Project at risk', body: 'Analytics Migration is behind schedule.', time: isoDaysAgo(2, 14), read: true, kind: 'project' },
    { id: 'not-07', title: 'Payment refunded', body: 'Sofia Ramirez was refunded {amount}.', amountUsd: 2400, time: isoDaysAgo(3, 11), read: true, kind: 'payment' },
    { id: 'not-08', title: 'New team member', body: 'Mason Reed joined the AI Support Bot project.', time: isoDaysAgo(4, 10), read: true, kind: 'system' },
    { id: 'not-09', title: 'Customer churned', body: 'James Sullivan cancelled the Starter plan.', time: isoDaysAgo(5, 16), read: true, kind: 'customer' },
    { id: 'not-10', title: 'System maintenance', body: 'Scheduled maintenance completed successfully.', time: isoDaysAgo(6, 3), read: true, kind: 'system' },
  ]
  const reports: ReportItem[] = [
    { id: 'rep-01', name: 'Monthly Revenue Summary', kind: 'Revenue', range: '30d', created: isoDaysAgo(1) },
    { id: 'rep-02', name: 'Customer Acquisition Report', kind: 'Customers', range: '90d', created: isoDaysAgo(4) },
    { id: 'rep-03', name: 'Q4 Transactions Export', kind: 'Transactions', range: '90d', created: isoDaysAgo(7) },
    { id: 'rep-04', name: 'Executive PDF Summary', kind: 'PDF summary', range: '12m', created: isoDaysAgo(10) },
  ]
  const activity: ActivityEvent[] = [
    { id: 'act-01', text: 'Olivia Bennett paid {amount}', amountUsd: 4200, time: isoDaysAgo(0, 9) },
    { id: 'act-02', text: 'Payment Integration reached 84% completion', time: isoDaysAgo(0, 8) },
    { id: 'act-03', text: 'Amelia Foster started a Growth trial', time: isoDaysAgo(1, 15) },
    { id: 'act-04', text: 'Liam Carter updated the Mobile App Launch', time: isoDaysAgo(1, 12) },
    { id: 'act-05', text: 'Sofia Ramirez was refunded {amount}', amountUsd: 2400, time: isoDaysAgo(3, 11) },
    { id: 'act-06', text: 'Customer Portal was marked Completed', time: isoDaysAgo(5, 10) },
    { id: 'act-07', text: 'Mason Reed joined AI Support Bot', time: isoDaysAgo(4, 10) },
    { id: 'act-08', text: 'Monthly Revenue Summary was exported', time: isoDaysAgo(2, 9) },
  ]
  const settings: Settings = {
    name: 'Alex Morgan', email: 'alex@nexora.io', company: 'Nexora', currency: 'USD',
    theme: 'light', language: 'English', emailNotifications: true, pushNotifications: true, weeklyDigest: false,
  }
  return { projects, customers, transactions, notifications, reports, activity, settings }
}
