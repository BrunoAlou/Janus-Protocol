export const CAIO_RECEPTION_TEXTS = {
  id: 'npc_sit_guy',
  contactFlagKey: 'contacted_npc_sit_guy',
  name: 'Caio',
  description: 'Um visitante aguardando atendimento na recepcao',
  greetings: {
    beforeReceptionist: 'Ainda nao falei com a recepcionista. Acho melhor confirmar os proximos passos com ela.',
    afterReceptionist: 'Boa! A recepcionista ja liberou o caminho para a equipe de TI.'
  },
  options: {
    conversation: [
      {
        id: 'opt_sit_guy_vaga_info',
        axis: 'execution',
        labels: {
          beforeReceptionist: 'Voce tem alguma informacao sobre a vaga?',
          afterReceptionist: 'Caio, organiza os pontos principais e foca no que pedirem primeiro.'
        },
        dialogues: {
          beforeReceptionist: [
            'Pelo que ouvi, eles valorizam clareza para resolver problemas e priorizacao.',
            'Se voce mostrar objetividade e exemplo pratico, comeca bem.'
          ],
          afterReceptionist: [
            'Boa dica. Vou entrar com foco em entrega e ordem de prioridade.',
            'Esse caminho passa seguranca no eixo de execucao.'
          ]
        }
      },
      {
        id: 'opt_sit_guy_apresentacao',
        axis: 'collaboration',
        labels: {
          beforeReceptionist: 'Ola, qual o seu nome? Tambem aguardando para analista?',
          afterReceptionist: 'Caio, quer ensaiar comigo uma apresentacao rapida para quebrar o gelo?'
        },
        dialogues: {
          beforeReceptionist: [
            'Sou o Caio, prazer! Também estou esperando minha vez.',
            'Trocar ideia aqui ajuda a baixar a ansiedade e entender o clima.'
          ],
          afterReceptionist: [
            'Gostei. Fazer isso junto ja cria conexao e apoio mutuo.',
            'Essa postura puxa para o eixo de colaboracao.'
          ]
        }
      },
      {
        id: 'opt_sit_guy_atraso',
        axis: 'resilience',
        labels: {
          beforeReceptionist: 'Me atrasei um pouco. Voce sabe se ja fui chamado?',
          afterReceptionist: 'Caio, se bater ansiedade, respira fundo e retoma um passo de cada vez.'
        },
        dialogues: {
          beforeReceptionist: [
            'Relaxa, isso acontece. O melhor agora é se reorganizar e manter a calma.',
            'Conversa com a recepcionista e explica com tranquilidade.'
          ],
          afterReceptionist: [
            'Valeu, isso ajuda. Focar no controle emocional evita erro bobo.',
            'Esse tipo de recuperacao reforca o eixo de resiliencia.'
          ]
        }
      },
      {
        id: 'opt_sit_guy_fluxo',
        axis: 'innovation',
        labels: {
          beforeReceptionist: 'Ja te chamaram? Como esta funcionando por aqui?',
          afterReceptionist: 'Caio, vamos observar o fluxo e adaptar nossa abordagem para ganhar clareza?'
        },
        dialogues: {
          beforeReceptionist: [
            'Ainda não me chamaram, mas estou observando o fluxo para me adaptar rápido.',
            'Entender o contexto antes de agir costuma ajudar.'
          ],
          afterReceptionist: [
            'Boa. Ajustar a estrategia com base no ambiente pode diferenciar a gente.',
            'Esse olhar exploratorio tende ao eixo de inovacao.'
          ]
        }
      }
    ],
    bye: {
      id: 'opt_sit_guy_bye',
      axis: 'collaboration',
      label: 'Boa sorte!',
      dialogues: ['Obrigado! Boa sorte para voce tambem.']
    }
  }
};
