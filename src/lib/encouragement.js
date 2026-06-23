// Rule-based encouragement engine — NO AI. Maps app state to friendly,
// uplifting copy. Tone: motivating, never strict or scary (see plan §2).

function pick(arr, seed = new Date().getDate()) {
  return arr[seed % arr.length];
}

export function greeting(name) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return name ? `${part}, ${name}` : part;
}

// One overall "message of the day" chosen from whatever's most relevant.
export function messageOfTheDay({ streak, tasksToday, money }) {
  if (streak >= 3) return `${streak}-day streak — you're on a roll. Keep the rhythm going.`;
  if (tasksToday?.total > 0 && tasksToday.done === tasksToday.total)
    return 'Everything for today is done. Go enjoy life — you earned it.';
  if (money?.hasAccounts && money.runway != null && money.runway < 7)
    return 'Money is running a little low — go gentle for a few days and you’ll be fine.';
  return pick([
    'Today is a great day to build the life you want.',
    'One small win is all today needs. You got this.',
    'Balance beats perfection. Make one good choice now.',
    'Show up for yourself today — future you says thanks.',
  ]);
}

// Money note now reasons about real money + runway instead of a budget.
export function moneyNote({ hasAccounts, runway }) {
  if (!hasAccounts) return 'Add an account to see your money at a glance.';
  if (runway == null) return 'Log a few expenses and Sonder learns how long your money lasts.';
  if (runway >= 30) return 'Your money has plenty of runway. Nicely managed.';
  if (runway >= 14) return 'You’ve got a comfortable cushion. Keep it steady.';
  if (runway >= 7) return 'About a week of runway at your pace — ease up where you can.';
  return 'Money is running low — go gentle for a few days.';
}

export function affordNote(level, ctx = {}) {
  switch (level) {
    case 'yes':
      return { text: 'Yes — that’s a small slice of your money. Go for it.', tone: 'good' };
    case 'tight':
      return { text: 'Doable, but it’s a real chunk. Maybe sleep on it.', tone: 'warn' };
    case 'no':
      return { text: 'That would take a big part of your money. Think it over.', tone: 'bad' };
    case 'over':
      return { text: 'That’s more than you have right now.', tone: 'bad' };
    default:
      return { text: 'Add an account balance to get a clear answer.', tone: 'muted' };
  }
}

export function tasksNote({ done, total }) {
  if (total === 0) return 'Nothing due today. Add a task or simply enjoy the day.';
  if (done === total) return 'All done for today — beautiful work.';
  if (done === 0) return `${total} to tackle today. Start with the easiest one.`;
  return `${done}/${total} done — you're more than halfway. Keep going.`;
}

export function gymNote({ thisWeek, didToday }) {
  if (didToday) return 'Workout logged today — your body says thank you.';
  if (thisWeek === 0) return 'A fresh week to move. Even 20 minutes counts.';
  if (thisWeek >= 4) return `${thisWeek} workouts this week — you're crushing it.`;
  return `${thisWeek} workout${thisWeek === 1 ? '' : 's'} this week. One more keeps the momentum.`;
}

export function goalNote(progress) {
  if (progress >= 1) return 'Goal complete — take a moment to feel proud.';
  if (progress >= 0.75) return 'So close now — you’re almost there.';
  if (progress >= 0.4) return 'You’re getting closer every day.';
  if (progress > 0) return 'Great start — momentum is building.';
  return 'This is the life you’re building. First step today?';
}
