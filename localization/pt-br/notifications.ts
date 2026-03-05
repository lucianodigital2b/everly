export default {
  // Permission messages
  permission_required: 'Permissões de notificação são necessárias para definir lembretes',
  permission_failed: 'Falha ao solicitar permissões de notificação',
  
  // Success messages
  reminders_set: 'Lembretes diários foram definidos',
  notifications_canceled: 'Todas as notificações foram canceladas',
  
  // Error messages
  schedule_failed: 'Falha ao agendar notificações',
  cancel_failed: 'Falha ao cancelar notificações',
  
  // Notification prompt
  enable_title: 'Fique por dentro dos seus estudos',
  enable_description: 'Ative as notificações para receber lembretes diários e não perder suas sessões de estudo.',
  enable_button: 'Ativar Notificações',
  
  // Morning notification variants (Brazilian Gen Z style)
  morning: {
    title: [
      'Bora acordar! ☀️',
      'Bom dia, migo(a)! ☀️',
      'Tá na hora de arrasar ☀️',
      'Modo protagonista ativado... ☀️',
      'Hora de lacrar o dia! ☀️',
      'Acorda, não é trolagem! ☀️'
    ],
    body: [
      'Suas anotações não vão se revisar sozinhas. Confia.',
      'Tô chocado(a) com o tanto que você vai arrasar nesses estudos.',
      'Tá na hora de ser aquela pessoa que realmente revisa as anotações.',
      'Seu eu do futuro tá agradecendo pelos neurônios que você vai ganhar agora.',
      'Procrastinação? Não conheço. Bora estudar!',
      'Este é seu sinal pra parar de rolar o feed e começar a estudar.'
    ]
  },
  
  // Evening notification variants (Brazilian Gen Z style)
  evening: {
    title: [
      'Vamo conferir a noite 🌙',
      'Hora do vibe check 🌙',
      'Meu último neurônio fazendo hora extra 🌙',
      'Morando de graça nas suas notificações 🌙',
      'Migo(a), hora da revisão 🌙',
      'O dia foi top demais 🌙'
    ],
    body: [
      'Hora de revisar o que você aprendeu hoje. Tá dando estudante responsável.',
      'Suas anotações estão com saudades. Dá uma atenção pra elas.',
      'Faz uma revisão rapidinho e depois pode voltar pro TikTok, migo(a).',
      'Manifesta aquele 10 revisando o que você aprendeu hoje.',
      'Essa sessão de revisão vai ser pica demais.',
      'Seu eu do futuro vai te agradecer se você revisar agora.'
    ]
  },
  
  // Study streak notifications (Brazilian Gen Z style)
  streak: {
    title: [
      'Sequência maneira! 🔥',
      'Tá pegando fogo, bicho! 🔥',
      'Combo multiplicador ativado! 🔥'
    ],
    body: [
      'Dia {{days}} da sua sequência de estudos! Ninguém faz igual você.',
      '{{days}} dias de sequência? Temos uma lenda da constância aqui!',
      'Você estudou por {{days}} dias seguidos. Isso é brabo demais.'
    ]
  }
};