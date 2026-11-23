/* =========================================================
   daily-health-tip.js
   Fully isolated logic for daily-health-tips.html.
   - Does not touch script.js or any of its globals.
   - No-ops immediately if the page's hero card isn't present.
   - Local tip data lives at the top of this file so it's easy
     to edit later.
   ========================================================= */
(function () {
  'use strict';

  var heroCard = document.getElementById('dhtHero');
  if (!heroCard) return; // Not on the Daily Health Tips page — do nothing.

  /* ---------------------------------------------------
     TIP DATA — edit this list to add/change tips.
     Each tip: { category, title, description, icon, color }
     `icon` is a Font Awesome 6 class already used elsewhere
     in the project. `color` picks one of the soft accent
     palettes defined in daily-health-tip.css (dht-c-*).
  --------------------------------------------------- */
  var TIPS = [
    {
      category: 'Hydration',
      title: 'Stay Hydrated',
      description: 'Drinking enough clean water throughout the day helps support energy, concentration and overall wellbeing.',
      icon: 'fa-droplet',
      color: 'blue'
    },
    {
      category: 'Sleep',
      title: 'Prioritize Quality Sleep',
      description: 'Consistent, restful sleep supports memory, mood and your body\u2019s natural repair processes.',
      icon: 'fa-bed',
      color: 'purple'
    },
    {
      category: 'Nutrition',
      title: 'Eat a Balanced Diet',
      description: 'Including a mix of fruits, vegetables, whole grains and protein helps your body get the nutrients it needs.',
      icon: 'fa-utensils',
      color: 'green'
    },
    {
      category: 'Physical Activity',
      title: 'Move Throughout the Day',
      description: 'Regular movement, even short walks, supports heart health, energy and long-term wellbeing.',
      icon: 'fa-person-running',
      color: 'amber'
    },
    {
      category: 'Hand Hygiene',
      title: 'Wash Your Hands Often',
      description: 'Regular handwashing is one of the simplest ways to reduce the spread of common infections.',
      icon: 'fa-hand-sparkles',
      color: 'teal'
    },
    {
      category: 'Mental Wellbeing',
      title: 'Take Time to Recharge',
      description: 'Short breaks and mindful moments during the day can help reduce stress and improve focus.',
      icon: 'fa-brain',
      color: 'purple'
    },
    {
      category: 'Preventive Healthcare',
      title: 'Keep Up with Checkups',
      description: 'Routine checkups can help catch potential health concerns early, when they\u2019re often easier to manage.',
      icon: 'fa-shield-heart',
      color: 'teal'
    },
    {
      category: 'Healthy Screen Habits',
      title: 'Take Screen Breaks',
      description: 'Stepping away from screens periodically can ease eye strain and give your body a chance to reset.',
      icon: 'fa-mobile-screen',
      color: 'indigo'
    },
    {
      category: 'Sun Protection',
      title: 'Protect Your Skin Outdoors',
      description: 'Simple habits like sunscreen and seeking shade can help protect your skin during sun exposure.',
      icon: 'fa-sun',
      color: 'orange'
    },
    {
      category: 'Balanced Meals',
      title: 'Plan Balanced Meals',
      description: 'Thoughtfully planned meals can help maintain steady energy and support overall nutrition.',
      icon: 'fa-bowl-food',
      color: 'green'
    }
  ];

  var ALL_COLORS = ['blue', 'green', 'amber', 'teal', 'purple', 'indigo', 'orange'];
  var COLOR_PREFIX = 'dht-c-';

  /* ---------------------------------------------------
     Deterministic "today's tip" index — based on the
     calendar day, never Math.random(). Same day always
     resolves to the same index; the index only changes
     when the date changes.
  --------------------------------------------------- */
  function getTodayIndex() {
    var now = new Date();
    var startOfYear = new Date(now.getFullYear(), 0, 0);
    var diffMs = now - startOfYear;
    var oneDayMs = 1000 * 60 * 60 * 24;
    var dayOfYear = Math.floor(diffMs / oneDayMs);
    return dayOfYear % TIPS.length;
  }

  var todayIndex = getTodayIndex();
  var viewIndex = todayIndex; // "Next/Previous Tip" browse without changing the day's default

  /* ---------------------------------------------------
     Element references
  --------------------------------------------------- */
  var els = {
    hero: heroCard,
    icon: document.getElementById('dhtIcon'),
    category: document.getElementById('dhtCategory'),
    title: document.getElementById('dhtTitle'),
    description: document.getElementById('dhtDescription'),
    counter: document.getElementById('dhtCounter'),
    prevBtn: document.getElementById('dhtPrevBtn'),
    nextBtn: document.getElementById('dhtNextBtn'),
    libraryGrid: document.getElementById('dhtLibraryGrid')
  };

  function setColorClass(el, color) {
    if (!el) return;
    ALL_COLORS.forEach(function (c) { el.classList.remove(COLOR_PREFIX + c); });
    el.classList.add(COLOR_PREFIX + color);
  }

  /* ---------------------------------------------------
     Render the hero ("Today's Health Tip") card
  --------------------------------------------------- */
  function applyTip(index) {
    var tip = TIPS[index];
    if (!tip) return;

    if (els.icon) {
      els.icon.innerHTML = '<i class="fa-solid ' + tip.icon + '" aria-hidden="true"></i>';
      setColorClass(els.icon, tip.color);
    }
    if (els.category) {
      els.category.textContent = tip.category;
      setColorClass(els.category, tip.color);
    }
    if (els.title) els.title.textContent = tip.title;
    if (els.description) els.description.textContent = tip.description;
    if (els.counter) els.counter.textContent = 'Tip ' + (index + 1) + ' of ' + TIPS.length;

    if (els.prevBtn) els.prevBtn.disabled = false;
    if (els.nextBtn) els.nextBtn.disabled = false;

    if (els.libraryGrid) {
      var cards = els.libraryGrid.querySelectorAll('.dht-tip-card');
      cards.forEach(function (card) {
        card.classList.toggle('is-active', parseInt(card.dataset.index, 10) === index);
      });
    }
  }

  function renderTip(index, animate) {
    if (animate && els.hero) {
      els.hero.classList.add('dht-fade');
      window.setTimeout(function () {
        applyTip(index);
        els.hero.classList.remove('dht-fade');
      }, 160);
    } else {
      applyTip(index);
    }
  }

  function goTo(index, animate) {
    var len = TIPS.length;
    viewIndex = ((index % len) + len) % len;
    renderTip(viewIndex, animate);
  }

  /* ---------------------------------------------------
     Next / Previous Tip — browsing only, no page reload,
     no URL change, no effect on any other component.
  --------------------------------------------------- */
  if (els.nextBtn) {
    els.nextBtn.addEventListener('click', function () { goTo(viewIndex + 1, true); });
  }
  if (els.prevBtn) {
    els.prevBtn.addEventListener('click', function () { goTo(viewIndex - 1, true); });
  }

  /* ---------------------------------------------------
     "Explore Health Tips" library — click a card to view
     that tip as the main tip.
  --------------------------------------------------- */
  function renderLibrary() {
    if (!els.libraryGrid) return;

    var markup = TIPS.map(function (tip, i) {
      return (
        '<button type="button" class="dht-tip-card" data-index="' + i + '" aria-label="View tip: ' + tip.title + '">' +
          '<span class="dht-tip-card-icon ' + COLOR_PREFIX + tip.color + '"><i class="fa-solid ' + tip.icon + '" aria-hidden="true"></i></span>' +
          '<span class="dht-tip-card-category ' + COLOR_PREFIX + tip.color + '">' + tip.category + '</span>' +
          '<h4>' + tip.title + '</h4>' +
          '<p>' + tip.description + '</p>' +
        '</button>'
      );
    }).join('');

    els.libraryGrid.innerHTML = markup;

    els.libraryGrid.querySelectorAll('.dht-tip-card').forEach(function (card) {
      card.addEventListener('click', function () {
        goTo(parseInt(card.dataset.index, 10), true);
        els.hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ---------------------------------------------------
     Init
  --------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    renderLibrary();
    renderTip(todayIndex, false);
  });
})();
