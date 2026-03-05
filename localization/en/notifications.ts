export default {
  // Permission messages
  permission_required: 'Notification permissions are required to set reminders',
  permission_failed: 'Failed to request notification permissions',
  
  // Success messages
  reminders_set: 'Daily reminders have been set',
  notifications_canceled: 'All notifications have been canceled',
  
  // Error messages
  schedule_failed: 'Failed to schedule notifications',
  cancel_failed: 'Failed to cancel notifications',
  
  // Notification prompt
  enable_title: 'Stay on top of your studies',
  enable_description: 'Enable notifications to get daily reminders and never miss your study sessions.',
  enable_button: 'Enable Notifications',
  
  // Morning notification variants (Gen Z style)
  morning: {
    title: [
      'Rise and grind! ☀️',
      'Morning bestie! ☀️',
      'It\'s giving productive vibes ☀️',
      'Main character energy loading... ☀️',
      'Time to slay the day! ☀️',
      'Wakey wakey, no cap! ☀️'
    ],
    body: [
      'Your notes aren\'t going to review themselves. No cap.',
      'Literally obsessed with how you\'re about to crush these notes.',
      'It\'s time to be that girl/guy who actually reviews their notes.',
      'Your future self is thanking you for the brain gains rn.',
      'Procrastination? We don\'t know her. Time to study!',
      'This is your sign to stop scrolling and start studying.'
    ]
  },
  
  // Evening notification variants (Gen Z style)
  evening: {
    title: [
      'Evening check-in 🌙',
      'Vibe check time 🌙',
      'It\'s the final brain cell for me 🌙',
      'Living rent free in your notifications 🌙',
      'Bestie, it\'s review o\'clock 🌙',
      'The day ate and left no crumbs 🌙'
    ],
    body: [
      'Time to review what you learned today. It\'s giving responsible student.',
      'Your notes miss you fr fr. Give them some attention.',
      'Speedrun your review and then you can go back to TikTok, bestie.',
      'Manifest those A\'s by reviewing what you learned today.',
      'This review session? About to be bussin\'.',
      'Your future self will be so slay if you review now.'
    ]
  },
  
  // Study streak notifications
  streak: {
    title: [
      'Streak check! 🔥',
      'You\'re on fire! 🔥',
      'Combo multiplier activated! 🔥'
    ],
    body: [
      'Day {{days}} of your study streak! No one\'s doing it like you.',
      '{{days}} day streak? We stan a consistent legend!',
      'You\'ve studied for {{days}} days straight. That\'s lowkey impressive.'
    ]
  }
};