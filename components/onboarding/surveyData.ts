import { t } from 'i18next';

export const surveyData = [
  {
    id: 'welcome',
    type: 'welcome',
    title: t('onboarding:welcome_title'),
    description: t('onboarding:welcome_description'),
    image: 'https://images.pexels.com/photos/4145197/pexels-photo-4145197.jpeg',
  },
  {
    id: 'notifications',
    type: 'notification-permission',
    title: t('onboarding:notifications_title'),
    description: t('onboarding:notifications_description'),
    benefits: [
      { text: t('onboarding:notifications_benefit_reminders'), icon: '⏰' },
      { text: t('onboarding:notifications_benefit_progress'), icon: '📈' },
      { text: t('onboarding:notifications_benefit_motivation'), icon: '💪' },
    ],
  },
  {
    id: 'study-experience',
    type: 'multiple-choice',
    question: t('onboarding:study_experience_question'),
    options: [
      { id: 'beginner', text: t('onboarding:study_experience_beginner'), icon: '📘' },
      { id: 'intermediate', text: t('onboarding:study_experience_intermediate'), icon: '📚' },
      { id: 'advanced', text: t('onboarding:study_experience_advanced'), icon: '🧠' },
    ],
  },
  {
    id: 'study-methods',
    type: 'multiple-select',
    question: t('onboarding:study_methods_question'),
    description: t('onboarding:study_methods_description'),
    options: [
      { id: 'notes', text: t('onboarding:study_methods_notes'), icon: '📝' },
      { id: 'flashcards', text: t('onboarding:study_methods_flashcards'), icon: '🃏' },
      { id: 'videos', text: t('onboarding:study_methods_videos'), icon: '🎥' },
      { id: 'quizzes', text: t('onboarding:study_methods_quizzes'), icon: '❓' },
      { id: 'summaries', text: t('onboarding:study_methods_summaries'), icon: '📄' },
    ],
  },
  {
    id: 'goals',
    type: 'multiple-choice',
    question: t('onboarding:goals_question'),
    options: [
      { id: 'improve-grades', text: t('onboarding:goals_improve_grades'), icon: '🏆' },
      { id: 'stay-organized', text: t('onboarding:goals_stay_organized'), icon: '📂' },
      { id: 'retain-better', text: t('onboarding:goals_retain_better'), icon: '🧠' },
      { id: 'study-smarter', text: t('onboarding:goals_study_smarter'), icon: '⚡' },
    ],
  },
  {
    id: 'study-frequency',
    type: 'multiple-choice',
    question: t('onboarding:study_frequency_question'),
    options: [
      { id: 'daily', text: t('onboarding:study_frequency_daily'), icon: '📆' },
      { id: 'few-weekly', text: t('onboarding:study_frequency_few_weekly'), icon: '🗓️' },
      { id: 'weekly', text: t('onboarding:study_frequency_weekly'), icon: '⏰' },
      { id: 'rarely', text: t('onboarding:study_frequency_rarely'), icon: '📉' },
    ],
  },
  {
    id: 'premium-features',
    type: 'features',
    title: t('onboarding:premium_title'),
    description: t('onboarding:premium_description'),
    features: [
      { text: t('onboarding:premium_ai_summaries'), icon: '🤖' },
      { text: t('onboarding:premium_topic_segmentation'), icon: '🧩' },
      { text: t('onboarding:premium_gamified_progress'), icon: '🎮' },
      { text: t('onboarding:premium_smart_flashcards'), icon: '🃏' },
      { text: t('onboarding:premium_cross_device_sync'), icon: '☁️' },
    ],
  },
];
