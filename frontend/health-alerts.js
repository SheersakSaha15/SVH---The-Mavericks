/* =========================================================
   health-alerts.js
   Fully isolated logic for health-alerts.html.
   - Does not touch script.js or any of its globals (other
     than the pre-existing window.showToast helper, which
     script.js already exposes intentionally for reuse).
   - No-ops immediately if the page's alert list isn't present.
   - Prototype alert data lives at the top of this file so
     it's easy to edit later. These are demo values only —
     not real-time or verified public health statistics.
   ========================================================= */
(function () {
  'use strict';

  var listEl = document.getElementById('haAlertList');
  if (!listEl) return; // Not on the Health Alerts page — do nothing.

  /* ---------------------------------------------------
     ALERT DATA — prototype/demo only. Edit this array to
     add, remove, or change alerts. Each object:
     {
       id, title, severity ("high"|"medium"|"low"), category,
       location, date, description, precautions[],
       whatIsHappening, whoAtRisk, warningSigns[],
       whenToSeekHelp, source, icon
     }
  --------------------------------------------------- */
  var ALERTS = [
    {
      id: 'dengue-khordha',
      title: 'Dengue Outbreak',
      severity: 'high',
      category: 'Disease Outbreak',
      location: 'Khordha District, Odisha',
      date: '28 Aug 2026',
      icon: 'fa-mosquito',
      description: 'Local health authorities have reported a rise in dengue cases over the past week, linked to mosquito breeding after recent rainfall.',
      precautions: [
        'Use mosquito repellent, especially at dawn and dusk',
        'Remove standing water around your home',
        'Use mosquito nets or screens while sleeping'
      ],
      whatIsHappening: 'District health officials have recorded an increase in confirmed dengue cases compared to the previous month, most concentrated in areas with standing water after recent rains.',
      whoAtRisk: 'Anyone living in or visiting affected areas, particularly people who spend time outdoors during early morning or evening hours when mosquitoes are most active.',
      warningSigns: [
        'High fever with severe headache',
        'Pain behind the eyes',
        'Joint and muscle pain',
        'Skin rash',
        'Unusual bleeding or bruising'
      ],
      whenToSeekHelp: 'Seek medical attention promptly if fever is accompanied by severe abdominal pain, persistent vomiting, bleeding, or difficulty breathing.',
      source: 'Public Health Advisory · District Health Office'
    },
    {
      id: 'cholera-ganjam',
      title: 'Cholera Warning',
      severity: 'medium',
      category: 'Public Health Advisory',
      location: 'Ganjam District, Odisha',
      date: '27 Aug 2026',
      icon: 'fa-droplet',
      description: 'Water contamination has been reported in some areas of the district. Residents are advised to take precautions with drinking water.',
      precautions: [
        'Boil drinking water before use',
        'Avoid raw or undercooked food from unverified sources',
        'Wash hands frequently with soap'
      ],
      whatIsHappening: 'Local water testing identified contamination in a limited number of sources within the district, raising the risk of waterborne illness in nearby communities.',
      whoAtRisk: 'Residents relying on the affected water sources, and anyone consuming untreated water or food washed with untreated water in the area.',
      warningSigns: [
        'Sudden watery diarrhea',
        'Vomiting',
        'Signs of dehydration (dry mouth, low urination, dizziness)'
      ],
      whenToSeekHelp: 'Seek medical care promptly for persistent diarrhea or vomiting, especially in young children, older adults, or anyone showing signs of dehydration.',
      source: 'Public Health Advisory · District Health Office'
    },
    {
      id: 'seasonal-fever-bbsr',
      title: 'Seasonal Fever Advisory',
      severity: 'low',
      category: 'Seasonal',
      location: 'Bhubaneswar, Odisha',
      date: '25 Aug 2026',
      icon: 'fa-temperature-high',
      description: 'A general increase in seasonal fever and cold-like symptoms has been observed with the current change in weather.',
      precautions: [
        'Stay hydrated and rest when unwell',
        'Maintain good hand hygiene',
        'Avoid close contact with others while symptomatic'
      ],
      whatIsHappening: 'Clinics in the area are seeing a modest seasonal rise in fever, cold, and cough cases, consistent with the current change in weather.',
      whoAtRisk: 'Generally mild and common across all age groups, though young children, older adults, and people with existing health conditions may be more affected.',
      warningSigns: [
        'Fever lasting more than 3 days',
        'Difficulty breathing',
        'Persistent chest pain or pressure'
      ],
      whenToSeekHelp: 'Consult a healthcare professional if fever is high or prolonged, or if breathing difficulty or chest discomfort develops.',
      source: 'Seasonal Health Advisory · HealthBridge AI'
    }
  ];

  var SEVERITY_LABEL = { high: 'High Risk', medium: 'Medium Risk', low: 'Low Risk' };

  /* ---------------------------------------------------
     Element references
  --------------------------------------------------- */
  var els = {
    list: listEl,
    noResults: document.getElementById('haNoResults'),
    searchInput: document.getElementById('haSearchInput'),
    severityFilters: document.getElementById('haSeverityFilters'),
    categorySelect: document.getElementById('haCategorySelect')
  };

  var state = {
    search: '',
    severity: 'all',
    category: 'all',
    expandedId: null
  };

  /* ---------------------------------------------------
     Rendering
  --------------------------------------------------- */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderPrecautionsList(items) {
    return items.map(function (p) { return '<li>' + escapeHtml(p) + '</li>'; }).join('');
  }

  function renderAlertCard(alert) {
    var isExpanded = state.expandedId === alert.id;
    var detailsId = 'haDetails-' + alert.id;

    return (
      '<article class="ha-alert-card ha-sev-' + alert.severity + '" data-id="' + alert.id + '" data-severity="' + alert.severity + '" data-category="' + escapeHtml(alert.category) + '">' +
        '<div class="ha-alert-main">' +
          '<div class="ha-alert-icon"><i class="fa-solid ' + alert.icon + '" aria-hidden="true"></i></div>' +
          '<div class="ha-alert-body">' +
            '<div class="ha-alert-top">' +
              '<h4>' + escapeHtml(alert.title) + '</h4>' +
              '<span class="ha-severity-badge ha-badge-' + alert.severity + '">' + SEVERITY_LABEL[alert.severity] + '</span>' +
            '</div>' +
            '<p class="ha-alert-meta">' +
              '<span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ' + escapeHtml(alert.location) + '</span>' +
              '<span class="ha-meta-dot" aria-hidden="true">&bull;</span>' +
              '<span><i class="fa-regular fa-calendar" aria-hidden="true"></i> ' + escapeHtml(alert.date) + '</span>' +
            '</p>' +
            '<p class="ha-alert-desc">' + escapeHtml(alert.description) + '</p>' +
            '<div class="ha-alert-precautions">' +
              '<span class="ha-precautions-label">Recommended precautions</span>' +
              '<ul>' + renderPrecautionsList(alert.precautions) + '</ul>' +
            '</div>' +
            '<button type="button" class="ha-details-btn" data-details-toggle="' + alert.id + '" aria-expanded="' + isExpanded + '" aria-controls="' + detailsId + '">' +
              (isExpanded ? 'Hide Details' : 'View Details') + ' <i class="fa-solid fa-chevron-' + (isExpanded ? 'up' : 'down') + '" aria-hidden="true"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="ha-alert-details" id="' + detailsId + '"' + (isExpanded ? '' : ' hidden') + '>' +
          '<div class="ha-detail-block">' +
            '<h5>What is happening</h5>' +
            '<p>' + escapeHtml(alert.whatIsHappening) + '</p>' +
          '</div>' +
          '<div class="ha-detail-block">' +
            '<h5>Who may be at risk</h5>' +
            '<p>' + escapeHtml(alert.whoAtRisk) + '</p>' +
          '</div>' +
          '<div class="ha-detail-block">' +
            '<h5>Warning signs</h5>' +
            '<ul>' + renderPrecautionsList(alert.warningSigns) + '</ul>' +
          '</div>' +
          '<div class="ha-detail-block">' +
            '<h5>Recommended precautions</h5>' +
            '<ul>' + renderPrecautionsList(alert.precautions) + '</ul>' +
          '</div>' +
          '<div class="ha-detail-block">' +
            '<h5>When to seek medical help</h5>' +
            '<p>' + escapeHtml(alert.whenToSeekHelp) + '</p>' +
          '</div>' +
          '<p class="ha-detail-disclaimer"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> This information is for general awareness only and is not a medical diagnosis. Consult a healthcare professional for guidance specific to you.</p>' +
          '<span class="ha-detail-source"><i class="fa-solid fa-tag" aria-hidden="true"></i> ' + escapeHtml(alert.source) + '</span>' +
        '</div>' +
      '</article>'
    );
  }

  function matchesFilters(alert) {
    if (state.severity !== 'all' && alert.severity !== state.severity) return false;
    if (state.category !== 'all' && alert.category !== state.category) return false;
    if (state.search) {
      var haystack = (alert.title + ' ' + alert.location + ' ' + alert.description + ' ' + alert.category).toLowerCase();
      if (haystack.indexOf(state.search.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function render() {
    var visible = ALERTS.filter(matchesFilters);

    if (visible.length === 0) {
      els.list.innerHTML = '';
      if (els.noResults) els.noResults.hidden = false;
      return;
    }

    if (els.noResults) els.noResults.hidden = true;
    els.list.innerHTML = visible.map(renderAlertCard).join('');

    // Re-bind View Details toggles (innerHTML replace tears down old listeners)
    els.list.querySelectorAll('[data-details-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.detailsToggle;
        state.expandedId = state.expandedId === id ? null : id;
        render();
        if (state.expandedId === id) {
          var card = els.list.querySelector('.ha-alert-card[data-id="' + id + '"]');
          if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  }

  /* ---------------------------------------------------
     Filter bar wiring
  --------------------------------------------------- */
  if (els.searchInput) {
    els.searchInput.addEventListener('input', function () {
      state.search = els.searchInput.value.trim();
      render();
    });
  }

  if (els.severityFilters) {
    els.severityFilters.querySelectorAll('.ha-filter-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.severity = chip.dataset.severity;
        els.severityFilters.querySelectorAll('.ha-filter-chip').forEach(function (c) {
          c.classList.toggle('ha-is-active', c === chip);
        });
        render();
      });
    });
  }

  if (els.categorySelect) {
    els.categorySelect.addEventListener('change', function () {
      state.category = els.categorySelect.value;
      render();
    });
  }

  /* ---------------------------------------------------
     Init & Live Backend Integration
  --------------------------------------------------- */
  function fetchBackendAlerts() {
    fetch("http://localhost:8000/api/alerts?region=Khordha")
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (Array.isArray(data) && data.length > 0) {
          var liveAlerts = data.map(function(item) {
            return {
              id: item.id || 'alert-' + Math.random(),
              title: item.disease + ' Alert',
              severity: (item.severity || 'high').toLowerCase(),
              category: 'Disease Outbreak',
              location: item.region || 'Khordha District, Odisha',
              date: item.updated_at || 'Live Surveillance',
              icon: 'fa-triangle-exclamation',
              description: item.message,
              precautions: ['Follow government health advisories', 'Keep surroundings clean & dry'],
              whatIsHappening: item.message,
              whoAtRisk: 'Residents of ' + (item.region || 'the region'),
              warningSigns: ['High fever', 'Body pain'],
              whenToSeekHelp: 'Seek medical attention promptly if symptoms worsen.',
              source: item.source || 'Government Health Surveillance Feed'
            };
          });
          ALERTS = liveAlerts.concat(ALERTS);
          render();
        }
      })
      .catch(function(err) { console.warn("Live backend alerts fetch offline:", err); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      render();
      fetchBackendAlerts();
    });
  } else {
    render();
    fetchBackendAlerts();
  }
})();

