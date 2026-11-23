// DEV ONLY: fills the planner, guests and budget with the "Sofia & Daniel" demo
// wedding used for the App Store screenshots. Wired to a __DEV__-only button in
// Settings; never call it from production code.
import { usePlannerStore } from '../zustand/planner';
import { useGuestsStore, type AgeGroup, type MenuChoice, type RsvpStatus } from '../zustand/guests';
import { useBudgetStore } from '../zustand/budget';

type Row = [name: string, group: string, status: RsvpStatus, menu: MenuChoice, plusOne?: boolean, age?: AgeGroup, phone?: string];

const GUESTS: Row[] = [
  ['Isabella Rossi', 'family', 'attending', 'adult', true],
  ['Marco Rossi', 'family', 'attending', 'vegetarian'],
  ['Giulia Rossi', 'family', 'attending', 'kids', false, 'child'],
  ['Nonna Lucia', 'family', 'attending', 'gluten_free'],
  ['Elena Bianchi', 'family', 'waiting', 'unset', true, 'adult', '+1 415 555 0142'],
  ['Chloe Martin', 'friends', 'attending', 'vegan'],
  ['Ava Thompson', 'friends', 'attending', 'adult', true],
  ['Mia Johnson', 'friends', 'waiting', 'unset', false, 'adult', '+1 415 555 0178'],
  ['Emma Wilson', 'friends', 'waiting', 'unset'],
  ['Rachel Green', 'work', 'attending', 'adult'],
  ['Olivia Park', 'work', 'waiting', 'unset', false, 'adult', '+1 628 555 0110'],
  ['Robert Carter', 'family_b', 'attending', 'adult', true],
  ['Susan Carter', 'family_b', 'attending', 'adult'],
  ['Leo Carter', 'family_b', 'attending', 'kids', false, 'child'],
  ['Baby June', 'family_b', 'attending', 'unset', false, 'baby'],
  ['James Walker', 'friends_b', 'attending', 'adult', true],
  ['Noah King', 'friends_b', 'waiting', 'unset', false, 'adult', '+1 212 555 0199'],
  ['Ethan Brooks', 'friends_b', 'attending', 'vegetarian'],
  ['Lucas Reed', 'work_b', 'attending', 'adult'],
  ['Henry Scott', 'work_b', 'waiting', 'unset'],
  ['Theo & Ana Price', 'mutual', 'attending', 'adult', true],
  ['Grace Lee', 'mutual', 'waiting', 'unset', false, 'adult', '+1 415 555 0123'],
];

const DONE = [
  'choose_wedding_date', 'set_budget', 'draft_guest_list', 'book_ceremony_venue', 'book_reception_venue',
  'book_photographer', 'book_caterer', 'start_wedding_website', 'schedule_engagement_photos', 'create_gift_registry',
];

export function loadDemoWedding() {
  if (!__DEV__) return;

  const planner = usePlannerStore.getState();
  planner.reset();
  planner.setCouple('Sofia', 'Daniel');
  planner.setDate('2027-09-12');
  planner.setGuestEstimate(120);
  planner.setVibe({ color: 'blush', season: 'fall', style: 'garden', honeymoon: 'europe' });
  planner.markDoneMany(DONE);
  planner.setNote('book_florist', 'Loved Bloom & Vine: ask for a quote with garden roses and olive branches.');

  useGuestsStore.setState({ guests: [] });
  const guests = useGuestsStore.getState();
  guests.seedCoupleGroups('Sofia', 'Daniel');
  for (const [name, groupId, status, menu, plusOne = false, age = 'adult', phone = ''] of GUESTS) {
    guests.addGuest({ name, groupId, status, menu, plusOne, age, phone, note: '' });
  }

  useBudgetStore.setState({ expenses: [] });
  const budget = useBudgetStore.getState();
  budget.setTotal(40000);
  const items: [string, string, number, number, string | null][] = [
    ['venue', 'Villa Rosa: venue rental', 12000, 6000, '2027-03-01'],
    ['catering', 'Dinner for 120', 9600, 2000, '2026-12-05'],
    ['photo', 'Photographer, full day', 4200, 4200, null],
    ['attire', 'Wedding dress', 2400, 800, '2026-11-10'],
    ['flowers', 'Bouquet and centerpieces', 2600, 0, '2027-01-15'],
    ['music', 'String quartet + DJ', 2800, 500, '2027-02-20'],
    ['rings', 'Wedding bands', 1900, 1900, null],
    ['paper', 'Invitations', 650, 0, '2027-04-01'],
  ];
  for (const [categoryId, label, estimated, paid, dueDate] of items) {
    budget.addExpense({ categoryId, label, estimated, paid, dueDate });
  }
}
