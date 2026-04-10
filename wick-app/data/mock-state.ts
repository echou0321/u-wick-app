import { Task, ScheduleBlock, UserProfile, ChecklistItem } from '@/types';

export const MOCK_USER: UserProfile = {
  name: 'Nathan',
  targetMajor: 'Informatics',
  status: 'pre-major',
  gpa: 3.7,
};

export const MOCK_TASKS: Task[] = [
  { id: 't1', label: 'Read INFO 200 Ch. 3', due: 'Today', done: false },
  { id: 't2', label: 'MATH 307 HW 2', due: 'Tomorrow', done: false },
  { id: 't3', label: 'CSE 163 Lab 1', due: 'Mar 8', done: true },
];

export const PLANNING_TASKS: Task[] = [
  { id: 'p1', label: 'INFO 200 Reading Ch. 2', due: 'Today', done: false },
  { id: 'p2', label: 'MATH 207 Problem Set', due: 'Thu', done: false },
  { id: 'p3', label: 'CSE 163 Lab Setup', due: 'Fri', done: true },
];

export const PROACTIVE_TASKS: Task[] = [
  { id: 'pr1', label: 'INFO 200 Reading Ch. 4', due: 'Today', done: false },
  {
    id: 'pr2',
    label: 'Informatics Application',
    due: 'Mar 20',
    done: false,
    highlight: true,
  },
  { id: 'pr3', label: 'MATH 207 Problem Set', due: 'Thu', done: false },
  { id: 'pr4', label: 'CSE 163 Lab 2', due: 'Fri', done: true },
];

export const TODAY_SCHEDULE: ScheduleBlock[] = [
  {
    id: 's1',
    time: '9:30–10:20AM',
    course: 'INFO 200',
    room: 'MGH 389',
    color: '#7C6AF7',
  },
  {
    id: 's2',
    time: '11:30AM–12:20PM',
    course: 'MATH 307',
    room: 'SMI 211',
    color: '#F7A06A',
  },
  {
    id: 's3',
    time: '1:30–3:20PM',
    course: 'CSE 163',
    room: 'CSE2 G10',
    color: '#6AF7C8',
  },
];

export const PLANNING_SCHEDULE: ScheduleBlock[] = [
  {
    id: 'ps1',
    time: '9:30–10:20AM',
    course: 'INFO 200',
    room: 'MGH 389',
    color: '#7C6AF7',
  },
  {
    id: 'ps2',
    time: '11:30AM–12:20PM',
    course: 'MATH 207',
    room: 'SMI 211',
    color: '#F7A06A',
  },
  {
    id: 'ps3',
    time: '4:30–6:00PM',
    course: 'INFO 200 Study',
    room: 'Self-scheduled',
    color: '#C4B8FF',
  },
];

export const STUDY_BLOCKS: ScheduleBlock[] = [
  {
    id: 'sb1',
    day: 'Mon',
    time: '4:30–6:00PM',
    course: 'INFO 200 Study',
    color: '#7C6AF7',
  },
  {
    id: 'sb2',
    day: 'Wed',
    time: '4:30–6:00PM',
    course: 'INFO 200 Study',
    color: '#7C6AF7',
  },
  {
    id: 'sb3',
    day: 'Sat',
    time: '10:00–12:00PM',
    course: 'MATH 207 Study',
    color: '#F7A06A',
  },
  {
    id: 'sb4',
    day: 'Sun',
    time: '2:00–4:00PM',
    course: 'MATH 207 Study',
    color: '#F7A06A',
  },
];

export const ELIGIBILITY_ITEMS: string[] = [
  '✅ INFO 200 — in progress, on track',
  '✅ Computer programming — enrolled in CSE 163 ✓ (also counts: INFO 201, CSE 12x/16x series)',
  '✅ Social science class — completed PSYCH 101',
  '✅ Statistics class — enrolled in STAT 311',
  '🎓 GPA: 3.7 — great standing, makes you a strong applicant!',
];

export const APPLICATION_CHECKLIST: ChecklistItem[] = [
  { label: 'Complete INFO 200 (in progress ✓)', done: false },
  {
    label:
      'Complete a programming course — INFO 201, CSE 12x, or CSE 16x series',
    done: false,
  },
  { label: 'Complete a social science class', done: true },
  { label: 'Complete a statistics class', done: false },
  {
    label: 'Write a compelling personal statement 🌟 (this is where you stand out!)',
    done: false,
  },
  {
    label: 'Highlight extracurriculars & activities 🌟 (key differentiator!)',
    done: false,
  },
  {
    label: 'Submit via MyUW portal before Fri, Mar 20 at 11:59pm',
    done: false,
    link: true,
  },
];
