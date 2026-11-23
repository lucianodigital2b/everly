import { t } from '../i18n';

export type PhaseId = 'p12' | 'p7' | 'p4' | 'p2' | 'p1' | 'w2' | 'd0' | 'after';

export interface Phase {
  id: PhaseId;
  title: string;
  subtitle: string;
  dueDays: number;
  deadlineStyle: 'month' | 'day' | 'after';
}

export const PHASES: Phase[] = [
  { id: 'p12', title: t('weddingPlan.phases.p12.title'), subtitle: t('weddingPlan.phases.p12.subtitle'), dueDays: 300, deadlineStyle: 'month' },
  { id: 'p7', title: t('weddingPlan.phases.p7.title'), subtitle: t('weddingPlan.phases.p7.subtitle'), dueDays: 210, deadlineStyle: 'month' },
  { id: 'p4', title: t('weddingPlan.phases.p4.title'), subtitle: t('weddingPlan.phases.p4.subtitle'), dueDays: 120, deadlineStyle: 'month' },
  { id: 'p2', title: t('weddingPlan.phases.p2.title'), subtitle: t('weddingPlan.phases.p2.subtitle'), dueDays: 60, deadlineStyle: 'month' },
  { id: 'p1', title: t('weddingPlan.phases.p1.title'), subtitle: t('weddingPlan.phases.p1.subtitle'), dueDays: 14, deadlineStyle: 'day' },
  { id: 'w2', title: t('weddingPlan.phases.w2.title'), subtitle: t('weddingPlan.phases.w2.subtitle'), dueDays: 1, deadlineStyle: 'day' },
  { id: 'd0', title: t('weddingPlan.phases.d0.title'), subtitle: t('weddingPlan.phases.d0.subtitle'), dueDays: 0, deadlineStyle: 'day' },
  { id: 'after', title: t('weddingPlan.phases.after.title'), subtitle: t('weddingPlan.phases.after.subtitle'), dueDays: -60, deadlineStyle: 'after' },
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
  planning: t('weddingPlan.categories.planning'),
  ceremony: t('weddingPlan.categories.ceremony'),
  reception: t('weddingPlan.categories.reception'),
  photo: t('weddingPlan.categories.photo'),
  music: t('weddingPlan.categories.music'),
  attire: t('weddingPlan.categories.attire'),
  beauty: t('weddingPlan.categories.beauty'),
  flowers: t('weddingPlan.categories.flowers'),
  paper: t('weddingPlan.categories.paper'),
  legal: t('weddingPlan.categories.legal'),
  rings: t('weddingPlan.categories.rings'),
  honeymoon: t('weddingPlan.categories.honeymoon'),
  guests: t('weddingPlan.categories.guests'),
  camera: t('weddingPlan.categories.camera'),
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
    title: t('weddingPlan.tasks.set_budget.title'),
    tip: t('weddingPlan.tasks.set_budget.tip'),
    category: 'planning',
    essential: true,
    action: { label: t('weddingPlan.tasks.set_budget.actionLabel'), route: '/budget' },
  },
  {
    id: 'draft_guest_list',
    phase: 'p12',
    title: t('weddingPlan.tasks.draft_guest_list.title'),
    tip: t('weddingPlan.tasks.draft_guest_list.tip'),
    category: 'guests',
    essential: true,
    action: { label: t('weddingPlan.tasks.draft_guest_list.actionLabel'), route: '/guests' },
  },
  {
    id: 'choose_wedding_date',
    phase: 'p12',
    title: t('weddingPlan.tasks.choose_wedding_date.title'),
    tip: t('weddingPlan.tasks.choose_wedding_date.tip'),
    category: 'planning',
  },
  {
    id: 'book_ceremony_venue',
    phase: 'p12',
    title: t('weddingPlan.tasks.book_ceremony_venue.title'),
    tip: t('weddingPlan.tasks.book_ceremony_venue.tip'),
    category: 'ceremony',
    essential: true,
    budgetCategoryId: 'venue',
    action: {
      label: t('weddingPlan.tasks.book_ceremony_venue.actionLabel'),
      route: '/expense-edit?categoryId=venue&label=Book%20ceremony%20venue&taskId=book_ceremony_venue',
    },
  },
  {
    id: 'book_reception_venue',
    phase: 'p12',
    title: t('weddingPlan.tasks.book_reception_venue.title'),
    tip: t('weddingPlan.tasks.book_reception_venue.tip'),
    category: 'reception',
    essential: true,
    budgetCategoryId: 'venue',
    action: {
      label: t('weddingPlan.tasks.book_reception_venue.actionLabel'),
      route: '/expense-edit?categoryId=venue&label=Book%20reception%20venue&taskId=book_reception_venue',
    },
  },
  {
    id: 'hire_planner',
    phase: 'p12',
    title: t('weddingPlan.tasks.hire_planner.title'),
    tip: t('weddingPlan.tasks.hire_planner.tip'),
    category: 'planning',
    budgetCategoryId: 'other',
  },
  {
    id: 'book_photographer',
    phase: 'p12',
    title: t('weddingPlan.tasks.book_photographer.title'),
    tip: t('weddingPlan.tasks.book_photographer.tip'),
    category: 'photo',
    essential: true,
    budgetCategoryId: 'photo',
    action: {
      label: t('weddingPlan.tasks.book_photographer.actionLabel'),
      route: '/expense-edit?categoryId=photo&label=Book%20photographer&taskId=book_photographer',
    },
  },
  {
    id: 'book_videographer',
    phase: 'p12',
    title: t('weddingPlan.tasks.book_videographer.title'),
    tip: t('weddingPlan.tasks.book_videographer.tip'),
    category: 'photo',
    budgetCategoryId: 'photo',
    action: {
      label: t('weddingPlan.tasks.book_videographer.actionLabel'),
      route: '/expense-edit?categoryId=photo&label=Book%20videographer&taskId=book_videographer',
    },
  },
  {
    id: 'book_caterer',
    phase: 'p12',
    title: t('weddingPlan.tasks.book_caterer.title'),
    tip: t('weddingPlan.tasks.book_caterer.tip'),
    category: 'reception',
    essential: true,
    budgetCategoryId: 'catering',
    action: {
      label: t('weddingPlan.tasks.book_caterer.actionLabel'),
      route: '/expense-edit?categoryId=catering&label=Book%20caterer&taskId=book_caterer',
    },
  },
  {
    id: 'start_wedding_website',
    phase: 'p12',
    title: t('weddingPlan.tasks.start_wedding_website.title'),
    tip: t('weddingPlan.tasks.start_wedding_website.tip'),
    category: 'planning',
    budgetCategoryId: 'other',
  },
  {
    id: 'research_marriage_license',
    phase: 'p12',
    title: t('weddingPlan.tasks.research_marriage_license.title'),
    tip: t('weddingPlan.tasks.research_marriage_license.tip'),
    category: 'legal',
  },

  // p7 — 7-9 months out
  {
    id: 'book_florist',
    phase: 'p7',
    title: t('weddingPlan.tasks.book_florist.title'),
    tip: t('weddingPlan.tasks.book_florist.tip'),
    category: 'flowers',
    budgetCategoryId: 'flowers',
    action: {
      label: t('weddingPlan.tasks.book_florist.actionLabel'),
      route: '/expense-edit?categoryId=flowers&label=Book%20florist&taskId=book_florist',
    },
  },
  {
    id: 'book_dj_band',
    phase: 'p7',
    title: t('weddingPlan.tasks.book_dj_band.title'),
    tip: t('weddingPlan.tasks.book_dj_band.tip'),
    category: 'music',
    budgetCategoryId: 'music',
    action: {
      label: t('weddingPlan.tasks.book_dj_band.actionLabel'),
      route: '/expense-edit?categoryId=music&label=Book%20DJ%20or%20band&taskId=book_dj_band',
    },
  },
  {
    id: 'send_save_the_dates',
    phase: 'p7',
    title: t('weddingPlan.tasks.send_save_the_dates.title'),
    tip: t('weddingPlan.tasks.send_save_the_dates.tip'),
    category: 'paper',
    budgetCategoryId: 'paper',
  },
  {
    id: 'buy_wedding_dress',
    phase: 'p7',
    title: t('weddingPlan.tasks.buy_wedding_dress.title'),
    tip: t('weddingPlan.tasks.buy_wedding_dress.tip'),
    category: 'attire',
    essential: true,
    budgetCategoryId: 'attire',
    action: {
      label: t('weddingPlan.tasks.buy_wedding_dress.actionLabel'),
      route: '/expense-edit?categoryId=attire&label=Buy%20wedding%20dress&taskId=buy_wedding_dress',
    },
  },
  {
    id: 'book_officiant',
    phase: 'p7',
    title: t('weddingPlan.tasks.book_officiant.title'),
    tip: t('weddingPlan.tasks.book_officiant.tip'),
    category: 'ceremony',
    essential: true,
    budgetCategoryId: 'other',
    action: {
      label: t('weddingPlan.tasks.book_officiant.actionLabel'),
      route: '/expense-edit?categoryId=other&label=Book%20officiant&taskId=book_officiant',
    },
  },
  {
    id: 'choose_wedding_party',
    phase: 'p7',
    title: t('weddingPlan.tasks.choose_wedding_party.title'),
    tip: t('weddingPlan.tasks.choose_wedding_party.tip'),
    category: 'planning',
  },
  {
    id: 'book_hotel_block',
    phase: 'p7',
    title: t('weddingPlan.tasks.book_hotel_block.title'),
    tip: t('weddingPlan.tasks.book_hotel_block.tip'),
    category: 'guests',
    budgetCategoryId: 'other',
    action: {
      label: t('weddingPlan.tasks.book_hotel_block.actionLabel'),
      route: '/expense-edit?categoryId=other&label=Book%20hotel%20room%20block&taskId=book_hotel_block',
    },
  },
  {
    id: 'plan_honeymoon',
    phase: 'p7',
    title: t('weddingPlan.tasks.plan_honeymoon.title'),
    tip: t('weddingPlan.tasks.plan_honeymoon.tip'),
    category: 'honeymoon',
  },
  {
    id: 'create_gift_registry',
    phase: 'p7',
    title: t('weddingPlan.tasks.create_gift_registry.title'),
    tip: t('weddingPlan.tasks.create_gift_registry.tip'),
    category: 'planning',
  },
  {
    id: 'order_wedding_rings',
    phase: 'p7',
    title: t('weddingPlan.tasks.order_wedding_rings.title'),
    tip: t('weddingPlan.tasks.order_wedding_rings.tip'),
    category: 'rings',
    essential: true,
    budgetCategoryId: 'rings',
    action: {
      label: t('weddingPlan.tasks.order_wedding_rings.actionLabel'),
      route: '/expense-edit?categoryId=rings&label=Order%20wedding%20rings&taskId=order_wedding_rings',
    },
  },
  {
    id: 'schedule_engagement_photos',
    phase: 'p7',
    title: t('weddingPlan.tasks.schedule_engagement_photos.title'),
    tip: t('weddingPlan.tasks.schedule_engagement_photos.tip'),
    category: 'photo',
    budgetCategoryId: 'photo',
  },
  {
    id: 'book_hair_makeup',
    phase: 'p7',
    title: t('weddingPlan.tasks.book_hair_makeup.title'),
    tip: t('weddingPlan.tasks.book_hair_makeup.tip'),
    category: 'beauty',
    budgetCategoryId: 'other',
    action: {
      label: t('weddingPlan.tasks.book_hair_makeup.actionLabel'),
      route: '/expense-edit?categoryId=other&label=Book%20hair%20and%20makeup%20artists&taskId=book_hair_makeup',
    },
  },
  {
    id: 'book_ceremony_musicians',
    phase: 'p7',
    title: t('weddingPlan.tasks.book_ceremony_musicians.title'),
    tip: t('weddingPlan.tasks.book_ceremony_musicians.tip'),
    category: 'music',
    budgetCategoryId: 'music',
    action: {
      label: t('weddingPlan.tasks.book_ceremony_musicians.actionLabel'),
      route: '/expense-edit?categoryId=music&label=Book%20ceremony%20musicians&taskId=book_ceremony_musicians',
    },
  },

  // p4 — 4-6 months out
  {
    id: 'order_invitations',
    phase: 'p4',
    title: t('weddingPlan.tasks.order_invitations.title'),
    tip: t('weddingPlan.tasks.order_invitations.tip'),
    category: 'paper',
    essential: true,
    budgetCategoryId: 'paper',
    action: {
      label: t('weddingPlan.tasks.order_invitations.actionLabel'),
      route: '/expense-edit?categoryId=paper&label=Order%20wedding%20invitations&taskId=order_invitations',
    },
  },
  {
    id: 'finalize_menu',
    phase: 'p4',
    title: t('weddingPlan.tasks.finalize_menu.title'),
    tip: t('weddingPlan.tasks.finalize_menu.tip'),
    category: 'reception',
  },
  {
    id: 'schedule_cake_tasting',
    phase: 'p4',
    title: t('weddingPlan.tasks.schedule_cake_tasting.title'),
    tip: t('weddingPlan.tasks.schedule_cake_tasting.tip'),
    category: 'reception',
  },
  {
    id: 'book_rehearsal_dinner',
    phase: 'p4',
    title: t('weddingPlan.tasks.book_rehearsal_dinner.title'),
    tip: t('weddingPlan.tasks.book_rehearsal_dinner.tip'),
    category: 'reception',
    budgetCategoryId: 'catering',
    action: {
      label: t('weddingPlan.tasks.book_rehearsal_dinner.actionLabel'),
      route: '/expense-edit?categoryId=catering&label=Book%20rehearsal%20dinner%20venue&taskId=book_rehearsal_dinner',
    },
  },
  {
    id: 'plan_ceremony_details',
    phase: 'p4',
    title: t('weddingPlan.tasks.plan_ceremony_details.title'),
    tip: t('weddingPlan.tasks.plan_ceremony_details.tip'),
    category: 'ceremony',
  },
  {
    id: 'order_wedding_cake',
    phase: 'p4',
    title: t('weddingPlan.tasks.order_wedding_cake.title'),
    tip: t('weddingPlan.tasks.order_wedding_cake.tip'),
    category: 'reception',
    budgetCategoryId: 'catering',
    action: {
      label: t('weddingPlan.tasks.order_wedding_cake.actionLabel'),
      route: '/expense-edit?categoryId=catering&label=Order%20wedding%20cake&taskId=order_wedding_cake',
    },
  },
  {
    id: 'buy_wedding_party_gifts',
    phase: 'p4',
    title: t('weddingPlan.tasks.buy_wedding_party_gifts.title'),
    tip: t('weddingPlan.tasks.buy_wedding_party_gifts.tip'),
    category: 'planning',
    budgetCategoryId: 'other',
    action: {
      label: t('weddingPlan.tasks.buy_wedding_party_gifts.actionLabel'),
      route: '/expense-edit?categoryId=other&label=Buy%20wedding%20party%20gifts&taskId=buy_wedding_party_gifts',
    },
  },
  {
    id: 'schedule_dress_fittings',
    phase: 'p4',
    title: t('weddingPlan.tasks.schedule_dress_fittings.title'),
    tip: t('weddingPlan.tasks.schedule_dress_fittings.tip'),
    category: 'attire',
  },
  {
    id: 'plan_day_of_timeline',
    phase: 'p4',
    title: t('weddingPlan.tasks.plan_day_of_timeline.title'),
    tip: t('weddingPlan.tasks.plan_day_of_timeline.tip'),
    category: 'planning',
  },
  {
    id: 'write_wedding_vows',
    phase: 'p4',
    title: t('weddingPlan.tasks.write_wedding_vows.title'),
    tip: t('weddingPlan.tasks.write_wedding_vows.tip'),
    category: 'ceremony',
  },

  // p2 — 2-3 months out
  {
    id: 'apply_marriage_license',
    phase: 'p2',
    title: t('weddingPlan.tasks.apply_marriage_license.title'),
    tip: t('weddingPlan.tasks.apply_marriage_license.tip'),
    category: 'legal',
    essential: true,
    budgetCategoryId: 'other',
  },
  {
    id: 'mail_invitations',
    phase: 'p2',
    title: t('weddingPlan.tasks.mail_invitations.title'),
    tip: t('weddingPlan.tasks.mail_invitations.tip'),
    category: 'paper',
    essential: true,
    budgetCategoryId: 'paper',
    action: { label: t('weddingPlan.tasks.mail_invitations.actionLabel'), route: '/guests' },
  },
  {
    id: 'final_dress_fitting',
    phase: 'p2',
    title: t('weddingPlan.tasks.final_dress_fitting.title'),
    tip: t('weddingPlan.tasks.final_dress_fitting.tip'),
    category: 'attire',
  },

  // p1 — last month
  {
    id: 'confirm_final_headcount',
    phase: 'p1',
    title: t('weddingPlan.tasks.confirm_final_headcount.title'),
    tip: t('weddingPlan.tasks.confirm_final_headcount.tip'),
    category: 'guests',
    essential: true,
    action: { label: t('weddingPlan.tasks.confirm_final_headcount.actionLabel'), route: '/guests' },
  },
  {
    id: 'create_seating_chart',
    phase: 'p1',
    title: t('weddingPlan.tasks.create_seating_chart.title'),
    tip: t('weddingPlan.tasks.create_seating_chart.tip'),
    category: 'guests',
    action: { label: t('weddingPlan.tasks.create_seating_chart.actionLabel'), route: '/guests' },
  },
  {
    id: 'pay_final_vendor_balances',
    phase: 'p1',
    title: t('weddingPlan.tasks.pay_final_vendor_balances.title'),
    tip: t('weddingPlan.tasks.pay_final_vendor_balances.tip'),
    category: 'planning',
    essential: true,
    action: { label: t('weddingPlan.tasks.pay_final_vendor_balances.actionLabel'), route: '/budget?tab=payments' },
  },
  {
    id: 'pack_emergency_kit',
    phase: 'p1',
    title: t('weddingPlan.tasks.pack_emergency_kit.title'),
    tip: t('weddingPlan.tasks.pack_emergency_kit.tip'),
    category: 'planning',
  },
  {
    id: 'pick_up_dress',
    phase: 'p1',
    title: t('weddingPlan.tasks.pick_up_dress.title'),
    tip: t('weddingPlan.tasks.pick_up_dress.tip'),
    category: 'attire',
    essential: true,
  },
  {
    id: 'set_up_everly_guest_camera',
    phase: 'p1',
    title: t('weddingPlan.tasks.set_up_everly_guest_camera.title'),
    tip: t('weddingPlan.tasks.set_up_everly_guest_camera.tip'),
    category: 'camera',
    action: { label: t('weddingPlan.tasks.set_up_everly_guest_camera.actionLabel'), route: '/(tabs)/create' },
  },
  {
    id: 'relax_and_get_excited',
    phase: 'p1',
    title: t('weddingPlan.tasks.relax_and_get_excited.title'),
    tip: t('weddingPlan.tasks.relax_and_get_excited.tip'),
    category: 'planning',
  },
  {
    id: 'final_vendor_confirmations',
    phase: 'p1',
    title: t('weddingPlan.tasks.final_vendor_confirmations.title'),
    tip: t('weddingPlan.tasks.final_vendor_confirmations.tip'),
    category: 'planning',
  },
  {
    id: 'write_toasts_schedule',
    phase: 'p1',
    title: t('weddingPlan.tasks.write_toasts_schedule.title'),
    tip: t('weddingPlan.tasks.write_toasts_schedule.tip'),
    category: 'reception',
  },
  {
    id: 'break_in_shoes',
    phase: 'p1',
    title: t('weddingPlan.tasks.break_in_shoes.title'),
    tip: t('weddingPlan.tasks.break_in_shoes.tip'),
    category: 'attire',
  },
  {
    id: 'share_guest_camera_qr',
    phase: 'p1',
    title: t('weddingPlan.tasks.share_guest_camera_qr.title'),
    tip: t('weddingPlan.tasks.share_guest_camera_qr.tip'),
    category: 'camera',
    action: { label: t('weddingPlan.tasks.share_guest_camera_qr.actionLabel'), route: '/(tabs)' },
  },

  // w2 — last 2 weeks
  {
    id: 'deliver_seating_to_venue',
    phase: 'w2',
    title: t('weddingPlan.tasks.deliver_seating_to_venue.title'),
    tip: t('weddingPlan.tasks.deliver_seating_to_venue.tip'),
    category: 'reception',
  },
  {
    id: 'pack_for_honeymoon',
    phase: 'w2',
    title: t('weddingPlan.tasks.pack_for_honeymoon.title'),
    tip: t('weddingPlan.tasks.pack_for_honeymoon.tip'),
    category: 'honeymoon',
  },
  {
    id: 'prepare_vendor_tips',
    phase: 'w2',
    title: t('weddingPlan.tasks.prepare_vendor_tips.title'),
    tip: t('weddingPlan.tasks.prepare_vendor_tips.tip'),
    category: 'planning',
  },
  {
    id: 'get_manicure',
    phase: 'w2',
    title: t('weddingPlan.tasks.get_manicure.title'),
    tip: t('weddingPlan.tasks.get_manicure.tip'),
    category: 'beauty',
  },

  // d0 — wedding day
  {
    id: 'eat_breakfast',
    phase: 'd0',
    title: t('weddingPlan.tasks.eat_breakfast.title'),
    tip: t('weddingPlan.tasks.eat_breakfast.tip'),
    category: 'planning',
  },
  {
    id: 'hand_off_rings',
    phase: 'd0',
    title: t('weddingPlan.tasks.hand_off_rings.title'),
    tip: t('weddingPlan.tasks.hand_off_rings.tip'),
    category: 'ceremony',
  },
  {
    id: 'remind_guests_camera',
    phase: 'd0',
    title: t('weddingPlan.tasks.remind_guests_camera.title'),
    tip: t('weddingPlan.tasks.remind_guests_camera.tip'),
    category: 'camera',
  },

  // after — after the wedding
  {
    id: 'download_guest_photos',
    phase: 'after',
    title: t('weddingPlan.tasks.download_guest_photos.title'),
    tip: t('weddingPlan.tasks.download_guest_photos.tip'),
    category: 'camera',
    action: { label: t('weddingPlan.tasks.download_guest_photos.actionLabel'), route: '/(tabs)' },
  },
  {
    id: 'send_thank_you_notes',
    phase: 'after',
    title: t('weddingPlan.tasks.send_thank_you_notes.title'),
    tip: t('weddingPlan.tasks.send_thank_you_notes.tip'),
    category: 'paper',
    budgetCategoryId: 'paper',
  },
  {
    id: 'review_vendors',
    phase: 'after',
    title: t('weddingPlan.tasks.review_vendors.title'),
    tip: t('weddingPlan.tasks.review_vendors.tip'),
    category: 'planning',
  },
  {
    id: 'update_name_documents',
    phase: 'after',
    title: t('weddingPlan.tasks.update_name_documents.title'),
    tip: t('weddingPlan.tasks.update_name_documents.tip'),
    category: 'legal',
  },
  {
    id: 'preserve_dress_bouquet',
    phase: 'after',
    title: t('weddingPlan.tasks.preserve_dress_bouquet.title'),
    tip: t('weddingPlan.tasks.preserve_dress_bouquet.tip'),
    category: 'attire',
    budgetCategoryId: 'other',
  },
  {
    id: 'reveal_film_with_guests',
    phase: 'after',
    title: t('weddingPlan.tasks.reveal_film_with_guests.title'),
    tip: t('weddingPlan.tasks.reveal_film_with_guests.tip'),
    category: 'camera',
  },
  {
    id: 'share_guest_photos_album',
    phase: 'after',
    title: t('weddingPlan.tasks.share_guest_photos_album.title'),
    tip: t('weddingPlan.tasks.share_guest_photos_album.tip'),
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
    label: t('weddingPlan.bookedOptions.venue.label'),
    taskIds: ['book_ceremony_venue', 'book_reception_venue'],
  },
  {
    id: 'photographer',
    label: t('weddingPlan.bookedOptions.photographer.label'),
    taskIds: ['book_photographer'],
  },
  {
    id: 'caterer',
    label: t('weddingPlan.bookedOptions.caterer.label'),
    taskIds: ['book_caterer'],
  },
  {
    id: 'dress',
    label: t('weddingPlan.bookedOptions.dress.label'),
    taskIds: ['buy_wedding_dress'],
  },
  {
    id: 'dj_band',
    label: t('weddingPlan.bookedOptions.dj_band.label'),
    taskIds: ['book_dj_band'],
  },
  {
    id: 'florist',
    label: t('weddingPlan.bookedOptions.florist.label'),
    taskIds: ['book_florist'],
  },
  {
    id: 'officiant',
    label: t('weddingPlan.bookedOptions.officiant.label'),
    taskIds: ['book_officiant'],
  },
  {
    id: 'rings',
    label: t('weddingPlan.bookedOptions.rings.label'),
    taskIds: ['order_wedding_rings'],
  },
];

const SHORT_MONTHS = [
  t('weddingPlan.months.jan'),
  t('weddingPlan.months.feb'),
  t('weddingPlan.months.mar'),
  t('weddingPlan.months.apr'),
  t('weddingPlan.months.may'),
  t('weddingPlan.months.jun'),
  t('weddingPlan.months.jul'),
  t('weddingPlan.months.aug'),
  t('weddingPlan.months.sep'),
  t('weddingPlan.months.oct'),
  t('weddingPlan.months.nov'),
  t('weddingPlan.months.dec'),
];

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
    return t('weddingPlan.deadline.after', { month: SHORT_MONTHS[wedding.getMonth()], day: wedding.getDate() });
  }

  if (phase.deadlineStyle === 'month') {
    return t('weddingPlan.deadline.byMonthYear', { month, year });
  }

  if (phase.id === 'd0') {
    return t('weddingPlan.deadline.on', { month: SHORT_MONTHS[wedding.getMonth()], day: wedding.getDate() });
  }

  return t('weddingPlan.deadline.byMonthDay', { month, day });
}
