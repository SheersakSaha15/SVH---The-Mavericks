/* =========================================================
   disease-awareness.js
   Fully isolated logic for disease-awareness.html.
   - Does not touch script.js or any of its globals.
   - No-ops immediately if the page's disease grid isn't present.
   - All disease data lives at the top of this file so it's
     easy to edit later. These are general educational summaries,
     not medical guidance for any individual.
   ========================================================= */
(function () {
  'use strict';

  var gridEl = document.getElementById('daGrid');
  if (!gridEl) return; // Not on the Disease Awareness page — do nothing.

  /* ---------------------------------------------------
     DISEASE DATA — edit this array to add, remove, or
     change diseases. Each entry:
     {
       id, name, category, icon, color,
       description,
       symptoms: [...],
       warningSigns: [...],
       prevention: [...],
       howItSpreads,
       whenToSeekHelp
     }
     `icon` is a Font Awesome 6 class. `color` selects one of
     the da-c-* accent palettes defined in disease-awareness.css.
     The Dengue entry doubles as the page's Featured Health Topic.
  --------------------------------------------------- */
  var DISEASES = [
    {
      id: 'dengue',
      name: 'Dengue',
      category: 'Vector-Borne',
      icon: 'fa-mosquito',
      color: 'green',
      description: 'Dengue is a mosquito-borne viral infection that causes flu-like illness and, in severe cases, can lead to serious complications.',
      symptoms: ['High fever', 'Severe headache', 'Pain behind eyes', 'Muscle & joint pain', 'Nausea, vomiting'],
      warningSigns: ['Severe abdominal pain', 'Persistent vomiting', 'Bleeding (nose/gums)', 'Difficulty breathing', 'Extreme weakness'],
      prevention: ['Remove stagnant water', 'Use mosquito repellents', 'Wear full-sleeve clothes', 'Use mosquito nets', 'Keep surroundings clean'],
      howItSpreads: 'Spreads through the bite of infected Aedes mosquitoes, which typically breed in stagnant water around homes and are most active during the day.',
      whenToSeekHelp: 'Seek medical attention promptly if fever is accompanied by severe abdominal pain, persistent vomiting, bleeding, or difficulty breathing.'
    },
    {
      id: 'malaria',
      name: 'Malaria',
      category: 'Vector-Borne',
      icon: 'fa-mosquito',
      color: 'pink',
      description: 'Mosquito-borne disease that affects the blood and causes fever and chills.',
      symptoms: ['High fever with chills', 'Sweating', 'Headache', 'Fatigue', 'Muscle aches'],
      warningSigns: ['Confusion or drowsiness', 'Difficulty breathing', 'Repeated vomiting', 'Very high fever', 'Seizures'],
      prevention: ['Use insecticide-treated bed nets', 'Use mosquito repellents', 'Cover skin at dusk and dawn', 'Eliminate standing water', 'Take preventive medication if advised'],
      howItSpreads: 'Spreads through the bite of infected female Anopheles mosquitoes, mainly active between dusk and dawn.',
      whenToSeekHelp: 'Seek medical care promptly for high fever with chills, especially after travel to an at-risk area, or if confusion or repeated vomiting develop.'
    },
    {
      id: 'chikungunya',
      name: 'Chikungunya',
      category: 'Vector-Borne',
      icon: 'fa-mosquito',
      color: 'amber',
      description: 'Causes fever and severe joint pain. Spread by infected mosquitoes.',
      symptoms: ['Sudden fever', 'Severe joint pain', 'Muscle pain', 'Headache', 'Skin rash'],
      warningSigns: ['Joint pain lasting several weeks', 'Severe swelling of joints', 'High persistent fever', 'Signs of dehydration'],
      prevention: ['Remove stagnant water', 'Use mosquito repellents', 'Install window and door screens', 'Wear protective clothing'],
      howItSpreads: 'Spreads through the bite of infected Aedes mosquitoes, the same species that spreads dengue.',
      whenToSeekHelp: 'Consult a healthcare professional if joint pain is severe or persists beyond a few days, or if fever is high and prolonged.'
    },
    {
      id: 'cholera',
      name: 'Cholera',
      category: 'Water-Borne',
      icon: 'fa-droplet',
      color: 'blue',
      description: 'Bacterial infection causing severe diarrhea and dehydration.',
      symptoms: ['Sudden watery diarrhea', 'Vomiting', 'Leg cramps', 'Rapid heart rate', 'Dry mouth'],
      warningSigns: ['Signs of severe dehydration', 'Sunken eyes', 'Little or no urination', 'Extreme thirst', 'Lethargy or unconsciousness'],
      prevention: ['Drink boiled or treated water', 'Wash hands with soap frequently', 'Avoid raw or undercooked food', 'Practice safe food handling'],
      howItSpreads: 'Spreads mainly through water or food contaminated with the bacterium, often linked to inadequate sanitation.',
      whenToSeekHelp: 'Seek medical care promptly for persistent watery diarrhea or vomiting, especially in young children or older adults.'
    },
    {
      id: 'typhoid',
      name: 'Typhoid',
      category: 'Water-Borne',
      icon: 'fa-bacterium',
      color: 'purple',
      description: 'Causes prolonged fever, weakness, and stomach discomfort.',
      symptoms: ['Prolonged high fever', 'Weakness and fatigue', 'Stomach pain', 'Headache', 'Loss of appetite'],
      warningSigns: ['Persistent high fever beyond a few days', 'Severe abdominal pain', 'Confusion', 'Blood in stool'],
      prevention: ['Drink safe, treated water', 'Eat freshly cooked food', 'Wash hands before eating', 'Consider vaccination where recommended'],
      howItSpreads: 'Spreads through food or water contaminated with the bacterium, often linked to poor sanitation.',
      whenToSeekHelp: 'Consult a healthcare professional for fever lasting more than a few days, especially with worsening abdominal pain or weakness.'
    },
    {
      id: 'influenza',
      name: 'Influenza (Flu)',
      category: 'Respiratory',
      icon: 'fa-lungs',
      color: 'blue',
      description: 'Viral infection that affects the respiratory system causing flu-like symptoms.',
      symptoms: ['Fever', 'Cough', 'Sore throat', 'Body aches', 'Fatigue'],
      warningSigns: ['Difficulty breathing', 'Chest pain or pressure', 'Persistent high fever', 'Severe weakness'],
      prevention: ['Get an annual flu vaccine', 'Wash hands regularly', 'Cover coughs and sneezes', 'Avoid close contact when unwell'],
      howItSpreads: 'Spreads mainly through droplets released when an infected person coughs, sneezes, or talks.',
      whenToSeekHelp: 'Seek medical care if breathing becomes difficult, symptoms worsen after initially improving, or fever is high and persistent.'
    },
    {
      id: 'tuberculosis',
      name: 'Tuberculosis',
      category: 'Respiratory',
      icon: 'fa-lungs',
      color: 'pink',
      description: 'Bacterial infection that mainly affects the lungs and spreads in the air.',
      symptoms: ['Persistent cough (3+ weeks)', 'Coughing up blood', 'Chest pain', 'Weight loss', 'Night sweats'],
      warningSigns: ['Coughing up blood', 'Severe difficulty breathing', 'Ongoing high fever', 'Significant unexplained weight loss'],
      prevention: ['Complete full treatment courses if diagnosed', 'Ensure good ventilation indoors', 'Cover mouth when coughing', 'Get screened if exposed'],
      howItSpreads: 'Spreads through the air when a person with active TB disease coughs, speaks, or sneezes.',
      whenToSeekHelp: 'See a healthcare professional for a cough lasting more than three weeks, especially with blood, weight loss, or night sweats.'
    },
    {
      id: 'covid-19',
      name: 'COVID-19',
      category: 'Viral',
      icon: 'fa-virus-covid',
      color: 'green',
      description: 'Respiratory illness caused by SARS-CoV-2 virus. Fever, cough, fatigue.',
      symptoms: ['Fever or chills', 'Cough', 'Fatigue', 'Loss of taste or smell', 'Sore throat'],
      warningSigns: ['Difficulty breathing', 'Persistent chest pain', 'Confusion', 'Bluish lips or face'],
      prevention: ['Stay up to date on recommended vaccines', 'Wash hands regularly', 'Improve indoor ventilation', 'Stay home when unwell'],
      howItSpreads: 'Spreads mainly through respiratory droplets and close contact with an infected person.',
      whenToSeekHelp: 'Seek urgent care for difficulty breathing, persistent chest pain, confusion, or bluish lips or face.'
    },
    {
      id: 'hepatitis',
      name: 'Hepatitis',
      category: 'Viral',
      icon: 'fa-disease',
      color: 'orange',
      description: 'Liver inflammation caused by viruses. Can cause jaundice and fatigue.',
      symptoms: ['Fatigue', 'Yellowing of skin or eyes', 'Dark urine', 'Abdominal discomfort', 'Loss of appetite'],
      warningSigns: ['Severe jaundice', 'Confusion', 'Persistent vomiting', 'Swelling of the abdomen'],
      prevention: ['Get vaccinated where available', 'Practice safe food and water hygiene', 'Avoid sharing needles or personal items', 'Practice safe practices with bodily fluids'],
      howItSpreads: 'Spreads differently by type — some forms through contaminated food or water, others through contact with infected blood or bodily fluids.',
      whenToSeekHelp: 'Consult a healthcare professional for yellowing of the skin or eyes, persistent fatigue, or abdominal discomfort.'
    },
    {
      id: 'diabetes',
      name: 'Diabetes',
      category: 'Lifestyle',
      icon: 'fa-gauge-high',
      color: 'blue',
      description: 'Chronic condition affecting blood sugar levels and overall health.',
      symptoms: ['Increased thirst', 'Frequent urination', 'Fatigue', 'Blurred vision', 'Slow-healing wounds'],
      warningSigns: ['Extreme thirst with confusion', 'Rapid breathing', 'Fruity-smelling breath', 'Loss of consciousness'],
      prevention: ['Maintain a balanced diet', 'Stay physically active', 'Maintain a healthy weight', 'Get regular checkups'],
      howItSpreads: 'Not contagious. Risk is influenced by genetics, weight, activity level, and diet.',
      whenToSeekHelp: 'Consult a healthcare professional for persistent thirst, frequent urination, or unexplained fatigue; seek urgent care for confusion or rapid breathing.'
    },
    {
      id: 'hypertension',
      name: 'Hypertension',
      category: 'Lifestyle',
      icon: 'fa-heart-circle-exclamation',
      color: 'red',
      description: 'Chronic high blood pressure that can strain the heart and blood vessels over time.',
      symptoms: ['Often no symptoms', 'Occasional headaches', 'Shortness of breath', 'Dizziness'],
      warningSigns: ['Severe headache with vision changes', 'Chest pain', 'Difficulty breathing', 'Sudden confusion or weakness'],
      prevention: ['Reduce salt intake', 'Stay physically active', 'Maintain a healthy weight', 'Limit alcohol', 'Get blood pressure checked regularly'],
      howItSpreads: 'Not contagious. Risk is influenced by diet, activity level, weight, stress, and family history.',
      whenToSeekHelp: 'Seek urgent care for a severe headache with vision changes, chest pain, difficulty breathing, or sudden confusion or weakness.'
    }
  ];

  var FEATURED_ID = 'dengue';
  var CATEGORIES = ['All', 'Vector-Borne', 'Water-Borne', 'Respiratory', 'Viral', 'Lifestyle', 'Other'];

  /* ---------------------------------------------------
     Element references
  --------------------------------------------------- */
  var els = {
    grid: gridEl,
    empty: document.getElementById('daEmpty'),
    searchInput: document.getElementById('daSearchInput'),
    searchClear: document.getElementById('daSearchClear'),
    filterBar: document.getElementById('daFilterBar'),
    sortSelect: document.getElementById('daSortSelect'),
    featuredIcon: document.getElementById('daFeaturedIcon'),
    featuredTitle: document.getElementById('daFeaturedTitle'),
    featuredDesc: document.getElementById('daFeaturedDesc'),
    featuredSymptoms: document.getElementById('daFeaturedSymptoms'),
    featuredPrevention: document.getElementById('daFeaturedPrevention'),
    featuredWarning: document.getElementById('daFeaturedWarning'),
    featuredLearnMore: document.getElementById('daFeaturedLearnMore'),
    modalOverlay: document.getElementById('daModalOverlay'),
    modal: document.getElementById('daModal'),
    modalIcon: document.getElementById('daModalIcon'),
    modalTitle: document.getElementById('daModalTitle'),
    modalCategory: document.getElementById('daModalCategory'),
    modalOverview: document.getElementById('daModalOverview'),
    modalSymptoms: document.getElementById('daModalSymptoms'),
    modalWarning: document.getElementById('daModalWarning'),
    modalSpreads: document.getElementById('daModalSpreads'),
    modalPrevention: document.getElementById('daModalPrevention'),
    modalSeekHelp: document.getElementById('daModalSeekHelp'),
    modalClose: document.getElementById('daModalClose')
  };

  var state = { search: '', category: 'All', sort: 'az' };
  var lastFocusedEl = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function findDisease(id) {
    for (var i = 0; i < DISEASES.length; i++) {
      if (DISEASES[i].id === id) return DISEASES[i];
    }
    return null;
  }

  /* ---------------------------------------------------
     Featured Health Topic
  --------------------------------------------------- */
  function renderFeatured() {
    var d = findDisease(FEATURED_ID);
    if (!d) return;

    if (els.featuredIcon) els.featuredIcon.innerHTML = '<i class="fa-solid ' + d.icon + '" aria-hidden="true"></i>';
    if (els.featuredTitle) els.featuredTitle.textContent = d.name;
    if (els.featuredDesc) els.featuredDesc.textContent = d.description;

    if (els.featuredSymptoms) {
      els.featuredSymptoms.innerHTML = d.symptoms.map(function (s) {
        return '<li>' + escapeHtml(s) + '</li>';
      }).join('');
    }
    if (els.featuredPrevention) {
      els.featuredPrevention.innerHTML = d.prevention.map(function (p) {
        return '<li><i class="fa-solid fa-circle-check" aria-hidden="true"></i>' + escapeHtml(p) + '</li>';
      }).join('');
    }
    if (els.featuredWarning) {
      els.featuredWarning.innerHTML = d.warningSigns.map(function (w) {
        return '<li><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>' + escapeHtml(w) + '</li>';
      }).join('');
    }
    if (els.featuredLearnMore) {
      els.featuredLearnMore.addEventListener('click', function () { openModal(d.id); });
    }
  }

  /* ---------------------------------------------------
     Disease Library — filter, search, sort, render
  --------------------------------------------------- */
  function matchesFilters(d) {
    if (state.category !== 'All' && d.category !== state.category) return false;
    if (state.search) {
      var haystack = (
        d.name + ' ' + d.category + ' ' + d.description + ' ' + d.symptoms.join(' ')
      ).toLowerCase();
      if (haystack.indexOf(state.search.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function getVisibleDiseases() {
    var visible = DISEASES.filter(matchesFilters);
    visible.sort(function (a, b) {
      return state.sort === 'za' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
    });
    return visible;
  }

  function renderCard(d) {
    return (
      '<button type="button" class="da-card" data-id="' + d.id + '" aria-label="Learn more about ' + escapeHtml(d.name) + '">' +
        '<span class="da-card-icon da-c-' + d.color + '"><i class="fa-solid ' + d.icon + '" aria-hidden="true"></i></span>' +
        '<h4>' + escapeHtml(d.name) + '</h4>' +
        '<span class="da-card-category da-c-' + d.color + '">' + escapeHtml(d.category) + '</span>' +
        '<p>' + escapeHtml(d.description) + '</p>' +
        '<span class="da-card-link">Learn More <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>' +
      '</button>'
    );
  }

  function renderGrid() {
    var visible = getVisibleDiseases();

    if (visible.length === 0) {
      els.grid.innerHTML = '';
      els.grid.hidden = true;
      if (els.empty) els.empty.hidden = false;
      return;
    }

    els.grid.hidden = false;
    if (els.empty) els.empty.hidden = true;
    els.grid.innerHTML = visible.map(renderCard).join('');

    els.grid.querySelectorAll('.da-card').forEach(function (card) {
      card.addEventListener('click', function () { openModal(card.dataset.id); });
    });
  }

  /* ---------------------------------------------------
     Filter bar / search / sort wiring
  --------------------------------------------------- */
  function renderFilterBar() {
    if (!els.filterBar) return;
    els.filterBar.innerHTML = CATEGORIES.map(function (cat) {
      var isActive = cat === state.category;
      return '<button type="button" class="da-filter-chip' + (isActive ? ' da-is-active' : '') + '" data-category="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</button>';
    }).join('');

    els.filterBar.querySelectorAll('.da-filter-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.category = chip.dataset.category;
        renderFilterBar();
        renderGrid();
      });
    });
  }

  if (els.searchInput) {
    els.searchInput.addEventListener('input', function () {
      state.search = els.searchInput.value.trim();
      if (els.searchClear) els.searchClear.hidden = state.search.length === 0;
      renderGrid();
    });
  }
  if (els.searchClear) {
    els.searchClear.addEventListener('click', function () {
      state.search = '';
      if (els.searchInput) els.searchInput.value = '';
      els.searchClear.hidden = true;
      renderGrid();
      if (els.searchInput) els.searchInput.focus();
    });
  }
  if (els.sortSelect) {
    els.sortSelect.addEventListener('change', function () {
      state.sort = els.sortSelect.value;
      renderGrid();
    });
  }

  /* ---------------------------------------------------
     Modal — Learn More detail panel
  --------------------------------------------------- */
  function renderList(el, items, iconClass) {
    if (!el) return;
    el.innerHTML = items.map(function (item) {
      var iconHtml = iconClass ? '<i class="fa-solid ' + iconClass + '" aria-hidden="true"></i> ' : '';
      return '<li>' + iconHtml + escapeHtml(item) + '</li>';
    }).join('');
  }

  function openModal(id) {
    var d = findDisease(id);
    if (!d || !els.modalOverlay) return;

    if (els.modalIcon) els.modalIcon.innerHTML = '<i class="fa-solid ' + d.icon + '" aria-hidden="true"></i>';
    if (els.modalIcon) {
      els.modalIcon.className = 'da-modal-icon da-c-' + d.color;
    }
    if (els.modalTitle) els.modalTitle.textContent = d.name;
    if (els.modalCategory) {
      els.modalCategory.textContent = d.category;
      els.modalCategory.className = 'da-card-category da-c-' + d.color;
    }
    if (els.modalOverview) els.modalOverview.textContent = d.description;
    renderList(els.modalSymptoms, d.symptoms);
    renderList(els.modalWarning, d.warningSigns);
    if (els.modalSpreads) els.modalSpreads.textContent = d.howItSpreads;
    renderList(els.modalPrevention, d.prevention);
    if (els.modalSeekHelp) els.modalSeekHelp.textContent = d.whenToSeekHelp;

    lastFocusedEl = document.activeElement;
    els.modalOverlay.hidden = false;
    // Force reflow so the transition runs, then trigger it.
    void els.modalOverlay.offsetWidth;
    els.modalOverlay.classList.add('da-is-open');
    document.body.style.overflow = 'hidden';
    if (els.modalClose) els.modalClose.focus();
  }

  function closeModal() {
    if (!els.modalOverlay || els.modalOverlay.hidden) return;
    els.modalOverlay.classList.remove('da-is-open');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      els.modalOverlay.hidden = true;
    }, 220);
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
  }

  if (els.modalClose) els.modalClose.addEventListener('click', closeModal);
  if (els.modalOverlay) {
    els.modalOverlay.addEventListener('click', function (e) {
      if (e.target === els.modalOverlay) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && els.modalOverlay && !els.modalOverlay.hidden) closeModal();
  });

  /* ---------------------------------------------------
     Init
  --------------------------------------------------- */
  function init() {
    renderFeatured();
    renderFilterBar();
    renderGrid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
