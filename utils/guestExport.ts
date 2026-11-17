// Guest list export: printable HTML (PDF / AirPrint) and a CSV spreadsheet.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { guestStats, menuLabel, type Guest, type GuestGroup } from '../zustand/guests';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const groupName = (groups: GuestGroup[], id: string) =>
  groups.find((group) => group.id === id)?.name ?? '';

// Groups in the app's order, then any guest whose group was deleted.
function guestsByGroup(guests: Guest[], groups: GuestGroup[]) {
  const sections = groups
    .map((group) => ({ name: group.name, guests: guests.filter((g) => g.groupId === group.id) }))
    .filter((section) => section.guests.length > 0);
  const known = new Set(groups.map((group) => group.id));
  const orphans = guests.filter((guest) => !known.has(guest.groupId));
  if (orphans.length) sections.push({ name: 'Other', guests: orphans });
  return sections;
}

export function guestListHtml(guests: Guest[], groups: GuestGroup[], coupleTitle: string): string {
  const stats = guestStats(guests);
  const sections = guestsByGroup(guests, groups)
    .map(
      (section) => `
      <h2>${escapeHtml(section.name)} <span>(${section.guests.length})</span></h2>
      <table>
        <thead><tr><th>Name</th><th>RSVP</th><th>Age</th><th>Menu</th><th>Phone</th></tr></thead>
        <tbody>
          ${section.guests
            .map(
              (guest) => `<tr>
              <td>${escapeHtml(guest.name)}${guest.plusOne ? ' <em>+1</em>' : ''}</td>
              <td class="${guest.status}">${capitalize(guest.status)}</td>
              <td>${capitalize(guest.age)}</td>
              <td>${escapeHtml(menuLabel(guest.menu))}</td>
              <td>${escapeHtml(guest.phone)}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>`,
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #2E2429; padding: 24px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .summary { color: #7A6E73; font-size: 12px; margin-bottom: 18px; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .6px; margin: 22px 0 6px; }
    h2 span { color: #7A6E73; font-weight: normal; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; color: #7A6E73; font-weight: 600; border-bottom: 1px solid #E8DDE0; padding: 6px 4px; }
    td { border-bottom: 1px solid #F2ECEE; padding: 6px 4px; }
    em { color: #7A6E73; font-style: normal; font-size: 11px; }
    .attending { color: #4F8A62; } .declined { color: #B5675F; } .waiting { color: #7A6E73; }
    tr { page-break-inside: avoid; }
  </style></head><body>
    <h1>Guest list: ${escapeHtml(coupleTitle)}</h1>
    <div class="summary">${stats.invited} invited · ${stats.attending} attending · ${stats.waiting} waiting · ${stats.declined} declined · ${stats.adults} adults, ${stats.children} kids, ${stats.babies} babies</div>
    ${sections || '<p>No guests yet.</p>'}
  </body></html>`;
}

const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export function guestListCsv(guests: Guest[], groups: GuestGroup[]): string {
  const header = ['Name', 'Group', 'RSVP', 'Plus one', 'Age', 'Menu', 'Phone', 'Email', 'Address', 'Note'];
  const rows = guestsByGroup(guests, groups).flatMap((section) =>
    section.guests.map((guest) => [
      guest.name,
      groupName(groups, guest.groupId) || section.name,
      capitalize(guest.status),
      guest.plusOne ? 'Yes' : 'No',
      capitalize(guest.age),
      menuLabel(guest.menu),
      guest.phone,
      guest.email,
      guest.address,
      guest.note,
    ]),
  );
  // BOM so Excel opens accented names correctly.
  return '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export async function printGuestList(guests: Guest[], groups: GuestGroup[], coupleTitle: string) {
  await Print.printAsync({ html: guestListHtml(guests, groups, coupleTitle) });
}

export async function shareGuestListPdf(guests: Guest[], groups: GuestGroup[], coupleTitle: string) {
  const { uri } = await Print.printToFileAsync({ html: guestListHtml(guests, groups, coupleTitle) });
  const file = new File(Paths.cache, `guest-list-${Date.now()}.pdf`);
  new File(uri).move(file);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Guest list',
  });
}

export async function shareGuestListCsv(guests: Guest[], groups: GuestGroup[]) {
  const file = new File(Paths.cache, `guest-list-${Date.now()}.csv`);
  file.create({ overwrite: true });
  file.write(guestListCsv(guests, groups));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Guest list',
  });
}
