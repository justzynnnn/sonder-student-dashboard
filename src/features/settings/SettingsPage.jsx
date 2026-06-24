import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Upload, Trash2, ShieldCheck, Sun, Moon, Bell } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';
import { useFeedback } from '../../components/Feedback';
import { saveSettings, setTabEnabled, TOGGLEABLE_TABS } from '../../data/settings';
import { CURRENCIES } from '../../lib/currency';
import { exportBackup, downloadJSON, clearAllData, importBackup } from '../../data/admin';
import { requestNotificationPermission, notificationPermission } from '../../lib/reminders';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { theme, toggle } = useTheme();
  const { toast } = useFeedback();
  const fileRef = useRef(null);
  const [name, setName] = useState(settings.name);
  const [currency, setCurrency] = useState(settings.baseCurrency);
  const [confirming, setConfirming] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // useSettings resolves async (own live query), so seed the fields once the
  // stored values arrive — otherwise they'd stay blank on first paint.
  useEffect(() => {
    setName(settings.name);
    setCurrency(settings.baseCurrency);
  }, [settings.name, settings.baseCurrency]);

  const saveProfile = async () => {
    await saveSettings({ name, baseCurrency: currency });
    toast('Saved', 'good');
  };

  const doExport = async () => {
    const data = await exportBackup();
    downloadJSON(data, `sonder-backup-${new Date().toISOString().slice(0, 10)}.json`);
    toast('Backup downloaded', 'good');
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setRestoring(false);
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const count = await importBackup(json);
      toast(`Restored ${count} items`, 'good');
      setTimeout(() => { window.location.href = '/'; }, 700);
    } catch (err) {
      toast(err.message || 'Could not read that file', 'bad');
    }
  };

  const doDelete = async () => {
    await clearAllData();
    window.location.href = '/';
  };

  const toggleReminder = async (on) => {
    if (on) {
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        toast(perm === 'unsupported' ? 'Notifications are not supported here' : 'Allow notifications to get reminders', 'bad');
        return;
      }
    }
    await saveSettings({ reminderEnabled: on });
  };

  const setReminderTime = async (time) => {
    await saveSettings({ reminderTime: time });
  };

  const perm = notificationPermission();

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-muted"><ArrowLeft size={18} /></button>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Settings</h1>
      </div>

      {/* Profile */}
      <section className="card-pad space-y-3">
        <p className="section-title">Profile</p>
        <div>
          <label className="label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" maxLength={40} />
        </div>
        <div>
          <label className="label">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
          </select>
        </div>
        <button onClick={saveProfile} className="btn-primary w-full">Save</button>
      </section>

      {/* Your tabs */}
      <section className="card-pad space-y-1">
        <p className="section-title mb-2">Your tabs</p>
        <p className="mb-2 text-xs text-muted">Turn off what you don’t need. Hidden tabs disappear from the bottom bar.</p>
        {TOGGLEABLE_TABS.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-2">
            <span className="font-semibold">{t.label}</span>
            <Switch checked={!!settings.tabs[t.id]} onChange={(v) => setTabEnabled(t.id, v)} />
          </div>
        ))}
      </section>

      {/* Daily reminder */}
      <section className="card-pad space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-2">
            <Bell size={18} className="mt-0.5 shrink-0 text-brand" />
            <div>
              <p className="font-semibold">Daily reminder</p>
              <p className="text-sm text-muted">A gentle nudge to check in — never spammy.</p>
            </div>
          </div>
          <Switch checked={!!settings.reminderEnabled && perm === 'granted'} onChange={toggleReminder} />
        </div>
        {settings.reminderEnabled && perm === 'granted' ? (
          <div>
            <label className="label">Remind me at</label>
            <input type="time" value={settings.reminderTime || '19:00'} onChange={(e) => setReminderTime(e.target.value)} className="input" />
          </div>
        ) : null}
        {perm === 'denied' ? (
          <p className="text-xs text-rose-500">Notifications are blocked in your browser settings. Allow them there to enable reminders.</p>
        ) : null}
      </section>

      {/* Appearance */}
      <section className="card-pad flex items-center justify-between">
        <div>
          <p className="font-semibold">Appearance</p>
          <p className="text-sm text-muted">{theme === 'dark' ? 'Dark' : 'Light'} mode</p>
        </div>
        <button onClick={toggle} className="btn-ghost"> {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} Toggle</button>
      </section>

      {/* Privacy & data */}
      <section className="card-pad space-y-3">
        <div className="flex items-start gap-2">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-money" />
          <p className="text-sm text-muted">
            Sonder is <span className="font-semibold text-ink">100% on this device</span>. No account, no servers, nothing leaves your phone. You own your data — back it up so a new phone or reinstall never loses it.
          </p>
        </div>
        <button onClick={doExport} className="btn-ghost w-full"><Download size={18} /> Export my data (JSON)</button>

        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} className="hidden" />
        {!restoring ? (
          <button onClick={() => setRestoring(true)} className="btn-ghost w-full"><Upload size={18} /> Restore from a backup</button>
        ) : (
          <div className="rounded-2xl border border-brand/30 bg-brand/5 p-3">
            <p className="text-sm font-semibold text-ink">Replace everything with a backup file?</p>
            <p className="mt-0.5 text-xs text-muted">Your current data on this device will be overwritten by the file you choose.</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setRestoring(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={() => fileRef.current?.click()} className="btn-primary flex-1">Choose file</button>
            </div>
          </div>
        )}

        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="btn-ghost w-full text-rose-500"><Trash2 size={18} /> Delete all my data</button>
        ) : (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-3">
            <p className="text-sm font-semibold text-ink">Erase everything on this device?</p>
            <p className="mt-0.5 text-xs text-muted">This can’t be undone. Consider exporting first.</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setConfirming(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={doDelete} className="btn flex-1 bg-rose-500 text-white">Delete everything</button>
            </div>
          </div>
        )}
      </section>

      <p className="pb-4 text-center text-xs text-muted">Sonder · v0.1 · Made for students</p>
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-brand' : 'bg-line'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  );
}
