export const ELEVATOR_TEXTS = {
  doors: {
    entryLabel: 'ENTRADA ELEVADOR',
    destinationsLabel: 'DESTINOS'
  },
  intro: {
    modal: {
      title: 'Janus IA - Transicao Quantica',
      pages: [
        'Ao cruzar o painel do elevador, tudo ao seu redor muda em segundos.',
        'As paredes parecem distorcidas e os sons da empresa ficam distantes.',
        'Voce nao entende o que aconteceu, mas esta claro que existe algo muito errado na Janus Corp.',
        'Uma entidade chamada Janus IA surge e exige que voce investigue o que esta acontecendo.'
      ],
      previousButton: '<',
      nextButton: '>',
      continueButton: 'INICIAR CONTATO'
    },
    dialog: {
      name: 'Janus IA',
      dialogues: [
        'Analise concluida: voce foi deslocado para uma camada quantica da Janus Corp.',
        'Seu padrao biologico indica confusao. Confirmacao: voce nao entende o que aconteceu.',
        'Ha uma anomalia estrutural na empresa. Algo esta fora do padrao esperado.',
        'Objetivo ativo: falar com o chefe e reunir evidencias sobre a origem da anomalia.'
      ]
    }
  },
  janus: {
    introDialogues: [
      'Constatacao: voce acaba de entrar em uma dimensao alternativa da Janus Corp.',
      'Para continuar, responda 5 questoes de calibracao comportamental.'
    ],
    completionDialogues: [
      'Calibracao concluida. Perfil sincronizado com os eixos comportamentais.',
      'Acesso liberado aos destinos do elevador.'
    ],
    questionPrefix: 'Pergunta',
    questions: [
      {
        id: 'janus_q1',
        prompt: 'Voce detecta uma anomalia de dados. Qual acao inicial representa melhor sua postura?',
        options: [
          { id: 'q1_a', label: 'Executar checklist de validacao imediatamente', axis: 'execution', points: 1 },
          { id: 'q1_b', label: 'Alinhar o diagnostico com o time antes de agir', axis: 'collaboration', points: 1 },
          { id: 'q1_c', label: 'Criar um experimento para isolar a causa', axis: 'innovation', points: 1 },
          { id: 'q1_d', label: 'Estabilizar o ambiente para reduzir impacto', axis: 'resilience', points: 1 }
        ]
      },
      {
        id: 'janus_q2',
        prompt: 'Em uma decisao com prazo curto, como voce prioriza?',
        options: [
          { id: 'q2_a', label: 'Entrega objetiva com escopo minimo viavel', axis: 'execution', points: 1 },
          { id: 'q2_b', label: 'Consenso rapido com as areas afetadas', axis: 'collaboration', points: 1 },
          { id: 'q2_c', label: 'Ajustes criativos para aumentar valor', axis: 'innovation', points: 1 },
          { id: 'q2_d', label: 'Plano seguro para evitar regressao', axis: 'resilience', points: 1 }
        ]
      },
      {
        id: 'janus_q3',
        prompt: 'Concordo totalmente ou discordo totalmente: Processos claros aceleram a qualidade final.',
        likert: { id: 'q3', positiveAxis: 'execution', negativeAxis: 'innovation' }
      },
      {
        id: 'janus_q4',
        prompt: 'Concordo totalmente ou discordo totalmente: Decisoes melhores surgem com escuta ativa do time.',
        likert: { id: 'q4', positiveAxis: 'collaboration', negativeAxis: 'execution' }
      },
      {
        id: 'janus_q5',
        prompt: 'Concordo totalmente ou discordo totalmente: Em cenarios incertos, manter estabilidade e prioridade.',
        likert: { id: 'q5', positiveAxis: 'resilience', negativeAxis: 'innovation' }
      }
    ],
    likertLabels: {
      stronglyAgree: 'Concordo totalmente',
      agree: 'Concordo',
      neutral: 'Nem concordo nem discordo',
      disagree: 'Discordo',
      stronglyDisagree: 'Discordo totalmente'
    }
  },
  objectiveSelection: {
    name: 'Janus IA',
    greeting: 'Anomalia identificada. Defina seu objetivo principal para conduzir a investigacao:',
    options: {
      boss: {
        id: 'objective_choose_boss',
        label: 'Falar com o dono da Janus Corp',
        axis: 'execution',
        points: 2,
        objectiveKey: 'boss'
      },
      team: {
        id: 'objective_choose_team',
        label: 'Conversar com a equipe para mapear sinais',
        axis: 'collaboration',
        points: 2,
        objectiveKey: 'team'
      },
      solve: {
        id: 'objective_choose_solve',
        label: 'Tentar solucionar a anomalia imediatamente',
        axis: 'innovation',
        points: 2,
        objectiveKey: 'solve'
      },
      stabilize: {
        id: 'objective_choose_stabilize',
        label: 'Conter impacto e estabilizar o ambiente',
        axis: 'resilience',
        points: 2,
        objectiveKey: 'stabilize'
      }
    },
    confirmationPrefix: 'Objetivo definido:'
  },
  destinationMenu: {
    name: 'Painel do Elevador',
    greeting: 'Selecione seu destino:',
    options: {
      garden: 'Jardim',
      coffeeRoom: 'Cafeteria',
      bossRoom: 'Sala do Chefe',
      itRoom: 'Entrada Elevador',
      activeObjectives: 'Objetivos Ativos',
      cancel: 'Cancelar'
    }
  },
  objectiveHub: {
    title: 'Nucleo de Objetivos Ativos',
    hubDialogues: [
      'Ambiente quantico estabilizado. Objetivos ativos atualizados.',
      'Sua proxima acao depende do objetivo que voce acabou de escolher.'
    ],
    menuGreeting: 'Escolha uma acao para avancar na investigacao:',
    noObjectiveGreeting: 'Nenhum objetivo ativo. Volte ao elevador e escolha seu foco de investigacao.',
    menu: {
      boss: 'Objetivo (Execucao): falar com o dono da Janus Corp',
      team: 'Objetivo (Colaboracao): conversar com a equipe',
      solve: 'Objetivo (Inovacao): executar protocolo de correcao',
      stabilize: 'Objetivo (Resiliencia): estabilizar ambiente critico',
      quiz: 'Minigame: quiz de evidencias',
      memory: 'Minigame: memoria de incidentes',
      puzzle: 'Minigame: reconstituir log quebrado',
      back: 'Voltar ao elevador'
    }
  }
};