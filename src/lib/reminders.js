import { todayISO } from './dates';

// Local daily reminder. On web this fires while the app/tab is alive (or on
// reopen) once the chosen time has passed and the user hasn't checked in today.
// Capacitor-ready: on native, swap the `new Notification(...)` for
// @capacitor/local-notifications `LocalNotifications.schedule(...)` for true
// background delivery — the trigger logic below stays the same.
const LAST_KEY = 'sonder-last-remind';

export function notificationSupport() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission() {
  if (!notificationSupport()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (!notificationSupport()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function minutesOf(timeStr) {
  const [h, m] = String(timeStr || '19:00').split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

// Fire the reminder if it's enabled, permitted, past the chosen time, the user
// hasn't done anything today, and we haven't already nudged today.
export function maybeRemind(settings, checkedInToday) {
  if (!settings || !settings.reminderEnabled) return false;
  if (notificationPermission() !== 'granted') return false;
  if (checkedInToday) return false;

  const now = new Date();
  if (now.getHours() * 60 + now.getMinutes() < minutesOf(settings.reminderTime)) return false;

  const today = todayISO();
  try {
    if (localStorage.getItem(LAST_KEY) === today) return false;
    localStorage.setItem(LAST_KEY, today);
  } catch {
    /* ignore */
  }

  try {
    // eslint-disable-next-line no-new
    new Notification('Sonder', {
      body: 'A minute for yourself? Check in and keep your streak going.',
      tag: 'sonder-daily',
    });
    return true;
  } catch {
    return false;
  }
}
