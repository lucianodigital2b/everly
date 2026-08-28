// Starter names for an event, built from the signed-in user's first name.
//
// The app's UI copy is English-only and there's no i18n layer (see CLAUDE.md).
// These aren't UI copy: they're *content* the user is about to name their own
// event with, so they follow the phone's language rather than the app's. Three
// packs cover the markets the product actually sells in; everything else falls
// back to English.

import { I18nManager, NativeModules, Platform } from "react-native";

type Lang = "en" | "pt" | "es";

/**
 * The user's own language preference, as a BCP-47-ish tag.
 *
 * The obvious call — `Intl.DateTimeFormat().resolvedOptions().locale` — is a
 * trap on iOS. It resolves through `NSLocale.currentLocale`, which is capped by
 * the localizations the *app bundle* declares. Everly ships English only, so a
 * phone set to Portuguese still reports `en` and every suggestion comes out in
 * English. `AppleLanguages` is the user's real preference order and isn't
 * filtered that way.
 *
 * Android's `localeIdentifier` comes from `Locale.getDefault()`, which is the
 * system language and needs no such workaround. Intl stays as the last resort.
 *
 * Deliberately not `expo-localization`: it's a native module (a rebuild, and
 * only an optional peer of PostHog here), and this is a list of name ideas.
 */
const deviceLocaleTag = (): string => {
  if (Platform.OS === "ios") {
    try {
      const manager: any = NativeModules.SettingsManager;
      const settings = manager?.settings ?? manager?.getConstants?.().settings;
      const preferred = settings?.AppleLanguages?.[0] ?? settings?.AppleLocale;
      if (preferred) return String(preferred);
    } catch {
      // Fall through.
    }
  }

  if (Platform.OS === "android") {
    try {
      const tag = I18nManager.getConstants?.().localeIdentifier;
      if (tag) return String(tag);
    } catch {
      // Fall through.
    }
  }

  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale;
    if (tag) return String(tag);
  } catch {
    // No Intl, or a build without ICU.
  }

  return "en";
};

/** The pack to use — anything outside these three reads English. */
export const deviceLanguage = (): Lang => {
  const base = deviceLocaleTag().toLowerCase().split(/[-_]/)[0];
  if (base === "pt" || base === "es") return base;
  return "en";
};

// `{n}` is the first name. Keys match EVENT_TYPES in app/(tabs)/create.tsx;
// `generic` covers "Other" and the moment before a type is chosen.
type Pack = { byType: Record<string, string[]>; generic: string[] };

const PACKS: Record<Lang, Pack> = {
  en: {
    byType: {
      Wedding: [
        "{n}'s Wedding",
        "The {n} Wedding",
        "{n} Says I Do",
        "{n} Ties the Knot",
        "Forever, {n}",
        "{n} & Co.",
      ],
      Birthday: [
        "{n}'s Birthday",
        "Happy Birthday, {n}",
        "{n} Turns Up",
        "Cake for {n}",
        "{n} + 1 Year",
        "All for {n}",
      ],
      Trip: [
        "{n}'s Trip",
        "On the Road with {n}",
        "{n}'s Getaway",
        "Somewhere with {n}",
        "{n} Goes Places",
        "Passport, {n}",
      ],
      Anniversary: [
        "{n}'s Anniversary",
        "{n}, One More Year",
        "Another Year, {n}",
        "Still {n}",
        "{n} & Forever",
      ],
      Party: [
        "{n}'s Party",
        "A Night with {n}",
        "{n} After Dark",
        "{n}'s House",
        "Late with {n}",
        "{n} Til Dawn",
      ],
      Graduation: [
        "{n} Graduates",
        "{n}'s Graduation",
        "Cap & Gown, {n}",
        "{n} Made It",
      ],
      Engagement: [
        "{n} Said Yes",
        "{n}'s Engagement",
        "{n} Is Engaged",
        "The Ring, {n}",
      ],
      "Baby Shower": [
        "{n}'s Baby Shower",
        "Waiting for {n}",
        "Baby {n}",
        "{n} + One",
      ],
      "Sweet 15": [
        "{n} Turns 15",
        "{n}'s Sweet Fifteen",
        "Fifteen, {n}",
      ],
      Reunion: [
        "{n}'s Reunion",
        "Everyone at {n}'s",
        "Back Together, {n}",
      ],
      Corporate: [
        "{n}'s Team",
        "Offsite with {n}",
        "{n}'s Company Party",
      ],
      Holiday: [
        "{n}'s Holidays",
        "Christmas with {n}",
        "New Year with {n}",
        "The Season with {n}",
      ],
    },
    generic: [
      "{n}'s Event",
      "{n}'s Big Day",
      "Everyone & {n}",
      "{n}'s Gathering",
      "A Night with {n}",
      "With {n}",
    ],
  },
  pt: {
    // Nothing here takes a gendered article ("do/da", "o/a") — an account name
    // says nothing about gender, and guessing wrong is worse than a plainer
    // suggestion.
    byType: {
      Wedding: [
        "Casamento de {n}",
        "O casamento de {n}",
        "{n} vai casar",
        "{n} disse sim",
        "Para sempre, {n}",
        "O grande dia de {n}",
      ],
      Birthday: [
        "Aniversário de {n}",
        "Níver de {n}",
        "Parabéns, {n}",
        "{n} faz anos",
        "Mais um ano de {n}",
        "Bolo para {n}",
      ],
      Trip: [
        "Viagem de {n}",
        "Na estrada com {n}",
        "Rolê de {n}",
        "Por aí com {n}",
        "Mala pronta, {n}",
        "Sem rumo com {n}",
      ],
      // "Aniversário" already reads as birthday in pt, so the couple's date
      // gets its own words instead.
      Anniversary: [
        "Bodas de {n}",
        "Mais um ano de {n}",
        "Nosso ano, {n}",
        "Ainda {n}",
        "Comemoração de {n}",
      ],
      Party: [
        "Festa de {n}",
        "Uma noite com {n}",
        "Rolê de {n}",
        "Na casa de {n}",
        "Até o sol nascer, {n}",
        "Madrugada com {n}",
      ],
      Graduation: [
        "Formatura de {n}",
        "{n} se formou",
        "Colação de {n}",
        "Beca de {n}",
      ],
      Engagement: [
        "Noivado de {n}",
        "{n} disse sim",
        "O pedido de {n}",
        "{n} vai noivar",
      ],
      "Baby Shower": [
        "Chá de bebê de {n}",
        "Chá revelação de {n}",
        "Esperando {n}",
        "Bebê de {n}",
      ],
      "Sweet 15": [
        "15 anos de {n}",
        "Festa de 15 de {n}",
        "Debutante {n}",
      ],
      Reunion: [
        "Encontro de {n}",
        "Reunião de {n}",
        "Todos com {n}",
        "De volta com {n}",
      ],
      Corporate: [
        "Confraternização de {n}",
        "Time de {n}",
        "Fim de ano com {n}",
      ],
      Holiday: [
        "Natal de {n}",
        "Réveillon de {n}",
        "Festas de {n}",
        "Fim de ano com {n}",
      ],
    },
    generic: [
      "Evento de {n}",
      "O grande dia de {n}",
      "Todo mundo e {n}",
      "Encontro de {n}",
      "A noite de {n}",
      "Com {n}",
    ],
  },
  es: {
    byType: {
      Wedding: [
        "Boda de {n}",
        "La boda de {n}",
        "{n} se casa",
        "{n} dijo que sí",
        "Para siempre, {n}",
        "El gran día de {n}",
      ],
      Birthday: [
        "Cumpleaños de {n}",
        "Feliz cumpleaños, {n}",
        "El cumple de {n}",
        "{n} cumple años",
        "Un año más de {n}",
        "Tarta para {n}",
      ],
      Trip: [
        "Viaje de {n}",
        "En la carretera con {n}",
        "La escapada de {n}",
        "Por ahí con {n}",
        "Maletas listas, {n}",
        "Sin rumbo con {n}",
      ],
      Anniversary: [
        "Aniversario de {n}",
        "Un año más de {n}",
        "Nuestro año, {n}",
        "Todavía {n}",
        "Otro año, {n}",
      ],
      Party: [
        "Fiesta de {n}",
        "Una noche con {n}",
        "En casa de {n}",
        "Hasta el amanecer, {n}",
        "La noche de {n}",
        "Tarde con {n}",
      ],
      Graduation: [
        "Graduación de {n}",
        "{n} se gradúa",
        "Toga de {n}",
      ],
      Engagement: [
        "Compromiso de {n}",
        "{n} dijo que sí",
        "La pedida de {n}",
      ],
      "Baby Shower": [
        "Baby shower de {n}",
        "Esperando a {n}",
        "Bebé de {n}",
      ],
      "Sweet 15": [
        "Quinceañera de {n}",
        "Los 15 de {n}",
        "{n} cumple 15",
      ],
      Reunion: [
        "Reunión de {n}",
        "Encuentro de {n}",
        "Todos con {n}",
      ],
      Corporate: [
        "Fiesta de empresa de {n}",
        "Equipo de {n}",
        "Fin de año con {n}",
      ],
      Holiday: [
        "Navidad de {n}",
        "Fin de año con {n}",
        "Fiestas de {n}",
      ],
    },
    generic: [
      "Evento de {n}",
      "El gran día de {n}",
      "Todos y {n}",
      "Reunión de {n}",
      "La noche de {n}",
      "Con {n}",
    ],
  },
};

/** First word of the account name, which is what these templates read best with. */
const firstNameOf = (fullName?: string | null) => {
  const first = String(fullName ?? "")
    .trim()
    .split(/\s+/)[0];
  // A single letter or an email-looking handle makes for a worse suggestion
  // than showing none at all.
  return first.length >= 2 && !first.includes("@") ? first : "";
};

/** How many chips the row offers before it just becomes a list. */
const MAX_IDEAS = 6;

/**
 * Starter names for the chosen type, topped up from the generic pack when a
 * type is short of ideas. Empty when there's no usable first name — a chip
 * reading "'s Birthday" is worse than no chip.
 */
export const suggestEventNames = (
  fullName: string | null | undefined,
  type: string,
  lang: Lang = deviceLanguage()
): string[] => {
  const first = firstNameOf(fullName);
  if (!first) return [];

  const pack = PACKS[lang];
  const templates = [...(pack.byType[type] ?? []), ...pack.generic];

  const ideas: string[] = [];
  for (const template of templates) {
    const idea = template.replace("{n}", first);
    // The generic pack overlaps a couple of the type packs on purpose, so the
    // top-up never repeats what's already on screen.
    if (!ideas.includes(idea)) ideas.push(idea);
    if (ideas.length === MAX_IDEAS) break;
  }
  return ideas;
};
