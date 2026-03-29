export const IT_ROOM_NPC_DIALOGUES = {
  npc_it_alan: [
    { text: 'Oi, eu sou o Alan do suporte.', emotion: 'neutral' },
    { text: 'Se travar, respira e descreve o erro passo a passo.', emotion: 'calm' },
    { text: 'Na TI, diagnostico vem antes de qualquer pressa.', emotion: 'neutral' }
  ],
  npc_it_marcos: [
    { text: 'Oi, eu sou o Marcos do desenvolvimento.', emotion: 'neutral' },
    { text: 'Codigo limpo economiza horas de retrabalho.', emotion: 'focused' },
    { text: 'Automatizar o basico libera tempo para inovar.', emotion: 'happy' }
  ],
  npc_it_carlos: [
    { text: 'Oi, eu sou o Carlos do QA.', emotion: 'neutral' },
    { text: 'Teste bom e o que pega problema antes do usuario.', emotion: 'serious' },
    { text: 'Cobertura sem criterio nao garante qualidade.', emotion: 'neutral' }
  ],
  npc_it_diego: [
    { text: 'Oi, eu sou o Diego de DevOps.', emotion: 'neutral' },
    { text: 'Monitoramento nao e luxo, e previsibilidade.', emotion: 'professional' },
    { text: 'Quando o deploy e seguro, o time ganha confianca.', emotion: 'proud' }
  ],
  npc_it_bruno: [
    { text: 'Oi, eu sou o Bruno, gerente de TI.', emotion: 'neutral' },
    { text: 'Nosso foco e resolver com clareza, velocidade e colaboracao.', emotion: 'professional' },
    { text: 'Quero ver como voce prioriza quando tudo parece urgente.', emotion: 'serious' }
  ]
};

export const IT_ROOM_UI_TEXTS = {
  doors: {
    receptionLabel: 'RECEPCAO',
    elevatorLabel: 'ELEVADOR'
  }
};

export const IT_ROOM_JOURNEY_TEXTS = {
  managerName: 'Bruno',
  collaboratorFallbackName: 'Colaborador',
  likert: {
    stronglyAgree: 'Concordo totalmente',
    agree: 'Concordo',
    neutral: 'Nem concordo nem discordo',
    disagree: 'Discordo',
    stronglyDisagree: 'Discordo totalmente'
  },
  manager: {
    completedDialogues: [
      'Voce concluiu a rodada completa de avaliacao da equipe de TI.',
      'Bom trabalho. Vamos seguir para a proxima etapa quando estiver pronto.'
    ],
    blockedUntilTeamDialogues: [
      'Voce deve terminar de verificar com a equipe antes de prosseguirmos.'
    ],
    finalDialogues: [
      'Excelente. Fechamos os dois ciclos da equipe de TI.',
      'Seus dados de eixo foram registrados com sucesso.'
    ],
    introDialogues: [
      'Sou o Bruno, gerente de TI. Coordeno prioridades e mantenho o time em ritmo de entrega.',
      'Vou iniciar sua avaliacao de eixo com uma pergunta de perfil.'
    ],
    roundFollowUp: {
      1: 'Agora converse com cada colaborador da equipe. So depois seguimos.',
      2: 'Segunda rodada iniciada. Reavalie cada colaborador antes de avancarmos.'
    },
    questions: {
      1: {
        prompt: 'Ciclo 1: no modelo DISC, qual perfil mais descreve sua tomada de decisao?',
        options: [
          { id: 'bruno_r1_dominance', label: 'Dominancia: objetivo e rapido para decidir', axis: 'execution', points: 1 },
          { id: 'bruno_r1_influence', label: 'Influencia: comunicativo e articulador', axis: 'collaboration', points: 1 },
          { id: 'bruno_r1_steadiness', label: 'Estabilidade: previsivel e confiavel', axis: 'resilience', points: 1 },
          { id: 'bruno_r1_conscientiousness', label: 'Conformidade: preciso e orientado a metodo', axis: 'innovation', points: 1 }
        ]
      },
      2: {
        prompt: 'Ciclo 2: qual perfil de execucao se aproxima mais do seu estilo?',
        options: [
          { id: 'bruno_r2_dominance', label: 'Direto e orientado a resultado', axis: 'execution', points: 1 },
          { id: 'bruno_r2_influence', label: 'Persuasivo e focado em engajamento', axis: 'collaboration', points: 1 },
          { id: 'bruno_r2_steadiness', label: 'Consistente e estavel sob pressao', axis: 'resilience', points: 1 },
          { id: 'bruno_r2_conscientiousness', label: 'Analitico e criterioso na qualidade', axis: 'innovation', points: 1 }
        ]
      }
    }
  },
  collaborators: {
    completedDialogues: [
      'Avaliacao concluida. Neste momento, nao ha novas perguntas para voce aqui.'
    ],
    blockedByManagerDialogues: [
      'Antes de falar comigo, voce deve conversar com o Bruno para receber a diretriz deste ciclo.'
    ],
    alreadyAnsweredDialogues: [
      'Neste ciclo, sua avaliacao comigo ja foi registrada.',
      'Converse com os outros colaboradores antes de retornar.'
    ],
    allDoneRoundDialogues: [
      'Equipe concluida neste ciclo. Volte ao Bruno para prosseguirmos.'
    ],
    round1CompletedDialogues: [
      'Ciclo 1 da equipe concluido.',
      'Retorne ao Bruno para iniciar a proxima rodada.'
    ],
    round2CompletedDialogues: [
      'Registro finalizado. Todos os colaboradores foram avaliados nos dois ciclos.',
      'Voce pode retornar ao Bruno para um fechamento rapido.'
    ],
    partialProgressDialogues: [
      'Resposta registrada. Continue com os demais colaboradores da equipe.'
    ],
    promptsByNpcId: {
      npc_it_alan: {
        1: 'Alan: Consigo manter foco em processos mesmo sob alta demanda.',
        2: 'Alan: Prefiro padroes claros antes de escalar um atendimento.'
      },
      npc_it_marcos: {
        1: 'Marcos: Colaborar cedo evita retrabalho nas entregas.',
        2: 'Marcos: Feedback frequente melhora a qualidade do codigo.'
      },
      npc_it_carlos: {
        1: 'Carlos: Testes rigorosos compensam o tempo investido.',
        2: 'Carlos: Questionar premissas aumenta a inovacao do time.'
      },
      npc_it_diego: {
        1: 'Diego: Em incidentes, estabilidade vem antes de velocidade.',
        2: 'Diego: Resiliencia operacional e prioridade em ambientes criticos.'
      }
    },
    axisPairByNpcId: {
      npc_it_alan: ['execution', 'innovation'],
      npc_it_marcos: ['collaboration', 'execution'],
      npc_it_carlos: ['innovation', 'resilience'],
      npc_it_diego: ['resilience', 'innovation']
    }
  }
};
