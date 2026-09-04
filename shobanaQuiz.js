/**
 * ❤️ Shobana's Birthday Intro & 10-Question Personal Quiz Module
 * High-End Glassmorphism Interactive Quiz preceding 3D Cake Experience
 */

(function () {
  'use strict';

  // Personal Birthday Questions & Options
  const QUIZ_QUESTIONS = [
    {
      id: 1,
      type: "text",
      question: "Namma friendship-ku perfect emoji?",
      placeholder: "",
    },
    {
      id: 2,
      type: "text",
      question: "Namma rendu perum oru movie-la characters-na, genre enna? 🤭",
      placeholder: "",
      reaction: "Blockbuster movie for sure! 🤭"

    },
    {
      id: 3,
      type: "text",
      question: "One word-la ennai describe panna 🤭",
      placeholder: "eeeeeeeeeeeeee",


    },
    {
      id: 4,
      type: "text",
      question: "Namma rendu perla yaaru first-a kovapaduva ",
      placeholder: "",
    },
    {
      id: 5,
      type: "text",
      question: "Naan message pannama irundha nee enna pannuva 😅",
      placeholder: "",


    },
    {
      id: 6,
      type: "text",
      question: "Naan unakku surprise kudutha, first reaction enna! 🎁",
      placeholder: "",
    },
    {
      id: 7,
      type: "text",
      question: "Naan un birthday-a maranthurutha 😅",
      placeholder: "",
      reaction: "I will NEVER forget your birthday 🤍"
    },

    {
      id: 8,
      type: "text",
      question: "ipa unodaiya turn yethacham kekanuna kekalam sollanalum sollalam 😅 ",
      placeholder: "",

    }
  ];

  // Opening Intro Typography Sentences
  const INTRO_SENTENCES = [
    { text: "Hi Shobana... 🤍", duration: 2700 },
    { text: "I have a little surprise for you...", duration: 2700 }
  ];

  let currentQuestionIndex = 0;
  let isTransitioning = false;

  // Web Audio Synthesizer for lag-free audio chimes
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => { });
    }
    return audioCtx;
  }

  function playChime(type) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'select') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'next') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'complete') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.25, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.5);
        });
      }
    } catch (e) { }
  }

  function init() {
    const introLayer = document.getElementById('shobanaIntroLayer');
    if (!introLayer) return;

    playOpeningIntroSequence();
  }

  // Phase 1: Opening Typography Sequence
  function playOpeningIntroSequence() {
    const introTextEl = document.getElementById('sq-intro-text');
    if (!introTextEl) return;

    function showSentence(index) {
      if (index >= INTRO_SENTENCES.length) {
        // Transition to Quiz Layer
        transitionToQuizLayer();
        return;
      }

      const item = INTRO_SENTENCES[index];

      // Fade out current text
      introTextEl.classList.remove('sq-text-visible');
      introTextEl.classList.add('sq-text-hidden');

      setTimeout(() => {
        introTextEl.textContent = item.text;
        introTextEl.classList.remove('sq-text-hidden');
        introTextEl.classList.add('sq-text-visible');

        setTimeout(() => {
          showSentence(index + 1);
        }, item.duration);
      }, 550);
    }

    showSentence(0);
  }

  // Transition from Typography Intro -> 10 Question Quiz
  function transitionToQuizLayer() {
    const introLayer = document.getElementById('shobanaIntroLayer');
    const quizLayer = document.getElementById('shobanaQuizLayer');

    if (introLayer) {
      introLayer.classList.add('sq-fade-out');
      setTimeout(() => introLayer.classList.add('hidden'), 500);
    }

    if (quizLayer) {
      quizLayer.classList.remove('hidden');
      setTimeout(() => {
        quizLayer.classList.remove('opacity-0', 'scale-95');
        quizLayer.classList.add('opacity-100', 'scale-100');
        renderQuestion(0);
      }, 100);
    }
  }

  // Phase 2: Render Question
  function renderQuestion(index) {
    const q = QUIZ_QUESTIONS[index];
    if (!q) return;

    const badgeText = document.getElementById('sq-badge-text');
    const progressBar = document.getElementById('sq-progress-bar');
    const titleEl = document.getElementById('sq-question-title');
    const optionsContainer = document.getElementById('sq-options-container');
    const cardContent = document.getElementById('sq-card-content');

    if (!optionsContainer || !cardContent) return;

    // Update Header & Progress Bar
    const questionNum = (index + 1).toString().padStart(2, '0');
    if (badgeText) badgeText.textContent = `QUESTION ${index + 1} / ${QUIZ_QUESTIONS.length}`;

    if (progressBar) {
      const percent = ((index + 1) / QUIZ_QUESTIONS.length) * 100;
      progressBar.style.width = `${percent}%`;
    }

    if (titleEl) titleEl.textContent = q.question;

    // Render Options List or Text Input Field
    optionsContainer.innerHTML = '';

    if (q.type === 'text' || !q.options) {
      const inputWrap = document.createElement('div');
      inputWrap.className = 'w-full flex flex-col gap-3.5';

      const inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.className = 'w-full py-3 px-4 sm:py-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-slate-950/40 border border-white/25 text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-500/40 text-xs sm:text-base font-medium transition-all backdrop-blur-md shadow-inner';
      inputEl.placeholder = q.placeholder || 'Type your answer here...';

      const submitBtn = document.createElement('button');
      submitBtn.className = 'w-full py-3 px-4 sm:py-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 hover:opacity-95 active:scale-95 text-white font-bold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-base';
      submitBtn.innerHTML = `<span>Submit Answer</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>`;

      const handleSubmit = () => {
        const val = inputEl.value.trim();
        if (!val) {
          inputEl.classList.add('border-red-400', 'ring-2', 'ring-red-400/50');
          setTimeout(() => inputEl.classList.remove('border-red-400', 'ring-2', 'ring-red-400/50'), 800);
          return;
        }
        if (isTransitioning) return;
        isTransitioning = true;

        playChime('select');
        submitBtn.classList.add('opacity-80', 'scale-98');
        showReactionToast(q.reaction || 'Answer saved! ❤️');

        setTimeout(() => {
          advanceNextQuestion();
        }, 1100);
      };

      submitBtn.addEventListener('click', handleSubmit);
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSubmit();
      });

      inputWrap.appendChild(inputEl);
      inputWrap.appendChild(submitBtn);
      optionsContainer.appendChild(inputWrap);

      setTimeout(() => inputEl.focus(), 150);
    } else {
      q.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'sq-option-btn w-full py-3 px-4 sm:py-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-slate-950/40 hover:bg-pink-600/30 active:scale-95 border border-white/20 hover:border-pink-400/60 transition-all duration-200 text-left font-medium flex items-center justify-between text-slate-100 hover:text-white backdrop-blur-md shadow-md cursor-pointer group';

        btn.innerHTML = `
          <div class="flex items-center gap-2.5 sm:gap-3.5 pointer-events-none">
            <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-pink-300 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-inner shrink-0">
              ${opt.letter}
            </span>
            <span class="text-xs sm:text-base font-semibold tracking-wide">${opt.text}</span>
          </div>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all pointer-events-none shrink-0"></i>
        `;

        btn.addEventListener('click', () => {
          onOptionSelected(btn, opt);
        });

        optionsContainer.appendChild(btn);
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Handle Option Click & Playful Reaction Toast
  function onOptionSelected(btnEl, optionData) {
    if (isTransitioning) return;
    isTransitioning = true;

    playChime('select');

    // Highlight button
    btnEl.classList.add('border-pink-400', 'bg-pink-500/30', 'scale-98', 'shadow-[0_0_25px_rgba(244,114,182,0.4)]');

    // Show reaction toast
    showReactionToast(optionData.reaction);

    // Transition to next question after reaction delay
    setTimeout(() => {
      advanceNextQuestion();
    }, 1100);
  }

  function showReactionToast(reactionText) {
    const toast = document.getElementById('sq-toast');
    const toastText = document.getElementById('sq-toast-text');

    if (!toast || !toastText) return;

    toastText.textContent = reactionText;
    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');

    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
      toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    }, 1000);
  }

  function advanceNextQuestion() {
    const cardContent = document.getElementById('sq-card-content');

    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      playChime('next');

      // Smooth slide/fade out current question card content
      if (cardContent) {
        cardContent.classList.remove('opacity-100', 'scale-100');
        cardContent.classList.add('opacity-0', 'scale-95');
      }

      setTimeout(() => {
        currentQuestionIndex++;
        renderQuestion(currentQuestionIndex);

        if (cardContent) {
          cardContent.classList.remove('opacity-0', 'scale-95');
          cardContent.classList.add('opacity-100', 'scale-100');
        }

        isTransitioning = false;
      }, 250);
    } else {
      // Question 10 completed -> Trigger Completion Sequence
      triggerCompletionSequence();
    }
  }

  // Phase 4: Final Quiz Completion Sequence
  function triggerCompletionSequence() {
    playChime('complete');

    const quizLayer = document.getElementById('shobanaQuizLayer');
    const completionLayer = document.getElementById('shobanaCompletionLayer');
    const surpriseBtn = document.getElementById('sq-surprise-btn');

    if (quizLayer) {
      quizLayer.classList.remove('opacity-100', 'scale-100');
      quizLayer.classList.add('opacity-0', 'scale-95');
      setTimeout(() => {
        quizLayer.classList.add('hidden');
      }, 500);
    }

    if (completionLayer) {
      completionLayer.classList.remove('hidden');
      requestAnimationFrame(() => {
        completionLayer.classList.remove('opacity-0', 'scale-95');
        completionLayer.classList.add('opacity-100', 'scale-100');
      });
    }

    if (surpriseBtn) {
      const newSurpriseBtn = surpriseBtn.cloneNode(true);
      surpriseBtn.parentNode.replaceChild(newSurpriseBtn, surpriseBtn);

      newSurpriseBtn.addEventListener('click', () => {
        playChime('select');
        if (typeof window.confetti === 'function') {
          window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
        dismissAllQuizLayers();
      });
    }
  }

  // Phase 5: Reveal Existing 3D Cake Experience
  function dismissAllQuizLayers() {
    const completionLayer = document.getElementById('shobanaCompletionLayer');
    const quizLayer = document.getElementById('shobanaQuizLayer');
    const introLayer = document.getElementById('shobanaIntroLayer');

    if (completionLayer) completionLayer.classList.add('sq-fade-out');

    // Trigger 3D Cake Experience reveal automatically
    if (typeof window.triggerCakeReveal === 'function') {
      window.triggerCakeReveal();
    }

    setTimeout(() => {
      if (introLayer) { introLayer.style.display = 'none'; }
      if (quizLayer) { quizLayer.style.display = 'none'; }
      if (completionLayer) { completionLayer.style.display = 'none'; }
    }, 800);
  }

  function reopenQuiz() {
    const cakeExperience = document.getElementById('cake-experience');
    if (cakeExperience) cakeExperience.classList.remove('cake-experience-active');

    const completionLayer = document.getElementById('shobanaCompletionLayer');
    const quizLayer = document.getElementById('shobanaQuizLayer');

    if (completionLayer) {
      completionLayer.style.display = 'none';
      completionLayer.classList.add('hidden', 'opacity-0');
      completionLayer.classList.remove('sq-fade-out', 'opacity-100', 'scale-100');
    }

    if (quizLayer) {
      quizLayer.style.display = 'flex';
      quizLayer.classList.remove('hidden', 'sq-fade-out');
      requestAnimationFrame(() => {
        quizLayer.classList.remove('opacity-0', 'scale-95');
        quizLayer.classList.add('opacity-100', 'scale-100');
      });
    }

    currentQuestionIndex = 0;
    renderQuestion(0);
  }
  window.reopenQuiz = reopenQuiz;

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
