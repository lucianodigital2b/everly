import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type RsvpStatus = 'waiting' | 'attending' | 'declined';
export type AgeGroup = 'adult' | 'child' | 'baby';
export type MenuChoice =
  | 'unset'
  | 'adult'
  | 'kids'
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free';

export type Guest = {
  id: string;
  name: string;
  groupId: string;
  status: RsvpStatus;
  plusOne: boolean;
  note: string;
  createdAt: number;
  age: AgeGroup;
  phone: string;
  email: string;
  address: string;
  menu: MenuChoice;
  coupleSlot: 'a' | 'b' | null;
};

export type GuestGroup = {
  id: string;
  name: string;
};

export const MENU_OPTIONS: { id: MenuChoice; label: string }[] = [
  { id: 'adult', label: 'Adult menu' },
  { id: 'kids', label: 'Kids menu' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten_free', label: 'Gluten-free' },
];

export function menuLabel(m: MenuChoice): string {
  if (m === 'unset') return 'Not chosen';
  return MENU_OPTIONS.find((option) => option.id === m)?.label ?? 'Not chosen';
}

const DEFAULT_GROUPS: GuestGroup[] = [
  { id: 'family', name: 'Family' },
  { id: 'friends', name: 'Friends' },
  { id: 'work', name: 'Work' },
];

const PROTECTED_GROUP_IDS = [
  'family',
  'friends',
  'work',
  'family_b',
  'friends_b',
  'mutual',
  'couple',
  'work_b',
];

type AddGuestInput = {
  name: string;
  groupId: string;
  status: RsvpStatus;
  plusOne: boolean;
  note: string;
  age?: AgeGroup;
  phone?: string;
  email?: string;
  address?: string;
  menu?: MenuChoice;
};

type UpdateGuestPatch = Partial<Omit<Guest, 'id' | 'createdAt'>>;

type GuestsState = {
  guests: Guest[];
  groups: GuestGroup[];
  addGuest: (input: AddGuestInput) => string;
  updateGuest: (id: string, patch: UpdateGuestPatch) => void;
  removeGuest: (id: string) => void;
  cycleStatus: (id: string) => void;
  addGroup: (name: string) => string;
  renameGroup: (id: string, name: string) => void;
  removeGroup: (id: string) => void;
  addGuestsBulk: (
    rows: { name: string; phone?: string }[],
    groupId: string,
  ) => number;
  seedCoupleGroups: (a: string, b: string) => void;
};

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const useGuestsStore = create<GuestsState>()(
  persist(
    (set, get) => ({
      guests: [],
      groups: DEFAULT_GROUPS,

      addGuest: (input) => {
        const id = generateId();
        const guest: Guest = {
          ...input,
          id,
          createdAt: Date.now(),
          age: input.age ?? 'adult',
          phone: input.phone ?? '',
          email: input.email ?? '',
          address: input.address ?? '',
          menu: input.menu ?? (input.age === 'child' ? 'kids' : 'unset'),
          coupleSlot: null,
        };
        set((state) => ({ guests: [...state.guests, guest] }));
        return id;
      },

      updateGuest: (id, patch) =>
        set((state) => ({
          guests: state.guests.map((guest) =>
            guest.id === id ? { ...guest, ...patch } : guest,
          ),
        })),

      removeGuest: (id) =>
        set((state) => {
          const guest = state.guests.find((g) => g.id === id);
          if (!guest || guest.coupleSlot !== null) return {};
          return { guests: state.guests.filter((g) => g.id !== id) };
        }),

      cycleStatus: (id) =>
        set((state) => ({
          guests: state.guests.map((guest) => {
            if (guest.id !== id) return guest;
            const order: RsvpStatus[] = ['waiting', 'attending', 'declined'];
            const currentIndex = order.indexOf(guest.status);
            const nextStatus = order[(currentIndex + 1) % order.length];
            return { ...guest, status: nextStatus };
          }),
        })),

      addGroup: (name) => {
        const id = generateId();
        set((state) => ({
          groups: [...state.groups, { id, name: name.trim() }],
        }));
        return id;
      },

      renameGroup: (id, name) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, name: name.trim() } : group,
          ),
        })),

      removeGroup: (id) => {
        if (PROTECTED_GROUP_IDS.includes(id)) return;
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          guests: state.guests.map((guest) =>
            guest.groupId === id ? { ...guest, groupId: 'friends' } : guest,
          ),
        }));
      },

      addGuestsBulk: (rows, groupId) => {
        const newGuests: Guest[] = rows.map((row) => ({
          id: generateId(),
          name: row.name.trim(),
          groupId,
          status: 'waiting',
          plusOne: false,
          note: '',
          createdAt: Date.now(),
          age: 'adult',
          phone: row.phone ?? '',
          email: '',
          address: '',
          menu: 'unset',
          coupleSlot: null,
        }));

        set((state) => ({
          guests: [...state.guests, ...newGuests],
        }));

        return newGuests.length;
      },

      seedCoupleGroups: (a, b) => {
        const partnerA = a.trim();
        const partnerB = b.trim();
        if (!partnerA || !partnerB) return;

        const state = get();
        const groups = state.groups.map((group) => ({ ...group }));
        const guests = state.guests.map((guest) => ({ ...guest }));
        let changed = false;

        const renameIfExact = (
          id: string,
          exact: string,
          replacement: string,
        ) => {
          const group = groups.find((g) => g.id === id);
          if (group && group.name === exact) {
            group.name = replacement;
            changed = true;
          }
        };

        renameIfExact('family', 'Family', `${partnerA}'s family`);
        renameIfExact('friends', 'Friends', `${partnerA}'s friends`);
        renameIfExact('work', 'Work', `${partnerA}'s work`);

        const addIfMissing = (id: string, name: string) => {
          if (!groups.some((group) => group.id === id)) {
            groups.push({ id, name });
            changed = true;
          }
        };

        addIfMissing('family_b', `${partnerB}'s family`);
        addIfMissing('friends_b', `${partnerB}'s friends`);
        addIfMissing('work_b', `${partnerB}'s work`);
        addIfMissing('mutual', 'Mutual friends');

        const coupleIndex = groups.findIndex((group) => group.id === 'couple');
        if (coupleIndex === -1) {
          groups.unshift({ id: 'couple', name: 'Couple' });
          changed = true;
        } else if (coupleIndex !== 0) {
          const [coupleGroup] = groups.splice(coupleIndex, 1);
          groups.unshift(coupleGroup);
          changed = true;
        }

        const ensureCoupleGuest = (slot: 'a' | 'b', guestName: string) => {
          const exists = guests.some((guest) => guest.coupleSlot === slot);
          if (!exists) {
            guests.push({
              id: generateId(),
              name: guestName,
              groupId: 'couple',
              status: 'attending',
              age: 'adult',
              plusOne: false,
              note: '',
              phone: '',
              email: '',
              address: '',
              menu: 'adult',
              coupleSlot: slot,
              createdAt: Date.now(),
            });
            changed = true;
          }
        };

        ensureCoupleGuest('a', partnerA);
        ensureCoupleGuest('b', partnerB);

        if (changed) {
          set({ groups, guests });
        }
      },
    }),
    {
      name: 'guests-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<GuestsState>;
        return {
          guests: (state.guests ?? []).map((guest) => ({
            age: 'adult' as AgeGroup,
            phone: '',
            email: '',
            address: '',
            menu: 'unset' as MenuChoice,
            coupleSlot: null,
            ...guest,
          })),
          groups: state.groups ?? DEFAULT_GROUPS,
        } as GuestsState;
      },
    },
  ),
);

export function guestStats(guests: Guest[]) {
  let invited = 0;
  let attending = 0;
  let declined = 0;
  let waiting = 0;
  let adults = 0;
  let children = 0;
  let babies = 0;

  for (const guest of guests) {
    const heads = guest.plusOne ? 2 : 1;
    invited += heads;

    if (guest.status === 'attending') {
      attending += heads;
    } else if (guest.status === 'declined') {
      declined += heads;
    } else if (guest.status === 'waiting') {
      waiting += heads;
    }

    if (guest.age === 'adult') {
      adults += heads;
    } else if (guest.age === 'child') {
      children += 1;
      if (guest.plusOne) adults += 1;
    } else if (guest.age === 'baby') {
      babies += 1;
      if (guest.plusOne) adults += 1;
    }
  }

  return {
    invited,
    attending,
    declined,
    waiting,
    people: adults + children + babies,
    adults,
    children,
    babies,
  };
}

export function guestListText(
  guests: Guest[],
  groups: GuestGroup[],
  coupleTitle: string,
): string {
  const lines: string[] = [`Guest list for ${coupleTitle}`, ''];

  for (const group of groups) {
    const groupGuests = guests.filter((guest) => guest.groupId === group.id);
    lines.push(`${group.name.toUpperCase()} (${groupGuests.length})`);

    for (const guest of groupGuests) {
      const plusOne = guest.plusOne ? ' (+1)' : '';
      const statusLabel =
        guest.status.charAt(0).toUpperCase() + guest.status.slice(1);
      lines.push(`- ${guest.name}${plusOne} - ${statusLabel}`);
    }

    lines.push('');
  }

  const stats = guestStats(guests);
  lines.push(
    `Totals: ${stats.invited} invited, ${stats.attending} attending, ${stats.waiting} waiting, ${stats.declined} declined`,
  );

  return lines.join('\n');
}

export function rsvpMessage(
  guestName: string,
  coupleTitle: string,
  weddingISO: string | null,
): string {
  const weddingDate = weddingISO
    ? (() => {
        const [y, m, d] = weddingISO.split('-').map(Number);
        return new Date(y, m - 1, d, 12);
      })()
    : null;
  const dateText = weddingDate
    ? weddingDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'our wedding day';

  return `Hi ${guestName}! You are invited to celebrate with ${coupleTitle} on ${dateText}. Please let us know if you can make it!`;
}

export function whatsappUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function parseGuestLines(
  text: string,
): { name: string; phone?: string }[] {
  const rows: { name: string; phone?: string }[] = [];
  const seenNames = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    let name = '';
    let phone = '';

    const tabIndex = line.indexOf('\t');
    if (tabIndex >= 0) {
      name = line.slice(0, tabIndex).trim();
      phone = line.slice(tabIndex + 1).trim();
    } else {
      const dashIndex = line.indexOf(' - ');
      if (dashIndex >= 0) {
        name = line.slice(0, dashIndex).trim();
        phone = line.slice(dashIndex + 3).trim();
      } else {
        const commaIndex = line.indexOf(',');
        if (commaIndex >= 0) {
          name = line.slice(0, commaIndex).trim();
          phone = line.slice(commaIndex + 1).trim();
        } else {
          name = line;
        }
      }
    }

    const key = name.toLowerCase();
    if (!name || seenNames.has(key)) continue;

    seenNames.add(key);
    if (phone) {
      rows.push({ name, phone });
    } else {
      rows.push({ name });
    }
  }

  return rows;
}
