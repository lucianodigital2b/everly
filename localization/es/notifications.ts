export default {
  // Permission messages
  permission_required: 'Se requieren permisos de notificación para establecer recordatorios',
  permission_failed: 'No se pudieron solicitar permisos de notificación',
  
  // Success messages
  reminders_set: 'Se han establecido recordatorios diarios',
  notifications_canceled: 'Todas las notificaciones han sido canceladas',
  
  // Error messages
  schedule_failed: 'No se pudieron programar las notificaciones',
  cancel_failed: 'No se pudieron cancelar las notificaciones',
  
  // Notification prompt
  enable_title: 'Mantente al día con tus estudios',
  enable_description: 'Activa las notificaciones para recibir recordatorios diarios y no perderte tus sesiones de estudio.',
  enable_button: 'Activar Notificaciones',
  
  // Morning notification variants (Spanish Gen Z style)
  morning: {
    title: [
      '¡A por el día! ☀️',
      '¡Buenos días, crack! ☀️',
      'Modo productivo: ON ☀️',
      'Cargando energía de protagonista... ☀️',
      '¡Hora de comerse el mundo! ☀️',
      '¡Arriba, que no es broma! ☀️'
    ],
    body: [
      'Tus apuntes no se van a repasar solos. En serio.',
      'Me flipa cómo vas a arrasar con estos apuntes hoy.',
      'Es hora de ser ese/a que de verdad repasa sus apuntes.',
      'Tu yo del futuro te lo agradecerá en los exámenes.',
      '¿Procrastinar? Ni de coña. ¡A estudiar!',
      'Esta es tu señal para dejar de mirar el móvil y ponerte a estudiar.'
    ]
  },
  
  // Evening notification variants (Spanish Gen Z style)
  evening: {
    title: [
      'Chequeo nocturno 🌙',
      'Hora del control de vibra 🌙',
      'Mi última neurona haciendo horas extra 🌙',
      'Viviendo en tus notificaciones sin pagar alquiler 🌙',
      'Colega, es hora de repasar 🌙',
      'El día ha sido top 🌙'
    ],
    body: [
      'Momento de repasar lo que has aprendido hoy. Muy responsable, tú.',
      'Tus apuntes te echan de menos. Dales un poco de atención.',
      'Repasa rápido y luego puedes volver a TikTok, colega.',
      'Visualiza esos sobresalientes repasando lo que has aprendido hoy.',
      'Esta sesión de repaso va a ser la leche.',
      'Tu yo del futuro te lo agradecerá si repasas ahora.'
    ]
  },
  
  // Study streak notifications (Spanish Gen Z style)
  streak: {
    title: [
      '¡Racha en marcha! 🔥',
      '¡Estás que lo petas! 🔥',
      '¡Multiplicador de combo activado! 🔥'
    ],
    body: [
      'Día {{days}} de tu racha de estudio. Nadie lo hace como tú.',
      '¿{{days}} días de racha? Eres toda una leyenda de la constancia.',
      'Has estudiado {{days}} días seguidos. Eso es bastante impresionante.'
    ]
  }
};