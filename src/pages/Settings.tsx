import { useState } from 'react'
import { useStore } from '../lib/store'
import { Btn, Card, CardHeader, Field, SelectInput, TextInput, Toggle } from '../components/ui'
import { CURRENCY_LABELS } from '../lib/utils'
import type { Currency } from '../lib/types'

export default function Settings() {
  const { data, updateSettings, format, pushToast } = useStore()
  const s = data.settings
  const [profile, setProfile] = useState({ name: s.name, email: s.email, company: s.company })
  const [profileError, setProfileError] = useState('')

  const saveProfile = () => {
    if (profile.name.trim().length < 2) { setProfileError('Name is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) { setProfileError('Enter a valid email address.'); return }
    setProfileError('')
    updateSettings({ name: profile.name.trim(), email: profile.email.trim(), company: profile.company.trim() })
    pushToast('Profile saved')
  }

  const resetDemo = () => {
    if (!window.confirm('Reset all demo data? Your edits will be replaced with the original sample data.')) return
    localStorage.removeItem('nexora-dashboard-v1')
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Profile, preferences and workspace settings. Theme, currency, language and toggles save immediately — there is no Save button for them.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Profile" subtitle="Shown in the sidebar and the welcome message" />
          <div className="space-y-4 px-5 py-5">
            <Field label="Full name"><TextInput value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
            <Field label="Email"><TextInput type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
            <Field label="Company"><TextInput value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} /></Field>
            {profileError && <p className="text-xs text-rose-600">{profileError}</p>}
            <div className="flex justify-end"><Btn onClick={saveProfile}>Save profile</Btn></div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Preferences" subtitle="Applied everywhere, immediately" />
          <div className="space-y-5 px-5 py-5">
            <Field label="Currency — every amount, chart axis and form label uses this">
              <SelectInput value={s.currency} onChange={(e) => updateSettings({ currency: e.target.value as Currency })}>
                {(Object.keys(CURRENCY_LABELS) as Currency[]).map((c) => <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>)}
              </SelectInput>
            </Field>
            <p className="-mt-2 text-xs text-slate-400">Preview: {format(4200)} · {format(579303)}</p>
            <Field label="Theme">
              <SelectInput value={s.theme} onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' })}>
                <option value="light">Light</option><option value="dark">Dark</option>
              </SelectInput>
            </Field>
            <Field label="Language">
              <SelectInput value={s.language} onChange={(e) => updateSettings({ language: e.target.value })}>
                <option>English</option><option>Spanish</option><option>French</option><option>German</option><option>Urdu</option>
              </SelectInput>
            </Field>
            <p className="-mt-2 text-xs text-slate-400">Language is a saved preference only — it does not translate the interface.</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Notifications" subtitle="Choose what you are told about" />
          <div className="space-y-4 px-5 py-5">
            {[
              { label: 'Email notifications', desc: 'Payment and project updates by email', key: 'emailNotifications' as const, value: s.emailNotifications },
              { label: 'Push notifications', desc: 'In-app alerts for new activity', key: 'pushNotifications' as const, value: s.pushNotifications },
              { label: 'Weekly digest', desc: 'A summary of revenue and activity every Monday', key: 'weeklyDigest' as const, value: s.weeklyDigest },
            ].map((t) => (
              <div key={t.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{t.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.desc}</p>
                </div>
                <Toggle checked={t.value} onChange={(v) => updateSettings({ [t.key]: v })} label={t.label} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Security & data" subtitle="Demo workspace controls" />
          <div className="space-y-4 px-5 py-5 text-sm">
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-slate-900 dark:text-white">Two-factor authentication</p><p className="text-xs text-slate-500 dark:text-slate-400">Not available in this demo — no real accounts exist.</p></div>
              <Toggle checked={false} onChange={() => pushToast('Two-factor authentication is not available in the demo.', 'error')} label="Two-factor authentication" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div><p className="font-medium text-slate-900 dark:text-white">Reset demo data</p><p className="text-xs text-slate-500 dark:text-slate-400">Restore the original 12 projects, 14 customers and 28 transactions.</p></div>
              <Btn variant="danger" onClick={resetDemo}>Reset data</Btn>
            </div>
            <p className="text-xs text-slate-400">All data is stored locally in your browser (localStorage). Nothing is sent to a server. To connect a real backend, replace src/lib/store.ts and src/data/seed.ts with API calls — see the README.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
