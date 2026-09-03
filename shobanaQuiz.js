/**
 * ❤️ Shobana's Birthday Intro & 10-Question Personal Quiz Module
 * High-End Glassmorphism Interactive Quiz preceding 3D Cake Experience
 */

(function () {
  'use strict';

  // 10 Personal Birthday Questions & Options
  const QUIZ_QUESTIONS = [
    {
      id: 1,
      question: "Naan unakku enna? 😏",
      options: [
        { letter: "A", text: "Best friend ❤️", reaction: "Awww! Good choice ❤️" },
        { letter: "B", text: "Partner in crime 😈", reaction: "Ahhh… I knew you'd choose that 😏" },
        { letter: "C", text: "Trouble maker 😂", reaction: "Really?! Me?! Trouble maker?! 😂" },
        { letter: "D", text: "All of the above", reaction: "Haha! Absolutely all of the above! 🔥" }
      ]
    },
    {
      id: 2,
      question: "Namma rendu perla yaaru first-a kovapaduva? 😂",
      options: [
        { letter: "A", text: "Naan", reaction: "Interesting choice 😂" },
        { letter: "B", text: "Shobana", reaction: "Okay Shobana… noted 👀" },
        { letter: "C", text: "Rendu perum", reaction: "Double trouble! 😂" },
        { letter: "D", text: "Situation-ku depend", reaction: "Diplomatic answer! 😏" }
      ]
    },
    {
      id: 3,
      question: "Naan message pannama irundha nee enna pannuva? 👀",
      options: [
        { letter: "A", text: "Wait pannuven", reaction: "Patience level 100! ✨" },
        { letter: "B", text: "Message pannuven", reaction: "Good response! 📱" },
        { letter: "C", text: "Call pannuven", reaction: "Direct action! I like it 🔥" },
        { letter: "D", text: "\"Finally peace!\" 😂", reaction: "Heyyy! No peace for you! 😂" }
      ]
    },
    {
      id: 4,
      question: "Naan unakku surprise kudutha, first reaction enna? 🎁",
      options: [
        { letter: "A", text: "Shock 😳", reaction: "Prepare to be shocked today! 🎁" },
        { letter: "B", text: "Smile ❤️", reaction: "Keep smiling always! ❤️" },
        { letter: "C", text: "Cry 🥹", reaction: "Happy tears only! 🥹" },
        { letter: "D", text: "\"Idhellam edhukku?\" 😂", reaction: "Classic response! 😂" }
      ]
    },
    {
      id: 5,
      question: "Namma friendship-ku perfect emoji?",
      options: [
        { letter: "A", text: "❤️", reaction: "Pure love! ❤️" },
        { letter: "B", text: "😂", reaction: "Endless laughs! 😂" },
        { letter: "C", text: "🫶", reaction: "Perfect bond! 🫶" },
        { letter: "D", text: "😈", reaction: "Pure chaos! 😈" }
      ]
    },
    {
      id: 6,
      question: "Naan 1 day full-a reply pannama irundha? 📱",
      options: [
        { letter: "A", text: "Wait", reaction: "Suspicious patience 👀" },
        { letter: "B", text: "Spam messages", reaction: "Spam incoming! 📱💥" },
        { letter: "C", text: "Call", reaction: "Emergency call! 📞" },
        { letter: "D", text: "\"Avan/ava poita!\" 😂", reaction: "That answer says a lot 😂" }
      ]
    },
    {
      id: 7,
      question: "Naan '5 minutes-la varen' nu sonna, actually? 😂",
      options: [
        { letter: "A", text: "5 minutes", reaction: "Too optimistic! 😂" },
        { letter: "B", text: "15 minutes", reaction: "More realistic 😏" },
        { letter: "C", text: "30 minutes", reaction: "Okay okay... fair enough! 👀" },
        { letter: "D", text: "Tomorrow 😭", reaction: "EXCUSE ME?! Tomorrow?! 😭" }
      ]
    },
    {
      id: 8,
      question: "Namma rendu perum oru movie-la characters-na, genre enna? 🎬",
      options: [
        { letter: "A", text: "Comedy 😂", reaction: "Full-on blockbuster comedy! 😂" },
        { letter: "B", text: "Romance ❤️", reaction: "Super sweet movie! ❤️" },
        { letter: "C", text: "Adventure 🔥", reaction: "Action packed adventure! 🔥" },
        { letter: "D", text: "Chaos 😈", reaction: "Absolute chaotic movie! 😈" }
      ]
    },
    {
      id: 9,
      question: "Naan un birthday-a marandhutta? 😭",
      options: [
        { letter: "A", text: "Forgive", reaction: "So kind of you! 🥹" },
        { letter: "B", text: "Block 😂", reaction: "Instant block?! No way! 😂" },
        { letter: "C", text: "Revenge 😈", reaction: "Revenge plan loading... 😈" },
        { letter: "D", text: "Never forget", reaction: "I will NEVER forget your birthday! ❤️" }
      ]
    },
    {
      id: 10,
      question: "Naan unakku 'I have a surprise' nu sonna, nee first enna guess pannuva? 👀",
      options: [
        { letter: "A", text: "Gift 🎁", reaction: "Something special is coming... 🎁" },
        { letter: "B", text: "Cake 🎂", reaction: "Cake is definitely waiting! 🎂" },
        { letter: "C", text: "Trip ✈️", reaction: "Pack your bags! ✈️" },
        { letter: "D", text: "Something crazy 😈", reaction: "Okay Shobana… get ready for something crazy! 😈" }
      ]
    }
  ];

  // Opening Intro Typography Sentences
  const INTRO_SENTENCES = [
    { text: "Hi Shobana... ❤️", duration: 2700 },
    { text: "I have a little surprise for you... ✨", duration: 2700 },
    { text: "But first, you have to complete one little task. 😏", duration: 2900 }
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
      audioCtx.resume().catch(() => {});
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
    } catch (e) {}
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
    if (badgeText) badgeText.textContent = `QUESTION ${index + 1} / 10`;

    if (progressBar) {
      const percent = ((index + 1) / QUIZ_QUESTIONS.length) * 100;
      progressBar.style.width = `${percent}%`;
    }

    if (titleEl) titleEl.textContent = q.question;

    // Render Options List
    optionsContainer.innerHTML = '';

    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'sq-option-btn w-full py-3.5 px-5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 active:scale-95 border border-white/15 hover:border-pink-400/50 transition-all duration-200 text-left font-medium flex items-center justify-between text-slate-100 hover:text-white shadow-md cursor-pointer group';

      btn.innerHTML = `
        <div class="flex items-center gap-3.5 pointer-events-none">
          <span class="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-pink-300 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-inner">
            ${opt.letter}
          </span>
          <span class="text-sm sm:text-base font-semibold tracking-wide">${opt.text}</span>
        </div>
        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all pointer-events-none"></i>
      `;

      btn.addEventListener('click', () => {
        onOptionSelected(btn, opt);
      });

      optionsContainer.appendChild(btn);
    });

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
    const completeTextEl = document.getElementById('sq-complete-text');

    if (quizLayer) {
      quizLayer.classList.add('sq-fade-out');
      setTimeout(() => quizLayer.classList.add('hidden'), 500);
    }

    if (completionLayer) {
      completionLayer.classList.remove('hidden');
      setTimeout(() => {
        completionLayer.classList.remove('opacity-0', 'scale-95');
        completionLayer.classList.add('opacity-100', 'scale-100');
      }, 100);
    }

    const sequence = [
      { text: "✨ TASK COMPLETED ✨", duration: 1400 },
      { text: "Okay Shobana...", duration: 1600 },
      { text: "Your surprise is ready... 👀❤️", duration: 1800 },
      { text: "Get ready... 🎂✨", duration: 2000 }
    ];

    let step = 0;

    function runCompletionStep() {
      if (step >= sequence.length) {
        dismissAllQuizLayers();
        return;
      }

      const item = sequence[step];
      if (completeTextEl) {
        completeTextEl.classList.remove('opacity-100', 'scale-100');
        completeTextEl.classList.add('opacity-0', 'scale-95');

        setTimeout(() => {
          completeTextEl.textContent = item.text;
          completeTextEl.classList.remove('opacity-0', 'scale-95');
          completeTextEl.classList.add('opacity-100', 'scale-100');
        }, 280);
      }

      step++;
      setTimeout(runCompletionStep, item.duration);
    }

    runCompletionStep();
  }

  // Phase 5: Reveal Existing 3D Cake Experience
  function dismissAllQuizLayers() {
    const completionLayer = document.getElementById('shobanaCompletionLayer');
    const quizLayer = document.getElementById('shobanaQuizLayer');
    const introLayer = document.getElementById('shobanaIntroLayer');

    if (completionLayer) completionLayer.classList.add('sq-fade-out');

    setTimeout(() => {
      if (introLayer) { introLayer.style.display = 'none'; introLayer.remove(); }
      if (quizLayer) { quizLayer.style.display = 'none'; quizLayer.remove(); }
      if (completionLayer) { completionLayer.style.display = 'none'; completionLayer.remove(); }
    }, 800);
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
