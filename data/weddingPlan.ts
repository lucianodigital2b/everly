export type PhaseId = 'p12' | 'p7' | 'p4' | 'p2' | 'p1' | 'w2' | 'd0' | 'after';

export interface Phase {
  id: PhaseId;
  title: string;
  subtitle: string;
  dueDays: number;
  deadlineStyle: 'month' | 'day' | 'after';
}

export const PHASES: Phase[] = [
  { id: 'p12', title: '10-12+ months out', subtitle: 'Big-picture planning and booking', dueDays: 300, deadlineStyle: 'month' },
  { id: 'p7', title: '7-9 months out', subtitle: 'Lock in your key vendors', dueDays: 210, deadlineStyle: 'month' },
  { id: 'p4', title: '4-6 months out', subtitle: 'Details and final decisions', dueDays: 120, deadlineStyle: 'month' },
  { id: 'p2', title: '2-3 months out', subtitle: 'Paperwork, invitations, and fittings', dueDays: 60, deadlineStyle: 'month' },
  { id: 'p1', title: 'Last month', subtitle: 'Finalize everything and enjoy', dueDays: 14, deadlineStyle: 'day' },
  { id: 'w2', title: 'Last 2 weeks', subtitle: 'Wrap up final details', dueDays: 1, deadlineStyle: 'day' },
  { id: 'd0', title: 'Wedding day', subtitle: 'Be present and celebrate', dueDays: 0, deadlineStyle: 'day' },
  { id: 'after', title: 'After the wedding', subtitle: 'Thank yous, photos, and new names', dueDays: -60, deadlineStyle: 'after' },
];

export type TaskCategory =
  | 'planning'
  | 'ceremony'
  | 'reception'
  | 'photo'
  | 'music'
  | 'attire'
  | 'beauty'
  | 'flowers'
  | 'paper'
  | 'legal'
  | 'rings'
  | 'honeymoon'
  | 'guests'
  | 'camera';

export const TASK_CATEGORY_LABEL: Record<TaskCategory, string> = {
  planning: 'Planning',
  ceremony: 'Ceremony',
  reception: 'Reception',
  photo: 'Photo',
  music: 'Music',
  attire: 'Attire',
  beauty: 'Beauty',
  flowers: 'Flowers',
  paper: 'Paper',
  legal: 'Legal',
  rings: 'Rings',
  honeymoon: 'Honeymoon',
  guests: 'Guests',
  camera: 'Camera',
};

export interface TaskAction {
  label: string;
  route: string;
}

export interface PlanTask {
  id: string;
  phase: PhaseId;
  title: string;
  tip: string;
  category: TaskCategory;
  essential?: boolean;
  budgetCategoryId?: string;
  action?: TaskAction;
  custom?: boolean;
}

export const PLAN_TASKS: PlanTask[] = [
  // p12 — 10-12+ months out
  {
    id: 'set_budget',
    phase: 'p12',
    title: 'Set overall budget',
    tip: 'Decide how much you can spend before you lock in any vendors.',
    category: 'planning',
    essential: true,
    action: { label: 'Open budget', route: '/budget' },
  },
  {
    id: 'draft_guest_list',
    phase: 'p12',
    title: 'Draft guest list',
    tip: 'Build a rough headcount early so venue and catering quotes stay realistic.',
    category: 'guests',
    essential: true,
    action: { label: 'Open guest list', route: '/guests' },
  },
  {
    id: 'choose_wedding_date',
    phase: 'p12',
    title: 'Choose wedding date',
    tip: 'Pick a date that works for your families and your must-have venue.',
    category: 'planning',
  },
  {
    id: 'book_ceremony_venue',
    phase: 'p12',
    title: 'Book ceremony venue',
    tip: 'Reserve the place where you will say your vows.',
    category: 'ceremony',
    essential: true,
    budgetCategoryId: 'venue',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=venue&label=Book%20ceremony%20venue&taskId=book_ceremony_venue',
    },
  },
  {
    id: 'book_reception_venue',
    phase: 'p12',
    title: 'Book reception venue',
    tip: 'Secure the space for dinner and dancing, if separate from the ceremony.',
    category: 'reception',
    essential: true,
    budgetCategoryId: 'venue',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=venue&label=Book%20reception%20venue&taskId=book_reception_venue',
    },
  },
  {
    id: 'hire_planner',
    phase: 'p12',
    title: 'Hire wedding planner',
    tip: 'A planner can save you time and reduce stress if budget allows.',
    category: 'planning',
    budgetCategoryId: 'other',
  },
  {
    id: 'book_photographer',
    phase: 'p12',
    title: 'Book photographer',
    tip: 'Book early because top photographers fill up fast.',
    category: 'photo',
    essential: true,
    budgetCategoryId: 'photo',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=photo&label=Book%20photographer&taskId=book_photographer',
    },
  },
  {
    id: 'book_videographer',
    phase: 'p12',
    title: 'Book videographer',
    tip: 'Capture the day in motion so you can relive it.',
    category: 'photo',
    budgetCategoryId: 'photo',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=photo&label=Book%20videographer&taskId=book_videographer',
    },
  },
  {
    id: 'book_caterer',
    phase: 'p12',
    title: 'Book caterer',
    tip: 'Taste samples and confirm they can handle your guest count.',
    category: 'reception',
    essential: true,
    budgetCategoryId: 'catering',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=catering&label=Book%20caterer&taskId=book_caterer',
    },
  },
  {
    id: 'start_wedding_website',
    phase: 'p12',
    title: 'Start wedding website',
    tip: 'Build a simple site with your story, travel details, and registry links.',
    category: 'planning',
    budgetCategoryId: 'other',
  },
  {
    id: 'research_marriage_license',
    phase: 'p12',
    title: 'Research marriage license requirements',
    tip: 'Check county rules now so there are no surprises when it is time to apply.',
    category: 'legal',
  },

  // p7 — 7-9 months out
  {
    id: 'book_florist',
    phase: 'p7',
    title: 'Book florist',
    tip: 'Share inspiration photos and agree on a floral budget.',
    category: 'flowers',
    budgetCategoryId: 'flowers',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=flowers&label=Book%20florist&taskId=book_florist',
    },
  },
  {
    id: 'book_dj_band',
    phase: 'p7',
    title: 'Book DJ or band',
    tip: 'Listen to samples or attend a live show before you commit.',
    category: 'music',
    budgetCategoryId: 'music',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=music&label=Book%20DJ%20or%20band&taskId=book_dj_band',
    },
  },
  {
    id: 'send_save_the_dates',
    phase: 'p7',
    title: 'Send save-the-dates',
    tip: 'Let guests know the date early so they can plan travel.',
    category: 'paper',
    budgetCategoryId: 'paper',
  },
  {
    id: 'buy_wedding_dress',
    phase: 'p7',
    title: 'Buy wedding dress',
    tip: 'Order early because custom gowns can take months to arrive.',
    category: 'attire',
    essential: true,
    budgetCategoryId: 'attire',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=attire&label=Buy%20wedding%20dress&taskId=buy_wedding_dress',
    },
  },
  {
    id: 'book_officiant',
    phase: 'p7',
    title: 'Book officiant',
    tip: 'Find someone who will personalize the ceremony for you.',
    category: 'ceremony',
    essential: true,
    budgetCategoryId: 'other',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=other&label=Book%20officiant&taskId=book_officiant',
    },
  },
  {
    id: 'choose_wedding_party',
    phase: 'p7',
    title: 'Choose wedding party',
    tip: 'Ask your closest friends and family to stand with you.',
    category: 'planning',
  },
  {
    id: 'book_hotel_block',
    phase: 'p7',
    title: 'Book hotel room block',
    tip: 'Reserve a group of rooms for out-of-town guests.',
    category: 'guests',
    budgetCategoryId: 'other',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=other&label=Book%20hotel%20room%20block&taskId=book_hotel_block',
    },
  },
  {
    id: 'plan_honeymoon',
    phase: 'p7',
    title: 'Plan honeymoon',
    tip: 'Decide where to go and start booking flights and hotels.',
    category: 'honeymoon',
  },
  {
    id: 'create_gift_registry',
    phase: 'p7',
    title: 'Create gift registry',
    tip: 'Register for gifts you will actually use and love.',
    category: 'planning',
  },
  {
    id: 'order_wedding_rings',
    phase: 'p7',
    title: 'Order wedding rings',
    tip: 'Have them sized and ordered well before the big day.',
    category: 'rings',
    essential: true,
    budgetCategoryId: 'rings',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=rings&label=Order%20wedding%20rings&taskId=order_wedding_rings',
    },
  },
  {
    id: 'schedule_engagement_photos',
    phase: 'p7',
    title: 'Schedule engagement photos',
    tip: 'Use them for your website, invitations, and save-the-dates.',
    category: 'photo',
    budgetCategoryId: 'photo',
  },
  {
    id: 'book_hair_makeup',
    phase: 'p7',
    title: 'Book hair and makeup artists',
    tip: 'Trial runs help you find the perfect look for the day.',
    category: 'beauty',
    budgetCategoryId: 'other',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=other&label=Book%20hair%20and%20makeup%20artists&taskId=book_hair_makeup',
    },
  },
  {
    id: 'book_ceremony_musicians',
    phase: 'p7',
    title: 'Book ceremony musicians',
    tip: 'Live music adds a special touch to the ceremony.',
    category: 'music',
    budgetCategoryId: 'music',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=music&label=Book%20ceremony%20musicians&taskId=book_ceremony_musicians',
    },
  },

  // p4 — 4-6 months out
  {
    id: 'order_invitations',
    phase: 'p4',
    title: 'Order wedding invitations',
    tip: 'Order them early so you have time to address and mail them.',
    category: 'paper',
    essential: true,
    budgetCategoryId: 'paper',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=paper&label=Order%20wedding%20invitations&taskId=order_invitations',
    },
  },
  {
    id: 'finalize_menu',
    phase: 'p4',
    title: 'Finalize menu with caterer',
    tip: 'Confirm selections, dietary restrictions, and service style.',
    category: 'reception',
  },
  {
    id: 'schedule_cake_tasting',
    phase: 'p4',
    title: 'Schedule cake tasting',
    tip: 'Try a few flavors and designs before you order.',
    category: 'reception',
  },
  {
    id: 'book_rehearsal_dinner',
    phase: 'p4',
    title: 'Book rehearsal dinner venue',
    tip: 'Reserve a spot for the night before the wedding.',
    category: 'reception',
    budgetCategoryId: 'catering',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=catering&label=Book%20rehearsal%20dinner%20venue&taskId=book_rehearsal_dinner',
    },
  },
  {
    id: 'plan_ceremony_details',
    phase: 'p4',
    title: 'Plan ceremony details',
    tip: 'Decide readings, music, and who will do what during the ceremony.',
    category: 'ceremony',
  },
  {
    id: 'order_wedding_cake',
    phase: 'p4',
    title: 'Order wedding cake',
    tip: 'Place the order once you have a final guest count estimate.',
    category: 'reception',
    budgetCategoryId: 'catering',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=catering&label=Order%20wedding%20cake&taskId=order_wedding_cake',
    },
  },
  {
    id: 'buy_wedding_party_gifts',
    phase: 'p4',
    title: 'Buy wedding party gifts',
    tip: 'Thank your bridesmaids and groomsmen with thoughtful gifts.',
    category: 'planning',
    budgetCategoryId: 'other',
    action: {
      label: 'Add cost',
      route: '/expense-edit?categoryId=other&label=Buy%20wedding%20party%20gifts&taskId=buy_wedding_party_gifts',
    },
  },
  {
    id: 'schedule_dress_fittings',
    phase: 'p4',
    title: 'Schedule dress fittings',
    tip: 'Book fittings so the dress fits perfectly by the big day.',
    category: 'attire',
  },
  {
    id: 'plan_day_of_timeline',
    phase: 'p4',
    title: 'Plan day-of timeline',
    tip: 'Outline the schedule from getting ready to last dance.',
    category: 'planning',
  },
  {
    id: 'write_wedding_vows',
    phase: 'p4',
    title: 'Write wedding vows',
    tip: 'Start early so you can refine them and practice aloud.',
    category: 'ceremony',
  },

  // p2 — 2-3 months out
  {
    id: 'apply_marriage_license',
    phase: 'p2',
    title: 'Apply for marriage license',
    tip: 'Do this within the required window before the wedding.',
    category: 'legal',
    essential: true,
    budgetCategoryId: 'other',
  },
  {
    id: 'mail_invitations',
    phase: 'p2',
    title: 'Mail wedding invitations',
    tip: 'Send them 6-8 weeks before the wedding.',
    category: 'paper',
    essential: true,
    budgetCategoryId: 'paper',
    action: { label: 'Open guest list', route: '/guests' },
  },
  {
    id: 'final_dress_fitting',
    phase: 'p2',
    title: 'Final dress fitting',
    tip: 'Make sure the dress is perfect and ready for pickup.',
    category: 'attire',
  },

  // p1 — last month
  {
    id: 'confirm_final_headcount',
    phase: 'p1',
    title: 'Confirm final headcount',
    tip: 'Give your caterer and venue the exact number of guests.',
    category: 'guests',
    essential: true,
    action: { label: 'Open guest list', route: '/guests' },
  },
  {
    id: 'create_seating_chart',
    phase: 'p1',
    title: 'Create seating chart',
    tip: 'Arrange guests at tables to encourage great conversation.',
    category: 'guests',
    action: { label: 'Open guest list', route: '/guests' },
  },
  {
    id: 'pay_final_vendor_balances',
    phase: 'p1',
    title: 'Pay final vendor balances',
    tip: 'Settle all remaining payments before the wedding day.',
    category: 'planning',
    essential: true,
    action: { label: 'See payments', route: '/budget?tab=payments' },
  },
  {
    id: 'pack_emergency_kit',
    phase: 'p1',
    title: 'Pack wedding day emergency kit',
    tip: 'Include safety pins, tissues, mints, and a sewing kit.',
    category: 'planning',
  },
  {
    id: 'pick_up_dress',
    phase: 'p1',
    title: 'Pick up wedding dress',
    tip: 'Bring it home and keep it in a safe, clean place.',
    category: 'attire',
    essential: true,
  },
  {
    id: 'set_up_everly_guest_camera',
    phase: 'p1',
    title: 'Set up the Everly guest camera',
    tip: 'Guests scan a QR and every photo lands in one album.',
    category: 'camera',
    action: { label: 'Create camera event', route: '/(tabs)/create' },
  },
  {
    id: 'relax_and_get_excited',
    phase: 'p1',
    title: 'Relax and get excited',
    tip: 'You have done the work — now enjoy the final days of being engaged.',
    category: 'planning',
  },
  {
    id: 'final_vendor_confirmations',
    phase: 'p1',
    title: 'Final vendor confirmations',
    tip: 'Call or email each vendor to confirm arrival times and final details.',
    category: 'planning',
  },
  {
    id: 'write_toasts_schedule',
    phase: 'p1',
    title: 'Write toasts schedule',
    tip: 'Decide who is speaking and when so the reception flows smoothly.',
    category: 'reception',
  },
  {
    id: 'break_in_shoes',
    phase: 'p1',
    title: 'Break in wedding shoes',
    tip: 'Wear them around the house for a few hours to avoid day-of blisters.',
    category: 'attire',
  },
  {
    id: 'share_guest_camera_qr',
    phase: 'p1',
    title: 'Share guest camera QR',
    tip: 'Include the QR on signs, programs, or a welcome note so guests know where to share.',
    category: 'camera',
    action: { label: 'Open your camera event', route: '/(tabs)' },
  },

  // w2 — last 2 weeks
  {
    id: 'deliver_seating_to_venue',
    phase: 'w2',
    title: 'Deliver seating chart to venue',
    tip: 'Send the final seating and table assignments before the venue prints them.',
    category: 'reception',
  },
  {
    id: 'pack_for_honeymoon',
    phase: 'w2',
    title: 'Pack for honeymoon',
    tip: 'Pack passports, chargers, and outfits so you can leave without stress.',
    category: 'honeymoon',
  },
  {
    id: 'prepare_vendor_tips',
    phase: 'w2',
    title: 'Prepare vendor tips',
    tip: 'Organize cash or thank-you envelopes for each vendor you want to tip.',
    category: 'planning',
  },
  {
    id: 'get_manicure',
    phase: 'w2',
    title: 'Get manicure',
    tip: 'Book a relaxing manicure a day or two before the wedding.',
    category: 'beauty',
  },

  // d0 — wedding day
  {
    id: 'eat_breakfast',
    phase: 'd0',
    title: 'Eat breakfast',
    tip: 'Start the day with a calm, filling breakfast so you have energy.',
    category: 'planning',
  },
  {
    id: 'hand_off_rings',
    phase: 'd0',
    title: 'Hand off rings',
    tip: 'Give the rings to the best man or another trusted person early.',
    category: 'ceremony',
  },
  {
    id: 'remind_guests_camera',
    phase: 'd0',
    title: 'Remind guests about the camera',
    tip: 'Add a welcome note or ask your MC to mention the guest camera.',
    category: 'camera',
  },

  // after — after the wedding
  {
    id: 'download_guest_photos',
    phase: 'after',
    title: 'Download guest photos',
    tip: 'Save all your guest-camera photos before the event link expires.',
    category: 'camera',
    action: { label: 'See your photos', route: '/(tabs)' },
  },
  {
    id: 'send_thank_you_notes',
    phase: 'after',
    title: 'Send thank you notes',
    tip: 'Handwritten notes feel personal, even if they are short.',
    category: 'paper',
    budgetCategoryId: 'paper',
  },
  {
    id: 'review_vendors',
    phase: 'after',
    title: 'Review vendors',
    tip: 'Leave honest reviews to help future couples and thank your vendors.',
    category: 'planning',
  },
  {
    id: 'update_name_documents',
    phase: 'after',
    title: 'Update name documents',
    tip: 'Start with your social security card if you are changing your name.',
    category: 'legal',
  },
  {
    id: 'preserve_dress_bouquet',
    phase: 'after',
    title: 'Preserve dress or bouquet',
    tip: 'Book preservation services quickly while the bouquet is still fresh.',
    category: 'attire',
    budgetCategoryId: 'other',
  },
  {
    id: 'reveal_film_with_guests',
    phase: 'after',
    title: 'Reveal film with guests',
    tip: 'Share a highlight film or invite guests to view the gallery.',
    category: 'camera',
  },
  {
    id: 'share_guest_photos_album',
    phase: 'after',
    title: 'Share guest photos album',
    tip: 'Send the guest photo album to everyone who contributed a photo.',
    category: 'camera',
  },
];

export interface BookedOption {
  id: string;
  label: string;
  taskIds: string[];
}

export const BOOKED_OPTIONS: BookedOption[] = [
  {
    id: 'venue',
    label: 'Venue',
    taskIds: ['book_ceremony_venue', 'book_reception_venue'],
  },
  {
    id: 'photographer',
    label: 'Photographer',
    taskIds: ['book_photographer'],
  },
  {
    id: 'caterer',
    label: 'Caterer',
    taskIds: ['book_caterer'],
  },
  {
    id: 'dress',
    label: 'Dress / attire',
    taskIds: ['buy_wedding_dress'],
  },
  {
    id: 'dj_band',
    label: 'DJ / band',
    taskIds: ['book_dj_band'],
  },
  {
    id: 'florist',
    label: 'Florist',
    taskIds: ['book_florist'],
  },
  {
    id: 'officiant',
    label: 'Officiant',
    taskIds: ['book_officiant'],
  },
  {
    id: 'rings',
    label: 'Rings',
    taskIds: ['order_wedding_rings'],
  },
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseWeddingISO(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function phaseById(id: PhaseId): Phase {
  return PHASES.find((phase) => phase.id === id) ?? PHASES[0];
}

export function phaseDeadline(weddingISO: string, phase: Phase): Date {
  const wedding = parseWeddingISO(weddingISO);
  return new Date(wedding.getTime() - phase.dueDays * 86400000);
}

export function phaseDeadlineLabel(weddingISO: string, phase: Phase): string {
  const deadline = phaseDeadline(weddingISO, phase);
  const wedding = parseWeddingISO(weddingISO);
  const month = SHORT_MONTHS[deadline.getMonth()];
  const day = deadline.getDate();
  const year = deadline.getFullYear();

  if (phase.deadlineStyle === 'after') {
    return `After ${SHORT_MONTHS[wedding.getMonth()]} ${wedding.getDate()}`;
  }

  if (phase.deadlineStyle === 'month') {
    return `By ${month} ${year}`;
  }

  if (phase.id === 'd0') {
    return `On ${SHORT_MONTHS[wedding.getMonth()]} ${wedding.getDate()}`;
  }

  return `By ${month} ${day}`;
}
