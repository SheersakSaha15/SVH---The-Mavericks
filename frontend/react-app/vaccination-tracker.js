/* =========================================================
   vaccination-tracker.js
   Fully isolated logic for vaccination-tracker.html.
   - Does not touch script.js or any of its globals (other
     than the pre-existing window.showToast helper, which
     script.js already exposes intentionally for reuse).
   - No-ops immediately if the page's root element isn't present.
   - Prototype vaccination data lives at the top of this file so
     it's easy to edit later. These are demo values only — not
     real medical records.
   ========================================================= */
(function () {
  'use strict';

  var pageRoot = document.querySelector('.vt-page');
  if (!pageRoot) return; // Not on the Vaccination Tracker page — do nothing.

  var STORAGE_KEY = 'healthbridge-vaccination-records';

  /* ---------------------------------------------------
     VACCINATION DATA — prototype/demo only. Edit this array
     to add, remove, or change records. Each object:
     {
       id, name, dose, type, manufacturer, date ("YYYY-MM-DD"),
       status ("completed" | "upcoming" | "overdue"),
       category ("Childhood" | "Adult" | "Travel" | "Others"),
       dueLabel (upcoming/overdue display text, optional)
     }
  --------------------------------------------------- */
  var BASE_VACCINATIONS = [
    {
      id: 'hpv-dose2',
      name: 'HPV Vaccine',
      dose: 'Dose 2',
      type: 'Human Papillomavirus Vaccine',
      manufacturer: 'Gardasil 9',
      date: '2025-06-20',
      status: 'upcoming',
      category: 'Adult',
      dueLabel: 'Due Soon'
    },
    {
      id: 'hepb-dose3',
      name: 'Hepatitis B',
      dose: 'Dose 3',
      type: 'Hepatitis B Vaccine',
      manufacturer: 'Engerix-B',
      date: '2025-07-12',
      status: 'upcoming',
      category: 'Childhood',
      dueLabel: 'In 22 days'
    },
    {
      id: 'flu-seasonal',
      name: 'Seasonal Influenza Vaccine',
      dose: 'Annual Dose',
      type: 'Influenza Vaccine',
      manufacturer: 'Seasonal flu shot',
      date: '2025-05-01',
      status: 'overdue',
      category: 'Others',
      dueLabel: 'Overdue'
    },
    {
      id: 'covid-booster',
      name: 'COVID-19 Vaccine',
      dose: 'Booster',
      type: 'Pfizer-BioNTech',
      manufacturer: 'Pfizer-BioNTech',
      date: '2025-01-15',
      status: 'completed',
      category: 'Adult'
    },
    {
      id: 'td-booster',
      name: 'Tetanus, Diphtheria (Td)',
      dose: 'Booster',
      type: 'Boostrix',
      manufacturer: 'Boostrix',
      date: '2024-09-10',
      status: 'completed',
      category: 'Adult'
    },
    {
      id: 'hepb-dose2',
      name: 'Hepatitis B',
      dose: 'Dose 2',
      type: 'Engerix-B',
      manufacturer: 'Engerix-B',
      date: '2024-01-10',
      status: 'completed',
      category: 'Childhood'
    },
    {
      id: 'mmr',
      name: 'MMR Vaccine',
      dose: 'Single Dose',
      type: 'M-M-R II',
      manufacturer: 'M-M-R II',
      date: '2023-08-12',
      status: 'completed',
      category: 'Childhood'
    },
    {
      id: 'hepb-dose1',
      name: 'Hepatitis B',
      dose: 'Dose 1',
      type: 'Engerix-B',
      manufacturer: 'Engerix-B',
      date: '2023-07-10',
      status: 'completed',
      category: 'Childhood'
    },
    {
      id: 'yellow-fever',
      name: 'Yellow Fever Vaccine',
      dose: 'Single Dose',
      type: 'Travel Vaccine',
      manufacturer: 'Stamaril',
      date: '2022-03-15',
      status: 'completed',
      category: 'Travel'
    }
  ];

  var CATEGORY_COLORS = {
    Childhood: 'var(--brand-teal)',
    Adult: '#8b5cf6',
    Travel: '#f97316',
    Others: 'var(--info)'
  };
  var CATEGORY_ORDER = ['Childhood', 'Adult', 'Travel', 'Others'];

  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  /* ---------------------------------------------------
     Persistence for user-added records
  --------------------------------------------------- */
  function loadCustomVaccinations() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  function saveCustomVaccinations(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      /* localStorage unavailable — data still works for this session */
    }
  }

  var customVaccinations = loadCustomVaccinations();

  function getAllVaccinations() {
    return BASE_VACCINATIONS.concat(customVaccinations);
  }

  function notify(message, icon) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, icon);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(isoDate) {
    var parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    var y = parts[0], m = parts[1], d = parts[2];
    var monthIdx = Number(m) - 1;
    if (monthIdx < 0 || monthIdx > 11) return isoDate;
    return Number(d) + ' ' + MONTH_NAMES[monthIdx].slice(0, 3) + ' ' + y;
  }

  /* ---------------------------------------------------
     Element references
  --------------------------------------------------- */
  var els = {
    statUptodate: document.getElementById('vtStatUptodate'),
    statUpcoming: document.getElementById('vtStatUpcoming'),
    statOverdue: document.getElementById('vtStatOverdue'),
    statTotal: document.getElementById('vtStatTotal'),

    upcomingList: document.getElementById('vtUpcomingList'),
    historyList: document.getElementById('vtHistoryList'),

    calMonthLabel: document.getElementById('vtCalMonthLabel'),
    calGrid: document.getElementById('vtCalGrid'),
    calPrev: document.getElementById('vtCalPrev'),
    calNext: document.getElementById('vtCalNext'),

    donut: document.getElementById('vtDonut'),
    donutTotal: document.getElementById('vtDonutTotal'),
    categoryLegend: document.getElementById('vtCategoryLegend'),
    categorySeeDetails: document.getElementById('vtCategorySeeDetails'),

    addBtn: document.getElementById('vtAddVaccinationBtn'),
    downloadBtn: document.getElementById('vtDownloadBtn'),
    upcomingViewAll: document.getElementById('vtUpcomingViewAll'),
    historyViewAll: document.getElementById('vtHistoryViewAll'),
    historyFullBtn: document.getElementById('vtHistoryFullBtn'),

    modalOverlay: document.getElementById('vtModalOverlay'),
    modalTitle: document.getElementById('vtModalTitle'),
    modalBody: document.getElementById('vtModalBody'),
    modalClose: document.getElementById('vtModalClose')
  };

  var todayRef = new Date(2025, 5, 20); // fixed prototype "today" matching the demo data above
  var calState = { month: todayRef.getMonth(), year: todayRef.getFullYear() };

  /* ---------------------------------------------------
     Summary statistics
  --------------------------------------------------- */
  function renderSummary() {
    var all = getAllVaccinations();
    var completed = all.filter(function (v) { return v.status === 'completed'; }).length;
    var upcoming = all.filter(function (v) { return v.status === 'upcoming'; }).length;
    var overdue = all.filter(function (v) { return v.status === 'overdue'; }).length;

    if (els.statUptodate) els.statUptodate.textContent = completed;
    if (els.statUpcoming) els.statUpcoming.textContent = upcoming;
    if (els.statOverdue) els.statOverdue.textContent = overdue;
    if (els.statTotal) els.statTotal.textContent = all.length;
  }

  /* ---------------------------------------------------
     Upcoming Vaccinations
  --------------------------------------------------- */
  function renderUpcoming() {
    if (!els.upcomingList) return;
    var items = getAllVaccinations().filter(function (v) { return v.status === 'upcoming' || v.status === 'overdue'; });

    if (items.length === 0) {
      els.upcomingList.innerHTML = '<p class="vt-modal-note"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> No upcoming or overdue vaccinations. You\u2019re all caught up.</p>';
      return;
    }

    els.upcomingList.innerHTML = items.map(renderUpcomingItem).join('');

    els.upcomingList.querySelectorAll('[data-vt-remind]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.vtRemind;
        var record = getAllVaccinations().filter(function (v) { return v.id === id; })[0];
        if (!record) return;
        notify('Reminder set for ' + record.name + ' \u2014 ' + record.dose, 'fa-bell');
        btn.classList.add('vt-reminder-done');
        btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Reminder Set';
        btn.disabled = true;
      });
    });
  }

  function renderUpcomingItem(v) {
    var dateParts = v.date.split('-');
    var monthIdx = Number(dateParts[1]) - 1;
    var badgeClass = v.status === 'overdue' ? 'vt-due-overdue' : (v.dueLabel === 'Due Soon' ? 'vt-due-soon' : 'vt-due-normal');

    return (
      '<div class="vt-upcoming-item' + (v.status === 'overdue' ? ' vt-is-overdue' : '') + '">' +
        '<div class="vt-date-box"><span class="vt-date-day">' + Number(dateParts[2]) + '</span><span class="vt-date-month">' + MONTH_NAMES[monthIdx].slice(0, 3) + '</span></div>' +
        '<div class="vt-upcoming-body">' +
          '<div class="vt-upcoming-top">' +
            '<h4>' + escapeHtml(v.name) + ' \u2014 ' + escapeHtml(v.dose) + '</h4>' +
            '<span class="vt-due-badge ' + badgeClass + '">' + escapeHtml(v.dueLabel || 'Upcoming') + '</span>' +
          '</div>' +
          '<p class="vt-upcoming-type">' + escapeHtml(v.type) + '</p>' +
          '<p class="vt-upcoming-meta"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ' + formatDate(v.date) + '</p>' +
        '</div>' +
        '<div class="vt-reminder-actions">' +
          '<button type="button" class="vt-reminder-btn" data-vt-remind="' + v.id + '"><i class="fa-solid fa-bell" aria-hidden="true"></i> Set Reminder</button>' +
        '</div>' +
      '</div>'
    );
  }

  /* ---------------------------------------------------
     Vaccination Calendar
  --------------------------------------------------- */
  function renderCalendar() {
    if (!els.calGrid) return;

    var month = calState.month, year = calState.year;
    if (els.calMonthLabel) els.calMonthLabel.textContent = MONTH_NAMES[month] + ' ' + year;

    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    var eventsByDay = {};
    getAllVaccinations().forEach(function (v) {
      var parts = v.date.split('-');
      var y = Number(parts[0]), m = Number(parts[1]) - 1, d = Number(parts[2]);
      if (y === year && m === month) {
        eventsByDay[d] = v.status;
      }
    });

    var cells = [];
    for (var i = 0; i < firstDay; i++) {
      cells.push('<span class="vt-cal-day vt-cal-empty" aria-hidden="true"></span>');
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var status = eventsByDay[day];
      var classes = 'vt-cal-day';
      var dotHtml = '';
      if (status) {
        classes += ' vt-cal-has-event vt-cal-' + status;
        dotHtml = '<span class="vt-cal-dot" aria-hidden="true"></span>';
      }
      cells.push('<span class="' + classes + '">' + day + dotHtml + '</span>');
    }

    els.calGrid.innerHTML = cells.join('');
  }

  function changeMonth(delta) {
    var newMonth = calState.month + delta;
    var newYear = calState.year;
    if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    if (newMonth > 11) { newMonth = 0; newYear += 1; }
    calState.month = newMonth;
    calState.year = newYear;
    renderCalendar();
  }

  /* ---------------------------------------------------
     Vaccination History
  --------------------------------------------------- */
  function renderHistory(limit) {
    if (!els.historyList) return;
    var completed = getAllVaccinations()
      .filter(function (v) { return v.status === 'completed'; })
      .sort(function (a, b) { return b.date.localeCompare(a.date); });

    var items = typeof limit === 'number' ? completed.slice(0, limit) : completed;

    if (items.length === 0) {
      els.historyList.innerHTML = '<p class="vt-modal-note"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> No completed vaccinations recorded yet.</p>';
      return;
    }

    els.historyList.innerHTML = items.map(function (v) {
      return (
        '<div class="vt-history-item">' +
          '<div class="vt-history-check"><i class="fa-solid fa-check" aria-hidden="true"></i></div>' +
          '<div class="vt-history-body">' +
            '<h4>' + escapeHtml(v.name) + ' \u2014 ' + escapeHtml(v.dose) + '</h4>' +
            '<p>' + escapeHtml(v.manufacturer || v.type) + '</p>' +
          '</div>' +
          '<div class="vt-history-right">' +
            '<span class="vt-history-date">' + formatDate(v.date) + '</span>' +
            '<span class="vt-history-status">Completed</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ---------------------------------------------------
     Vaccine by Category (CSS conic-gradient donut)
  --------------------------------------------------- */
  function renderCategory() {
    var all = getAllVaccinations();
    var counts = { Childhood: 0, Adult: 0, Travel: 0, Others: 0 };
    all.forEach(function (v) {
      if (counts.hasOwnProperty(v.category)) counts[v.category] += 1;
      else counts.Others += 1;
    });
    var total = all.length;

    if (els.donutTotal) els.donutTotal.textContent = total;

    if (els.donut && total > 0) {
      var stops = [];
      var cursor = 0;
      CATEGORY_ORDER.forEach(function (cat) {
        var count = counts[cat];
        if (count === 0) return;
        var pct = (count / total) * 100;
        stops.push(CATEGORY_COLORS[cat] + ' ' + cursor + '% ' + (cursor + pct) + '%');
        cursor += pct;
      });
      els.donut.style.setProperty('--vt-donut-stops', stops.join(', '));
    }

    if (els.categoryLegend) {
      els.categoryLegend.innerHTML = CATEGORY_ORDER.map(function (cat) {
        var count = counts[cat];
        var pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          '<div class="vt-legend-item">' +
            '<span class="vt-legend-dot" style="background:' + CATEGORY_COLORS[cat] + '" aria-hidden="true"></span>' +
            '<span>' + cat + '</span>' +
            '<strong>' + count + ' (' + pct + '%)</strong>' +
          '</div>'
        );
      }).join('');
    }
  }

  /* ---------------------------------------------------
     Modal system — reused for Add Vaccination, View All
     (upcoming), View Full History, and Category details.
  --------------------------------------------------- */
  function openModal(title, bodyHtml) {
    if (!els.modalOverlay) return;
    if (els.modalTitle) els.modalTitle.textContent = title;
    if (els.modalBody) els.modalBody.innerHTML = bodyHtml;
    els.modalOverlay.hidden = false;
    requestAnimationFrame(function () { els.modalOverlay.classList.add('vt-is-open'); });
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!els.modalOverlay) return;
    els.modalOverlay.classList.remove('vt-is-open');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      if (!els.modalOverlay.classList.contains('vt-is-open')) els.modalOverlay.hidden = true;
    }, 250);
  }

  function bindModalDismiss() {
    if (els.modalClose) els.modalClose.addEventListener('click', closeModal);
    if (els.modalOverlay) {
      els.modalOverlay.addEventListener('click', function (e) {
        if (e.target === els.modalOverlay) closeModal();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && els.modalOverlay && els.modalOverlay.classList.contains('vt-is-open')) closeModal();
    });
  }

  /* ---------- View All (Upcoming) ---------- */
  function openUpcomingAllModal() {
    var items = getAllVaccinations().filter(function (v) { return v.status === 'upcoming' || v.status === 'overdue'; });
    var html = '<div class="vt-modal-list">' + items.map(function (v) {
      return (
        '<div class="vt-modal-list-item">' +
          '<div><h5>' + escapeHtml(v.name) + ' \u2014 ' + escapeHtml(v.dose) + '</h5><p>' + formatDate(v.date) + '</p></div>' +
          '<span class="vt-due-badge ' + (v.status === 'overdue' ? 'vt-due-overdue' : 'vt-due-normal') + '">' + escapeHtml(v.dueLabel || 'Upcoming') + '</span>' +
        '</div>'
      );
    }).join('') + '</div>';
    openModal('All Upcoming Vaccinations', html);
  }

  /* ---------- View Full History ---------- */
  function openHistoryAllModal() {
    var items = getAllVaccinations().filter(function (v) { return v.status === 'completed'; })
      .sort(function (a, b) { return b.date.localeCompare(a.date); });
    var html = '<div class="vt-modal-list">' + items.map(function (v) {
      return (
        '<div class="vt-modal-list-item">' +
          '<div><h5>' + escapeHtml(v.name) + ' \u2014 ' + escapeHtml(v.dose) + '</h5><p>' + escapeHtml(v.manufacturer || v.type) + ' \u00b7 ' + formatDate(v.date) + '</p></div>' +
          '<span class="vt-history-status">Completed</span>' +
        '</div>'
      );
    }).join('') + '</div>';
    openModal('Full Vaccination History', html);
  }

  /* ---------- Category See Details ---------- */
  var CATEGORY_DESCRIPTIONS = {
    Childhood: 'Vaccines typically given during infancy and childhood, such as MMR and early Hepatitis B doses.',
    Adult: 'Booster and adult-recommended vaccines, such as Td boosters, HPV, and COVID-19 boosters.',
    Travel: 'Vaccines recommended for international travel to certain regions, such as Yellow Fever.',
    Others: 'Seasonal or situational vaccines, such as the annual influenza vaccine.'
  };
  function openCategoryModal() {
    var all = getAllVaccinations();
    var counts = { Childhood: 0, Adult: 0, Travel: 0, Others: 0 };
    all.forEach(function (v) {
      if (counts.hasOwnProperty(v.category)) counts[v.category] += 1;
      else counts.Others += 1;
    });
    var html = '<div class="vt-modal-list">' + CATEGORY_ORDER.map(function (cat) {
      return (
        '<div class="vt-modal-list-item">' +
          '<div><h5>' + cat + ' (' + counts[cat] + ')</h5><p>' + CATEGORY_DESCRIPTIONS[cat] + '</p></div>' +
        '</div>'
      );
    }).join('') + '</div>';
    openModal('Vaccine Categories', html);
  }

  /* ---------- Add Vaccination form ---------- */
  function addVaccinationFormHtml() {
    return (
      '<form class="vt-form" id="vtAddForm" novalidate>' +
        '<div class="vt-field"><label for="vtFieldName">Vaccine Name</label><input type="text" id="vtFieldName" required></div>' +
        '<div class="vt-field-row">' +
          '<div class="vt-field"><label for="vtFieldType">Vaccine Type</label><input type="text" id="vtFieldType"></div>' +
          '<div class="vt-field"><label for="vtFieldDose">Dose</label><input type="text" id="vtFieldDose" placeholder="e.g. Dose 1, Booster"></div>' +
        '</div>' +
        '<div class="vt-field-row">' +
          '<div class="vt-field"><label for="vtFieldDate">Date Taken</label><input type="date" id="vtFieldDate" required></div>' +
          '<div class="vt-field"><label for="vtFieldManufacturer">Manufacturer</label><input type="text" id="vtFieldManufacturer"></div>' +
        '</div>' +
        '<div class="vt-field"><label for="vtFieldNotes">Notes</label><textarea id="vtFieldNotes" placeholder="Optional notes"></textarea></div>' +
        '<p class="vt-field-error" id="vtFormError" hidden></p>' +
        '<div class="vt-form-actions">' +
          '<button type="button" class="vt-cancel-btn" id="vtFormCancel">Cancel</button>' +
          '<button type="submit" class="vt-save-btn"><i class="fa-solid fa-check" aria-hidden="true"></i> Save Vaccination</button>' +
        '</div>' +
      '</form>'
    );
  }

  function openAddModal() {
    openModal('Add Vaccination Record', addVaccinationFormHtml());

    var form = document.getElementById('vtAddForm');
    var cancelBtn = document.getElementById('vtFormCancel');
    var errorEl = document.getElementById('vtFormError');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = document.getElementById('vtFieldName').value.trim();
        var type = document.getElementById('vtFieldType').value.trim();
        var dose = document.getElementById('vtFieldDose').value.trim() || 'Single Dose';
        var date = document.getElementById('vtFieldDate').value;
        var manufacturer = document.getElementById('vtFieldManufacturer').value.trim();

        if (!name || !date) {
          if (errorEl) { errorEl.hidden = false; errorEl.textContent = 'Vaccine name and date taken are required.'; }
          return;
        }

        var record = {
          id: 'custom-' + Date.now(),
          name: name,
          dose: dose,
          type: type || 'Manually Added',
          manufacturer: manufacturer,
          date: date,
          status: 'completed',
          category: 'Others'
        };

        customVaccinations.push(record);
        saveCustomVaccinations(customVaccinations);

        renderSummary();
        renderUpcoming();
        renderCalendar();
        renderHistory(4);
        renderCategory();

        closeModal();
        notify('Vaccination record added successfully', 'fa-circle-check');
      });
    }
  }

  /* ---------------------------------------------------
     Download Record — plain browser download, no library
  --------------------------------------------------- */
  function downloadRecord() {
    var all = getAllVaccinations();
    var lines = [];
    lines.push('HealthBridge AI \u2014 Vaccination Record (Prototype/Demo Data)');
    lines.push('Generated: ' + new Date().toLocaleDateString());
    lines.push('');
    lines.push('This is prototype/demo data for design purposes only and does not represent a real medical record.');
    lines.push('');
    lines.push('COMPLETED');
    all.filter(function (v) { return v.status === 'completed'; }).forEach(function (v) {
      lines.push('- ' + v.name + ' (' + v.dose + ') | ' + (v.manufacturer || v.type) + ' | ' + formatDate(v.date));
    });
    lines.push('');
    lines.push('UPCOMING / OVERDUE');
    all.filter(function (v) { return v.status !== 'completed'; }).forEach(function (v) {
      lines.push('- ' + v.name + ' (' + v.dose + ') | ' + v.type + ' | ' + formatDate(v.date) + ' | ' + (v.dueLabel || v.status));
    });
    lines.push('');
    lines.push('Please consult a qualified healthcare professional for vaccination recommendations.');

    var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'vaccination-record.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    notify('Vaccination record downloaded', 'fa-download');
  }

  /* ---------------------------------------------------
     Wiring
  --------------------------------------------------- */
  function bindEvents() {
    if (els.calPrev) els.calPrev.addEventListener('click', function () { changeMonth(-1); });
    if (els.calNext) els.calNext.addEventListener('click', function () { changeMonth(1); });

    if (els.addBtn) els.addBtn.addEventListener('click', openAddModal);
    if (els.downloadBtn) els.downloadBtn.addEventListener('click', downloadRecord);
    if (els.upcomingViewAll) els.upcomingViewAll.addEventListener('click', openUpcomingAllModal);
    if (els.historyViewAll) els.historyViewAll.addEventListener('click', openHistoryAllModal);
    if (els.historyFullBtn) els.historyFullBtn.addEventListener('click', openHistoryAllModal);
    if (els.categorySeeDetails) els.categorySeeDetails.addEventListener('click', openCategoryModal);

    bindModalDismiss();
  }

  /* ---------------------------------------------------
     Init & Live Backend Integration
  --------------------------------------------------- */
  function fetchBackendVaccinations() {
    fetch("http://localhost:8000/api/vaccinations?group=child")
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && Array.isArray(data.schedule) && data.schedule.length > 0) {
          data.schedule.forEach(function(v, idx) {
            records.push({
              id: 'govt-vax-' + idx,
              name: v.name,
              dose: v.dose,
              type: v.description,
              manufacturer: 'National Health Mission',
              date: '2026-09-15',
              status: 'upcoming',
              category: 'Childhood',
              dueLabel: v.target_age
            });
          });
          renderSummary();
          renderUpcoming();
          renderCalendar();
          renderHistory(4);
        }
      })
      .catch(function(err) { console.warn("Backend vaccination fetch offline:", err); });
  }

  function init() {
    renderSummary();
    renderUpcoming();
    renderCalendar();
    renderHistory(4);
    renderCategory();
    bindEvents();
    fetchBackendVaccinations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

