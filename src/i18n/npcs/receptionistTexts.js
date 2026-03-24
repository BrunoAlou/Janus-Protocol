export const RECEPTIONIST_TEMPLATE_TEXTS = {
  name: 'Recepcionista',
  dialogues: [
    { text: 'Bem-vindo ao Janus Protocol!', emotion: 'happy' },
    { text: 'Como posso ajuda-lo hoje?', emotion: 'neutral' }
  ]
};

export const RECEPTIONIST_RECEPTION_TEXTS = {
  id: 'npc_receptionist',
  contactFlagKey: 'contacted_npc_receptionist',
  name: 'Recepcionista',
  description: 'A recepcionista da empresa, sempre atenciosa',
  greeting: 'Ola! Bem-vindo(a) a Janus Corp. Como posso ajudar?',
  greetings: {
    beforeCaio: 'Ola! Bem-vindo(a) a Janus Corp. Como posso ajudar?',
    afterCaio: 'Antes de circular e conversar, o correto era passar na recepcao. Você deve ser o Leo, é o último de hoje.'
  },
  options: {
    info: {
      id: 'opt_info',
      label: 'Informacoes sobre a empresa',
      description: 'Saiba mais sobre a Janus Corp',
      dialogues: [
        'A Janus Corp e lider em inovacao tecnologica.',
        'Fundada ha 10 anos, temos escritorios em 5 paises.',
        'Posso ajudar com mais alguma coisa?'
      ]
    },
    directions: {
      id: 'opt_directions',
      label: 'Onde fica o setor de TI?',
      dialogues: [
        'O setor de TI fica pela porta da esquerda da recepcao.',
        'Siga por ela para continuar sua jornada.'
      ]
    },
    meetItTeam: {
      id: 'opt_meet_it_team',
      label: 'Conhecer equipe de TI'
    },
    scheduleMeeting: {
      id: 'opt_meeting',
      label: 'Agendar reuniao'
    },
    bye: {
      id: 'opt_bye',
      label: 'Ate logo',
      dialogues: ['Tenha um otimo dia!']
    }
  },
  beforeCaioFlow: {
    intro: {
      dialogues: [
        'Bem-vindo! Você é o novo candidato, certo?',
        'Qual opção você prefere iniciar com?'
      ]
    },
    followUp: [
      {
        id: 'opt_resilience_wait',
        axis: 'resilience',
        label: 'Quer que eu explique o contexto dessa entrevista e você aguarda aqui?',
        dialogues: [
          'Perfeito. Vou explicar como vai funcionar e você fica tranquilo aqui enquanto nos preparamos.',
          'Essa escolha indica controle emocional e boa tolerancia a pressao.'
        ],
        unlocksFlags: [
          'receptionist_main_mission_unlocked'
        ],
        actionOnSelect: {
          type: 'wait-room',
          showInfoPanel: true,
          minigameOption: true
        }
      },
      {
        id: 'opt_collaboration_team',
        axis: 'collaboration',
        label: 'Quer conhecer a equipe de TI para quebrar o gelo?',
        dialogues: [
          'Otima iniciativa! Conhecer o time antes ajuda a entender a cultura daqui.',
          'A porta da esquerda foi liberada. Pode seguir.'
        ],
        unlocksFlags: [
          'receptionist_ti_room_unlocked'
        ],
        actionOnSelect: {
          type: 'event',
          target: 'meet-it-team'
        }
      },
      {
        id: 'opt_execution_form',
        axis: 'execution',
        label: 'Quer ir preenchendo um formulario inicial enquanto o time se prepara?',
        dialogues: [
          'Excelente! Que vous faca um pré-triagem com nossos dados iniciais.',
          'Isso vai nos ajudar a otimizar o tempo da entrevista.'
        ],
        unlocksFlags: [
          'receptionist_form_unlocked'
        ],
        actionOnSelect: {
          type: 'element-unlock',
          elementId: 'form-quiz-element',
          enableMinigame: true
        }
      },
      {
        id: 'opt_innovation_details',
        axis: 'innovation',
        label: 'Quer conhecer mais detalhes sobre a vaga e a empresa antes?',
        dialogues: [
          'Boa! Vou deixar você revisar as informacoes sobre a posicao naquele terminal.',
          'Você tem acesso a tudo que precisa saber sobre o Janus Protocol.'
        ],
        unlocksFlags: [
          'receptionist_info_panel_unlocked'
        ],
        actionOnSelect: {
          type: 'mission-unlock',
          missionId: 'main-mission-janus-ai',
          bugHint: false
        }
      }
    ]
  },
  afterCaioFlow: {
    apology: {
      id: 'opt_receptionist_apology',
      axis: 'collaboration',
      label: 'Desculpe o atraso e por nao ter vindo direto a recepcao. Sim, sou eu mesmo!',
      dialogues: [
        'Registrado. Obrigada por reconhecer o procedimento.',
        'Já que sobrou só você, qual opção quer realizar primeiro?.'
      ]
    },
    followUp: [
      {
        id: 'opt_resilience_wait',
        axis: 'resilience',
        label: 'Quer que eu explique a situacao do imprevisto para o gerente do time, acha melhor?',
        dialogues: [
          'Perfeito. Aguarde aqui e mantenha a calma que vou alinhar seu contexto com a gerencia.',
          'Mas dá proxima vez fale com a recepção diretamente, antes de tudo.'
        ],
        unlocksFlags: [
          'receptionist_main_mission_unlocked'
        ],
        actionOnSelect: {
          type: 'wait-room',
          showInfoPanel: true,
          minigameOption: true
        }
      },
      {
        id: 'opt_collaboration_team',
        axis: 'collaboration',
        label: 'Quer falar diretamente com a sua equipe, enquanto defino os testes?',
        dialogues: [
          'Excelente decisao. Ja registrei sua visita para conhecer o time TI.',
          'A porta da esquerda foi liberada. Pode seguir.'
        ],
        unlocksFlags: [
          'receptionist_ti_room_unlocked',
        ],
        actionOnSelect: {
          type: 'event',
          target: 'meet-it-team'
        }
      },
      {
        id: 'opt_execution_form',
        axis: 'execution',
        label: 'Quer ir preenchendo um form de questoes enquanto nos organizamos?',
        dialogues: [
          'Otimo. Isso acelera seu processo e melhora nossa triagem inicial.',
          'Essa escolha tende ao eixo de execucao por foco em estrutura e andamento.'
        ],
        unlocksFlags: [
          'receptionist_form_unlocked',
        ],
        actionOnSelect: {
          type: 'element-unlock',
          elementId: 'form-quiz-element',
          enableMinigame: true
        }
      },
      {
        id: 'opt_innovation_details',
        axis: 'innovation',
        label: 'Quer ir lendo mais detalhes sobre a vaga no terminal de informacoes ao lado?',
        dialogues: [
          'Boa iniciativa. Buscar contexto antes da entrevista ajuda a formular respostas melhores.',
          'Para mais informações consulte o terminal de informações ao lado.'
        ],
        unlocksFlags: [
          'receptionist_info_panel_unlocked',
        ],
        actionOnSelect: {
          type: 'mission-unlock',
          missionId: 'main-mission-janus-ai',
          bugHint: true
        }
      }
    ]
  },
  itTeamUnlockedDialogues: [
    'Perfeito! Ja registrei sua visita para conhecer a equipe de TI.',
    'A porta da esquerda foi liberada. Pode seguir.'
  ]
};
