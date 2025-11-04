import BaseMinigame from './BaseMinigame.js';

/**
 * QuizGame - Quiz de perguntas e respostas
 */
export default class QuizGame extends BaseMinigame {
  constructor() {
    super('QuizGame');
    this.currentQuestionIndex = 0;
    this.correctAnswers = 0;
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // Título
    this.add.text(width / 2, 80, 'QUIZ DE CONHECIMENTO', {
      fontSize: '36px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Progresso
    this.progressText = this.add.text(width / 2, 140, 'Pergunta 1/10', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Perguntas
    this.questions = [
      {
        question: 'Qual linguagem é usada para desenvolvimento web front-end?',
        options: ['Python', 'JavaScript', 'Java', 'C++'],
        correct: 1
      },
      {
        question: 'O que significa HTML?',
        options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
        correct: 0
      },
      {
        question: 'Qual é o framework JavaScript usado neste jogo?',
        options: ['React', 'Vue', 'Phaser', 'Angular'],
        correct: 2
      },
      {
        question: 'O que é Git?',
        options: ['Um editor de código', 'Um sistema de controle de versão', 'Uma linguagem de programação', 'Um banco de dados'],
        correct: 1
      },
      {
        question: 'Qual tag HTML cria um link?',
        options: ['<link>', '<a>', '<href>', '<url>'],
        correct: 1
      },
      {
        question: 'O que é CSS?',
        options: ['Um banco de dados', 'Uma linguagem de estilização', 'Um servidor web', 'Um protocolo de rede'],
        correct: 1
      },
      {
        question: 'Qual método JavaScript adiciona um elemento ao final de um array?',
        options: ['add()', 'append()', 'push()', 'insert()'],
        correct: 2
      },
      {
        question: 'O que significa API?',
        options: ['Application Programming Interface', 'Advanced Programming Interface', 'Application Process Integration', 'Automated Programming Interface'],
        correct: 0
      },
      {
        question: 'Qual é a porta padrão do HTTP?',
        options: ['8080', '443', '80', '3000'],
        correct: 2
      },
      {
        question: 'O que é JSON?',
        options: ['Um banco de dados', 'Um formato de dados', 'Uma linguagem de programação', 'Um protocolo de rede'],
        correct: 1
      }
    ];

    // Embaralhar perguntas
    this.questions.sort(() => Math.random() - 0.5);

    // Área da pergunta
    this.questionText = this.add.text(width / 2, height / 2 - 100, '', {
      fontSize: '22px',
      color: '#ffffff',
      wordWrap: { width: width - 200 },
      align: 'center'
    }).setOrigin(0.5);

    // Botões de opções
    this.optionButtons = [];
    for (let i = 0; i < 4; i++) {
      const button = this.createOptionButton(width / 2, height / 2 + i * 60, i);
      this.optionButtons.push(button);
    }

    // Feedback
    this.feedbackText = this.add.text(width / 2, height - 100, '', {
      fontSize: '24px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Mostrar primeira pergunta
    this.showQuestion();

    this.logTelemetry('quiz_started', { totalQuestions: this.questions.length });
  }

  createOptionButton(x, y, index) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 600, 50, 0x2a2a3e)
      .setStrokeStyle(2, 0x00d9ff)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(-280, 0, '', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    container.add([bg, text]);
    container.optionIndex = index;
    container.bg = bg;
    container.text = text;

    // Hover effect
    bg.on('pointerover', () => {
      if (container.enabled) {
        bg.setFillStyle(0x3a3a4e);
      }
    });
    bg.on('pointerout', () => {
      if (container.enabled) {
        bg.setFillStyle(0x2a2a3e);
      }
    });
    bg.on('pointerdown', () => {
      if (container.enabled) {
        this.selectOption(index);
      }
    });

    container.enabled = true;
    return container;
  }

  showQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      // Quiz finalizado
      this.completeMinigame();
      return;
    }

    const q = this.questions[this.currentQuestionIndex];

    this.progressText.setText(`Pergunta ${this.currentQuestionIndex + 1}/${this.questions.length}`);
    this.questionText.setText(q.question);
    this.feedbackText.setText('');

    // Atualizar opções
    this.optionButtons.forEach((btn, index) => {
      btn.text.setText(q.options[index]);
      btn.bg.setFillStyle(0x2a2a3e);
      btn.bg.setStrokeStyle(2, 0x00d9ff);
      btn.enabled = true;
    });
  }

  selectOption(selectedIndex) {
    const q = this.questions[this.currentQuestionIndex];
    const isCorrect = selectedIndex === q.correct;

    // Desabilitar todos os botões
    this.optionButtons.forEach(btn => btn.enabled = false);

    // Destacar resposta correta e incorreta
    this.optionButtons[q.correct].bg.setFillStyle(0x00ff00);
    this.optionButtons[q.correct].bg.setStrokeStyle(3, 0x00ff00);

    if (!isCorrect) {
      this.optionButtons[selectedIndex].bg.setFillStyle(0xff0000);
      this.optionButtons[selectedIndex].bg.setStrokeStyle(3, 0xff0000);
    }

    // Feedback
    if (isCorrect) {
      this.correctAnswers++;
      this.updateScore(100);
      this.feedbackText.setText('✓ CORRETO!');
      this.feedbackText.setColor('#00ff00');
    } else {
      this.feedbackText.setText('✗ INCORRETO');
      this.feedbackText.setColor('#ff0000');
    }

    this.logTelemetry('question_answered', {
      questionIndex: this.currentQuestionIndex,
      correct: isCorrect,
      selectedIndex,
      correctIndex: q.correct
    });

    // Próxima pergunta após 2 segundos
    this.time.delayedCall(2000, () => {
      this.currentQuestionIndex++;
      this.showQuestion();
    });
  }

  completeMinigame() {
    this.logTelemetry('quiz_completed', {
      correctAnswers: this.correctAnswers,
      totalQuestions: this.questions.length,
      percentage: (this.correctAnswers / this.questions.length) * 100
    });

    super.completeMinigame();
  }
}
