/**
 * 👑 Birthday Quiz Admin Dashboard Engine
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'shobana_quiz_submissions';
  const DEFAULT_PIN = '1234';

  const QUIZ_QUESTIONS = [
    { id: 1, question: "Namma friendship-ku perfect emoji?" },
    { id: 2, question: "Namma rendu perum oru movie-la characters-na, genre enna? 🤭" },
    { id: 3, question: "One word-la ennai describe panna 🤭" },
    { id: 4, question: "Namma rendu perla yaaru first-a kovapaduva" },
    { id: 5, question: "Naan message pannama irundha nee enna pannuva 😅" },
    { id: 6, question: "Naan unakku surprise kudutha, first reaction enna! 🎁" },
    { id: 7, question: "Naan un birthday-a maranthurutha 😅" },
    { id: 8, question: "ipa unodaiya turn yethacham kekanuna kekalam sollanalum sollalam 😅" }
  ];

  let submissions = [];
  let currentActiveSubmissionId = null;

  // DOM Elements
  const pinOverlay = document.getElementById('pin-overlay');
  const pinForm = document.getElementById('pin-form');
  const pinInput = document.getElementById('pin-input');
  const pinError = document.getElementById('pin-error');
  const adminDashboard = document.getElementById('admin-dashboard');

  const statTotal = document.getElementById('stat-total');
  const statCompleted = document.getElementById('stat-completed');
  const statCompletedBar = document.getElementById('stat-completed-bar');
  const statAnswers = document.getElementById('stat-answers');
  const statLatest = document.getElementById('stat-latest');
  const statLatestTime = document.getElementById('stat-latest-time');

  const searchInput = document.getElementById('search-input');
  const questionFilter = document.getElementById('question-filter');
  const statusFilter = document.getElementById('status-filter');
  const submissionsContainer = document.getElementById('submissions-container');
  const emptyState = document.getElementById('empty-state');

  const refreshBtn = document.getElementById('refresh-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const clearBtn = document.getElementById('clear-btn');
  const lockBtn = document.getElementById('lock-btn');
  const sampleDataBtn = document.getElementById('sample-data-btn');
  const emptySampleBtn = document.getElementById('empty-sample-btn');

  const detailModal = document.getElementById('detail-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalUserTitle = document.getElementById('modal-user-title');
  const modalTimeSub = document.getElementById('modal-time-sub');
  const modalAnswersList = document.getElementById('modal-answers-list');
  const modalStatusBadge = document.getElementById('modal-status-badge');
  const modalDeleteBtn = document.getElementById('modal-delete-btn');

  // Initialization
  function init() {
    setupPinAuth();
    setupEventListeners();
    
    // Check if already unlocked in this session
    if (sessionStorage.getItem('admin_unlocked') === 'true') {
      unlockDashboard();
    }
  }

  function setupPinAuth() {
    if (!pinForm) return;

    pinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = pinInput.value.trim();

      if (enteredPin === DEFAULT_PIN || enteredPin === 'admin') {
        sessionStorage.setItem('admin_unlocked', 'true');
        pinError.classList.add('hidden');
        unlockDashboard();
      } else {
        pinError.classList.remove('hidden');
        pinInput.classList.add('border-red-500', 'ring-2', 'ring-red-500/50');
        setTimeout(() => pinInput.classList.remove('border-red-500', 'ring-2', 'ring-red-500/50'), 1000);
      }
    });
  }

  function unlockDashboard() {
    if (pinOverlay) {
      pinOverlay.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => pinOverlay.classList.add('hidden'), 300);
    }
    if (adminDashboard) {
      adminDashboard.classList.remove('hidden');
    }
    loadSubmissions();
  }

  function lockDashboard() {
    sessionStorage.removeItem('admin_unlocked');
    if (pinOverlay) {
      pinOverlay.classList.remove('hidden');
      requestAnimationFrame(() => pinOverlay.classList.remove('opacity-0', 'pointer-events-none'));
    }
    if (adminDashboard) {
      adminDashboard.classList.add('hidden');
    }
    if (pinInput) pinInput.value = '';
  }

  // Load Submissions from localStorage
  function loadSubmissions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      submissions = raw ? JSON.parse(raw) : [];

      // If empty, generate sample data for first time visualization
      if (submissions.length === 0) {
        generateSampleSubmissions();
        const updatedRaw = localStorage.getItem(STORAGE_KEY);
        submissions = updatedRaw ? JSON.parse(updatedRaw) : [];
      }
    } catch (e) {
      console.error('Failed to load submissions from localStorage', e);
      submissions = [];
    }

    renderDashboard();
  }

  // Sample Data Generator
  function generateSampleSubmissions() {
    const sampleData = [
      {
        id: 'sub_demo_101',
        userName: 'Shobana',
        submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        completed: true,
        totalQuestions: 8,
        completedQuestions: 8,
        answers: [
          { questionId: 1, question: "Namma friendship-ku perfect emoji?", answer: "❤️✨" },
          { questionId: 2, question: "Namma rendu perum oru movie-la characters-na, genre enna? 🤭", answer: "Blockbuster Comedy & Romance 🍿" },
          { questionId: 3, question: "One word-la ennai describe panna 🤭", answer: "eeeeeeeeeeeeee 😁" },
          { questionId: 4, question: "Namma rendu perla yaaru first-a kovapaduva", answer: "Nee thaan kandippa! 😜" },
          { questionId: 5, question: "Naan message pannama irundha nee enna pannuva 😅", answer: "Ennoda regular Spam calls start aagidum! 📞" },
          { questionId: 6, question: "Naan unakku surprise kudutha, first reaction enna! 🎁", answer: "Shock + Full Happiness! 😍" },
          { questionId: 7, question: "Naan un birthday-a maranthurutha 😅", answer: "Neeyavadhu marakiradhavadhu, impossible! 🤍" },
          { questionId: 8, question: "ipa unodaiya turn yethacham kekanuna kekalam sollanalum sollalam 😅", answer: "Thank you for making this day so special! ❤️" }
        ]
      },
      {
        id: 'sub_demo_102',
        userName: 'Shobana',
        submittedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        completed: true,
        totalQuestions: 8,
        completedQuestions: 8,
        answers: [
          { questionId: 1, question: "Namma friendship-ku perfect emoji?", answer: "🤝💖" },
          { questionId: 2, question: "Namma rendu perum oru movie-la characters-na, genre enna? 🤭", answer: "Full on Action Adventure!" },
          { questionId: 3, question: "One word-la ennai describe panna 🤭", answer: "Awesome & Caring 🌟" },
          { questionId: 4, question: "Namma rendu perla yaaru first-a kovapaduva", answer: "Rendu perume 😅" },
          { questionId: 5, question: "Naan message pannama irundha nee enna pannuva 😅", answer: "Enna aachu nu yosichutu iruppen" },
          { questionId: 6, question: "Naan unakku surprise kudutha, first reaction enna! 🎁", answer: "Cute smile 😁" },
          { questionId: 7, question: "Naan un birthday-a maranthurutha 😅", answer: "Kandippa marakka maatta" },
          { questionId: 8, question: "ipa unodaiya turn yethacham kekanuna kekalam sollanalum sollalam 😅", answer: "Best birthday surprise ever! 🎉" }
        ]
      }
    ];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
    } catch (e) { }
  }

  // Render Dashboard Analytics & Submissions List
  function renderDashboard() {
    updateAnalytics();
    renderFilteredSubmissions();
  }

  function updateAnalytics() {
    const totalCount = submissions.length;
    const completedCount = submissions.filter(s => s.completed).length;
    const completedPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    let totalAnswers = 0;
    submissions.forEach(s => {
      if (Array.isArray(s.answers)) {
        totalAnswers += s.answers.length;
      }
    });

    if (statTotal) statTotal.textContent = totalCount;
    if (statCompleted) statCompleted.textContent = completedCount;
    if (statCompletedBar) statCompletedBar.style.width = `${completedPercentage}%`;
    if (statAnswers) statAnswers.textContent = totalAnswers;

    if (statLatest && statLatestTime) {
      if (submissions.length > 0) {
        const latest = submissions[0];
        const dateObj = new Date(latest.submittedAt);
        statLatest.textContent = `${latest.userName || 'User'} (${latest.completed ? 'Completed' : 'In Progress'})`;
        statLatestTime.textContent = formatDate(dateObj);
      } else {
        statLatest.textContent = 'No submissions yet';
        statLatestTime.textContent = '--';
      }
    }
  }

  function renderFilteredSubmissions() {
    if (!submissionsContainer) return;

    const searchTerm = (searchInput?.value || '').toLowerCase().trim();
    const selectedQ = questionFilter?.value || 'all';
    const selectedStatus = statusFilter?.value || 'all';

    const filtered = submissions.filter(s => {
      // Status filter
      if (selectedStatus === 'completed' && !s.completed) return false;
      if (selectedStatus === 'in_progress' && s.completed) return false;

      // Question filter
      if (selectedQ !== 'all') {
        const qId = parseInt(selectedQ, 10);
        const hasAnsweredQ = s.answers && s.answers.some(a => a.questionId === qId);
        if (!hasAnsweredQ) return false;
      }

      // Keyword search
      if (searchTerm) {
        const matchUser = (s.userName || '').toLowerCase().includes(searchTerm);
        const matchAnswers = s.answers && s.answers.some(a =>
          (a.question || '').toLowerCase().includes(searchTerm) ||
          (a.answer || '').toLowerCase().includes(searchTerm)
        );
        if (!matchUser && !matchAnswers) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      submissionsContainer.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    submissionsContainer.innerHTML = '';

    filtered.forEach((sub) => {
      const card = document.createElement('div');
      card.className = 'p-5 sm:p-6 rounded-3xl glass-card transition-all duration-300 relative space-y-4';

      const dateStr = formatDate(new Date(sub.submittedAt));
      const answers = sub.answers || [];

      let answersGridHtml = '';
      answers.forEach(a => {
        answersGridHtml += `
          <div class="p-3.5 rounded-2xl bg-slate-950/40 border border-white/10 flex flex-col space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                Q${a.questionId}
              </span>
              <span class="text-xs font-semibold text-slate-300 truncate">${escapeHtml(a.question)}</span>
            </div>
            <p class="text-sm font-medium text-white pl-7 font-sans leading-relaxed break-words">${escapeHtml(a.answer)}</p>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500/30 to-purple-500/30 border border-pink-500/40 flex items-center justify-center text-pink-300 font-bold">
              ${(sub.userName || 'S')[0].toUpperCase()}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-white text-base">${escapeHtml(sub.userName || 'User')}</h4>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sub.completed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
                  ${sub.completed ? 'COMPLETED' : 'IN PROGRESS (' + (sub.completedQuestions || answers.length) + '/8)'}
                </span>
              </div>
              <p class="text-xs text-slate-400 font-mono mt-0.5">${dateStr}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button data-id="${sub.id}" class="view-detail-btn px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              <span>View Details</span>
            </button>

            <button data-id="${sub.id}" class="delete-sub-btn p-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition cursor-pointer" title="Delete record">
              <i data-lucide="trash" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${answersGridHtml}
        </div>
      `;

      submissionsContainer.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
    attachCardListeners();
  }

  function attachCardListeners() {
    document.querySelectorAll('.view-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openDetailModal(id);
      });
    });

    document.querySelectorAll('.delete-sub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteSubmission(id);
      });
    });
  }

  function openDetailModal(id) {
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;

    currentActiveSubmissionId = id;
    if (modalUserTitle) modalUserTitle.textContent = `${sub.userName || 'User'}'s Quiz Response`;
    if (modalTimeSub) modalTimeSub.textContent = `Submitted: ${formatDate(new Date(sub.submittedAt))}`;

    if (modalStatusBadge) {
      modalStatusBadge.textContent = sub.completed ? 'COMPLETED (8/8)' : `IN PROGRESS (${sub.answers?.length || 0}/8)`;
      modalStatusBadge.className = sub.completed
        ? 'px-3 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
        : 'px-3 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40';
    }

    if (modalAnswersList) {
      modalAnswersList.innerHTML = '';
      (sub.answers || []).forEach(a => {
        const item = document.createElement('div');
        item.className = 'p-4 rounded-2xl bg-slate-900/90 border border-white/15 space-y-2';
        item.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40 text-xs font-bold">
              Question ${a.questionId}
            </span>
            ${a.answeredAt ? `<span class="text-[10px] font-mono text-slate-400">${new Date(a.answeredAt).toLocaleTimeString()}</span>` : ''}
          </div>
          <h5 class="text-sm font-semibold text-pink-100">${escapeHtml(a.question)}</h5>
          <div class="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-white font-medium text-sm break-words">
            ${escapeHtml(a.answer)}
          </div>
        `;
        modalAnswersList.appendChild(item);
      });
    }

    if (detailModal) {
      detailModal.classList.remove('hidden', 'pointer-events-none');
      requestAnimationFrame(() => detailModal.classList.remove('opacity-0'));
    }
  }

  function closeDetailModal() {
    if (detailModal) {
      detailModal.classList.add('opacity-0');
      setTimeout(() => detailModal.classList.add('hidden', 'pointer-events-none'), 300);
    }
    currentActiveSubmissionId = null;
  }

  function deleteSubmission(id) {
    if (!confirm('Are you sure you want to delete this submission record?')) return;

    submissions = submissions.filter(s => s.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    } catch (e) { }

    if (currentActiveSubmissionId === id) {
      closeDetailModal();
    }
    renderDashboard();
  }

  function clearAllSubmissions() {
    if (!confirm('Are you sure you want to CLEAR ALL quiz submissions? This action cannot be undone.')) return;

    submissions = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { }

    renderDashboard();
  }

  // Export CSV
  function exportCSV() {
    if (submissions.length === 0) {
      alert('No submission data available to export.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Submission ID,User Name,Submitted At,Status,Q1 Emoji,Q2 Movie Genre,Q3 One Word,Q4 First Angry,Q5 No Message,Q6 Surprise Reaction,Q7 Forget Birthday,Q8 Extra Turn\n';

    submissions.forEach(s => {
      const getAns = (qId) => {
        const found = (s.answers || []).find(a => a.questionId === qId);
        return found ? `"${found.answer.replace(/"/g, '""')}"` : '""';
      };

      const row = [
        `"${s.id}"`,
        `"${s.userName || 'Shobana'}"`,
        `"${formatDate(new Date(s.submittedAt))}"`,
        `"${s.completed ? 'Completed' : 'In Progress'}"`,
        getAns(1),
        getAns(2),
        getAns(3),
        getAns(4),
        getAns(5),
        getAns(6),
        getAns(7),
        getAns(8)
      ].join(',');

      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quiz_submissions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export JSON
  function exportJSON() {
    if (submissions.length === 0) {
      alert('No submission data available to export.');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(submissions, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `quiz_submissions_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Setup Event Listeners
  function setupEventListeners() {
    if (searchInput) searchInput.addEventListener('input', renderFilteredSubmissions);
    if (questionFilter) questionFilter.addEventListener('change', renderFilteredSubmissions);
    if (statusFilter) statusFilter.addEventListener('change', renderFilteredSubmissions);

    if (refreshBtn) refreshBtn.addEventListener('click', loadSubmissions);
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportCSV);
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);
    if (clearBtn) clearBtn.addEventListener('click', clearAllSubmissions);
    if (lockBtn) lockBtn.addEventListener('click', lockDashboard);

    if (sampleDataBtn) sampleDataBtn.addEventListener('click', () => {
      generateSampleSubmissions();
      loadSubmissions();
    });
    if (emptySampleBtn) emptySampleBtn.addEventListener('click', () => {
      generateSampleSubmissions();
      loadSubmissions();
    });

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDetailModal);
    if (modalDeleteBtn) modalDeleteBtn.addEventListener('click', () => {
      if (currentActiveSubmissionId) deleteSubmission(currentActiveSubmissionId);
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && detailModal && !detailModal.classList.contains('hidden')) {
        closeDetailModal();
      }
    });
  }

  // Helper Utilities
  function formatDate(d) {
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
