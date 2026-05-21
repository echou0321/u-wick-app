import type { Dashboard, Task } from '@/src/types/api';

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isDueOnDay(dueDate: string | null, dayOffset: number): boolean {
  if (!dueDate) return false;
  const due = startOfLocalDay(new Date(dueDate));
  const target = startOfLocalDay(new Date());
  target.setDate(target.getDate() + dayOffset);
  return due.getTime() === target.getTime();
}

export function tasksDueToday(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => !t.done && isDueOnDay(t.due_date, 0))
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
}

/** Due today for the glance list — includes completed items (shown struck through). */
export function tasksDueTodayForList(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => isDueOnDay(t.due_date, 0))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
}

export function tasksDueTomorrow(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => !t.done && isDueOnDay(t.due_date, 1))
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function firstName(displayName: string): string {
  const part = displayName.trim().split(/\s+/)[0];
  return part || 'there';
}

function dayVibe(label: Dashboard['heat_this_week']['label'], blockCount: number): string {
  if (blockCount >= 4) return 'Active and social day';
  switch (label) {
    case 'intense':
      return 'Packed day';
    case 'heavy':
      return 'Busy day';
    case 'moderate':
      return 'Balanced day';
    default:
      return 'Easy-going day';
  }
}

function formatSchedulePhrase(title: string, startIso: string): string {
  const lower = title.toLowerCase();
  const at = formatTime(startIso);
  if (/\b(lecture|lab|class|seminar|section)\b/.test(lower) || lower.includes('info')) {
    return `${title} at ${at}`;
  }
  return `${title} at ${at}`;
}

export function buildDaySummary(
  displayName: string,
  dashboard: Dashboard,
  allTasks: Task[],
): string {
  const todayTasks = tasksDueToday(allTasks);
  const tomorrowTasks = tasksDueTomorrow(allTasks);
  const blocks = dashboard.schedule_today ?? [];
  const vibe = dayVibe(dashboard.heat_this_week.label, blocks.length);

  const parts: string[] = [`${vibe}!`];

  if (blocks.length > 0) {
    const scheduleText = blocks
      .map((b) => formatSchedulePhrase(b.title, b.start_time))
      .join(', ');
    parts.push(`Today you have ${scheduleText}.`);
  } else {
    parts.push('Nothing on your calendar yet today.');
  }

  if (todayTasks.length > 0) {
    const titles = todayTasks.map((t) => t.title).join(', ');
    parts.push(
      todayTasks.length === 1
        ? `You also have ${titles} due today.`
        : `You also have ${todayTasks.length} things due today: ${titles}.`,
    );
  } else if (tomorrowTasks.length > 0) {
    const next = tomorrowTasks[0];
    const more =
      tomorrowTasks.length > 1
        ? ` (${tomorrowTasks.length - 1} more tomorrow)`
        : '';
    parts.push(
      `Tomorrow ${next.title} is due${more}, so consider prepping for that after your activities.`,
    );
  }

  parts.push(`Keep rocking it, ${firstName(displayName)}!`);
  return parts.join(' ');
}
