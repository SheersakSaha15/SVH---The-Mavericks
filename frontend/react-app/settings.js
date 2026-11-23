/* =========================================================
   SETTINGS PAGE — HealthBridge AI
   Isolated JavaScript (does NOT modify script.js)
   ========================================================= */
   (function () {
    'use strict';
  
    // ── LocalStorage Keys ──
    const LS_PREFIX = 'healthbridge_settings_';
    const LS = {
      units: LS_PREFIX + 'units',
      dateFormat: LS_PREFIX + 'dateFormat',
      startOfWeek: LS_PREFIX + 'startOfWeek',
      language: LS_PREFIX + 'language',
      
      // Notifications
      notifAlerts: LS_PREFIX + 'notif_alerts',
      notifReminders: LS_PREFIX + 'notif_reminders',
      notifUpdates: LS_PREFIX + 'notif_updates',
      notifAppNotif: LS_PREFIX + 'notif_app_notif',
  
      // Privacy
      privSaveChat: LS_PREFIX + 'priv_save_chat',
      privRecommendations: LS_PREFIX + 'priv_recommendations',
      privDataShare: LS_PREFIX + 'priv_data_share',
  
      // Appearance & Accessibility
      theme: LS_PREFIX + 'theme',        // light | dark | system
      fontSize: LS_PREFIX + 'fontSize',
      highContrast: LS_PREFIX + 'highContrast',
      reduceMotion: LS_PREFIX + 'reduceMotion',
  
      // Profile Data
      profileName: LS_PREFIX + 'profileName',
      profileEmail: LS_PREFIX + 'profileEmail',
      profilePhone: LS_PREFIX + 'profilePhone',
      profileLocation: LS_PREFIX + 'profileLocation',
      
      // Dash & Reminders
      dashTip: LS_PREFIX + 'dash_tip',
      dashAlerts: LS_PREFIX + 'dash_alerts',
      dashVac: LS_PREFIX + 'dash_vac',
      dashDisease: LS_PREFIX + 'dash_disease',
  
      remindTips: LS_PREFIX + 'remind_tips',
      remindVac: LS_PREFIX + 'remind_vac',
      remindAlerts: LS_PREFIX + 'remind_alerts'
    };
  
    function get(key, fallback) {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    }
    function set(key, value) {
      localStorage.setItem(key, value);
    }
  
    // ── Toast ──
    function showToast(msg) {
      const t = document.getElementById('stToast');
      if (!t) return;
      t.innerHTML = '<i class="fa-solid fa-check-circle"></i> ' + msg;
      t.classList.add('st-toast-show');
      clearTimeout(t._tid);
      t._tid = setTimeout(() => t.classList.remove('st-toast-show'), 2400);
    }
  
    // ── Global Search Index ──
    const searchIndex = [
      { cat: 'general', title: 'Profile Information', desc: 'View and update your personal details', match: 'profile information name email location account' },
      { cat: 'general', title: 'Units', desc: 'Choose your preferred units', match: 'units metric imperial kg cm' },
      { cat: 'general', title: 'Date & Time Format', desc: 'Select your preferred date/time formatting', match: 'date time format 12 hour 24' },
      { cat: 'general', title: 'Start of Week', desc: 'Choose the first day of the week', match: 'week start monday sunday weekend' },
      { cat: 'general', title: 'Dashboard Preferences', desc: 'Customize what you see on your dashboard', match: 'dashboard widget home tip alert disease show hide preference' },
      { cat: 'general', title: 'Language', desc: 'Select your preferred language', match: 'language english hindi local tongue' },
      { cat: 'general', title: 'Reminders & Preferences', desc: 'Manage your health goals', match: 'reminder preferences goal notify alert tip' },
      { cat: 'notifications', title: 'Health Alerts', desc: 'Get notified about disease outbreaks', match: 'notification health alert warning outbreak' },
      { cat: 'notifications', title: 'Vaccination Reminders', desc: 'Receive reminders for upcoming vaccinations', match: 'notification vaccine immunize reminder shot' },
      { cat: 'notifications', title: 'Daily Health Tips', desc: 'Be notified with daily wellness tips', match: 'notification daily tip health wellness' },
      { cat: 'notifications', title: 'App Notifications', desc: 'General system alerts', match: 'notification app system alert' },
      { cat: 'privacy', title: 'Save Chat History', desc: 'Store AI conversation logs locally', match: 'privacy chat history save log' },
      { cat: 'privacy', title: 'Personalized Recommendations', desc: 'Allow AI to use settings for suggestions', match: 'privacy personalization suggest recommendation' },
      { cat: 'privacy', title: 'Data Sharing', desc: 'Manage anonymous usage data', match: 'privacy data sharing export anonymous' },
      { cat: 'privacy', title: 'Clear Local Data', desc: 'Remove all locally stored settings', match: 'privacy clear delete wipe local data' },
      { cat: 'healthData', title: 'Health Profile', desc: 'Manage stored health conditions', match: 'health profile stored data condition' },
      { cat: 'healthData', title: 'Vaccination Records', desc: 'View immunization history settings', match: 'health data vaccine immunization record history' },
      { cat: 'healthData', title: 'Symptom History', desc: 'Check logs of past symptoms', match: 'health data symptom history check log' },
      { cat: 'healthData', title: 'Chat History', desc: 'Export or manage chat data', match: 'health data chat history ai log' },
      { cat: 'healthData', title: 'Export My Data', desc: 'Download JSON of local settings', match: 'export download backup json file data' },
      { cat: 'healthData', title: 'Clear Local Data', desc: 'Remove all local settings safely', match: 'clear wipe delete erase data database local' },
      { cat: 'appearance', title: 'Light / Dark Theme', desc: 'Switch visual appearance', match: 'theme light dark mode system ui look appearance color interface' },
      { cat: 'accessibility', title: 'Reduced Motion', desc: 'Minimize animations', match: 'accessibility reduce motion animation speed transition visual' },
      { cat: 'accessibility', title: 'Larger Text', desc: 'Increase base font size', match: 'accessibility large text font size reading visibility' },
      { cat: 'accessibility', title: 'High Contrast', desc: 'Improve text readability', match: 'accessibility contrast high visual color' },
      { cat: 'account', title: 'Account Information', desc: 'Manage account linkages', match: 'account information profile user' },
      { cat: 'account', title: 'Email Preferences', desc: 'Manage newsletter subscriptions', match: 'account email preference news subscribe mail newsletter' },
      { cat: 'account', title: 'Change Password', desc: 'Update login credentials', match: 'account password login security credential change update' },
      { cat: 'account', title: 'Sign Out', desc: 'End session safely', match: 'account sign out log session disconnect' },
      { cat: 'help', title: 'Help Center', desc: 'Learn how to use features', match: 'help support center guide docs manual howto support' },
      { cat: 'help', title: 'Contact Support', desc: 'Reach out for help', match: 'help support contact team reach email message issue' },
      { cat: 'help', title: 'Report a Problem', desc: 'File a bug or issue', match: 'help support report problem bug issue file complain' },
      { cat: 'help', title: 'About HealthBridge AI', desc: 'View app version', match: 'help support about version info app bridge team license copyright' }
    ];
  
    // ── Category Data ──
    const categoryPanels = {
      general: buildGeneral,
      notifications: buildNotifications,
      privacy: buildPrivacy,
      healthData: buildHealthData,
      appearance: buildAppearance,
      accessibility: buildAccessibility,
      account: buildAccount,
      help: buildHelp,
    };
  
    const categoryMeta = {
      general: { title: 'General', subtitle: 'Basic preferences and configurations for your app experience.' },
      notifications: { title: 'Notifications', subtitle: 'Control how and when you receive notifications.' },
      privacy: { title: 'Privacy & Security', subtitle: 'Manage your data privacy and security preferences.' },
      healthData: { title: 'Health Data', subtitle: 'Manage how your health data is stored and shared.' },
      appearance: { title: 'Appearance', subtitle: 'Customize the look and feel of your app.' },
      accessibility: { title: 'Accessibility', subtitle: 'Adjust settings to make the app easier to use.' },
      account: { title: 'Account', subtitle: 'Manage your account details and linked services.' },
      help: { title: 'Help & Support', subtitle: 'Find answers, report issues, and get help.' },
    };
  
    let activeCategory = 'general';
  
    // ── Init ──
    document.addEventListener('DOMContentLoaded', () => {
      initCategories();
      renderPanel();
      initSearch();
      applyAccessibilityGlobal();
      updateSidebarUserInfo();
    });
  
    // ── Category Navigation ──
    function initCategories() {
      const buttons = document.querySelectorAll('.st-cat-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          navigateToCategory(btn.dataset.cat);
        });
      });
    }
  
    function navigateToCategory(catId) {
      activeCategory = catId;
      document.querySelectorAll('.st-cat-btn').forEach(b => b.classList.remove('st-cat-active'));
      const activeBtn = document.querySelector(".st-cat-btn[data-cat='" + catId + "']");
      if(activeBtn) activeBtn.classList.add('st-cat-active');
      renderPanel();
    }
  
    // ── Render Panel ──
    function renderPanel() {
      const panel = document.getElementById('stPanel');
      if (!panel) return;
  
      const meta = categoryMeta[activeCategory];
      const builder = categoryPanels[activeCategory];
  
      panel.innerHTML = `
        <div class="st-panel-content">
          <h3 class="st-panel-title">${meta.title}</h3>
          <p class="st-panel-subtitle">${meta.subtitle}</p>
          <div id="stPanelBody"></div>
        </div>
      `;
  
      const body = document.getElementById('stPanelBody');
      if (builder) builder(body);
    }
  
    // ── GENERAL ──
    function buildGeneral(container) {
      const units = get(LS.units, 'Metric (kg, cm)');
      const dateFormat = get(LS.dateFormat, 'DD/MM/YYYY · 12-hour');
      const startOfWeek = get(LS.startOfWeek, 'Monday');
      const language = get(LS.language, 'English');
  
      container.innerHTML = `
        <div class="st-items-list">
          <div class="st-item" id="stProfileItem">
            <div class="st-item-icon st-ic-blue"><i class="fa-solid fa-user"></i></div>
            <div class="st-item-body">
              <h4>Profile Information</h4>
              <p>View and update your personal details</p>
            </div>
            <div class="st-item-right">
              <i class="fa-solid fa-chevron-right st-item-arrow"></i>
            </div>
          </div>
  
          <div class="st-item st-interactive-row" id="stUnitsItem">
            <div class="st-item-icon st-ic-green"><i class="fa-solid fa-weight-scale"></i></div>
            <div class="st-item-body">
              <h4>Units</h4>
              <p>Choose your preferred units</p>
            </div>
            <div class="st-item-right">
              <span class="st-badge" id="stUnitsLabel">${units}</span>
              <i class="fa-solid fa-chevron-right st-item-arrow"></i>
            </div>
          </div>
  
          <div class="st-item st-interactive-row" id="stDateItem">
            <div class="st-item-icon st-ic-teal"><i class="fa-solid fa-calendar-days"></i></div>
            <div class="st-item-body">
              <h4>Date & Time Format</h4>
              <p>Select your preferred date/time formatting</p>
            </div>
            <div class="st-item-right">
              <span class="st-badge" id="stDateLabel">${dateFormat}</span>
              <i class="fa-solid fa-chevron-right st-item-arrow"></i>
            </div>
          </div>
  
          <div class="st-item st-interactive-row" id="stWeekItem">
            <div class="st-item-icon st-ic-purple"><i class="fa-solid fa-calendar-week"></i></div>
            <div class="st-item-body">
              <h4>Start of Week</h4>
              <p>Choose the first day of the week</p>
            </div>
            <div class="st-item-right">
              <span class="st-badge" id="stWeekLabel">${startOfWeek}</span>
              <i class="fa-solid fa-chevron-right st-item-arrow"></i>
            </div>
          </div>
  
          <div class="st-item" id="stDashItem">
            <div class="st-item-icon st-ic-amber"><i class="fa-solid fa-table-columns"></i></div>
            <div class="st-item-body">
              <h4>Dashboard Preferences</h4>
              <p>Customize what you see on your dashboard</p>
            </div>
            <div class="st-item-right">
              <i class="fa-solid fa-chevron-right st-item-arrow"></i>
            </div>
          </div>
  
          <div class="st-item st-interactive-row" id="stLangItem">
            <div class="st-item-icon st-ic-teal"><i class="fa-solid fa-globe"></i></div>
            <div class="st-item-body">
              <h4>Language</h4>
              <p>Select your preferred language</p>
            </div>
            <div class="st-item-right">
              <span class="st-badge" id="stLangLabel">${language}</span>
              <i class="fa-solid fa-chevron-right st-item-arrow"></i>
            </div>
          </div>
  
          <div class="st-item" id="stRemindersItem">
            <div class="st-item-icon st-ic-pink"><i class="fa-solid fa-clock"></i></div>
            <div class="st-item-body">
              <h4>Reminders & Preferences</h4>
              <p>Manage your health goals notifications</p>
            </div>
            <div class="st-item-right">
              <i class="fa-solid fa-chevron-right st-item-arrow"></i>
            </div>
          </div>
        </div>
      `;
  
      // Listeners
      document.getElementById('stProfileItem').addEventListener('click', openProfileModal);
  
      const unitsOptions = ['Metric (kg, cm)', 'Imperial (lb, in)'];
      document.getElementById('stUnitsItem').addEventListener('click', () => {
        const cur = get(LS.units, 'Metric (kg, cm)');
        const next = unitsOptions[(unitsOptions.indexOf(cur) + 1) % unitsOptions.length];
        set(LS.units, next);
        document.getElementById('stUnitsLabel').textContent = next;
        showToast('Units updated to ' + next);
      });
  
      const dateOptions = ['DD/MM/YYYY · 12-hour', 'MM/DD/YYYY · 12-hour', 'YYYY-MM-DD · 24-hour', 'DD/MM/YYYY · 24-hour'];
      document.getElementById('stDateItem').addEventListener('click', () => {
        const cur = get(LS.dateFormat, 'DD/MM/YYYY · 12-hour');
        const next = dateOptions[(dateOptions.indexOf(cur) + 1) % dateOptions.length];
        set(LS.dateFormat, next);
        document.getElementById('stDateLabel').textContent = next;
        showToast('Date format updated');
      });
  
      const weekOptions = ['Monday', 'Sunday', 'Saturday'];
      document.getElementById('stWeekItem').addEventListener('click', () => {
        const cur = get(LS.startOfWeek, 'Monday');
        const next = weekOptions[(weekOptions.indexOf(cur) + 1) % weekOptions.length];
        set(LS.startOfWeek, next);
        document.getElementById('stWeekLabel').textContent = next;
        showToast('Start of week: ' + next);
      });
  
      const langOptions = ['English', 'Hindi', 'Odia', 'Bengali', 'Tamil'];
      document.getElementById('stLangItem').addEventListener('click', () => {
        const cur = get(LS.language, 'English');
        const next = langOptions[(langOptions.indexOf(cur) + 1) % langOptions.length];
        set(LS.language, next);
        document.getElementById('stLangLabel').textContent = next;
        showToast('Language: ' + next);
      });
  
      document.getElementById('stDashItem').addEventListener('click', () => {
        initTogglesInModal('stDashModal', [
          {id: 'stTogDashTip', key: LS.dashTip, default: 'true'},
          {id: 'stTogDashAlerts', key: LS.dashAlerts, default: 'true'},
          {id: 'stTogDashVac', key: LS.dashVac, default: 'true'},
          {id: 'stTogDashDisease', key: LS.dashDisease, default: 'true'}
        ]);
        openModal('stDashModal');
      });
  
      document.getElementById('stRemindersItem').addEventListener('click', () => {
        initTogglesInModal('stRemindersModal', [
          {id: 'stTogRemindTips', key: LS.remindTips, default: 'true'},
          {id: 'stTogRemindVac', key: LS.remindVac, default: 'true'},
          {id: 'stTogRemindAlerts', key: LS.remindAlerts, default: 'true'}
        ]);
        openModal('stRemindersModal');
      });
    }
  
    // ── NOTIFICATIONS ──
    function buildNotifications(container) {
      const items = [
        { key: LS.notifAlerts, label: 'Health Alerts', desc: 'Get notified about disease outbreaks and health warnings', default: 'true' },
        { key: LS.notifReminders, label: 'Vaccination Reminders', desc: 'Receive reminders for upcoming vaccinations', default: 'true' },
        { key: LS.notifUpdates, label: 'Daily Health Tips', desc: 'Be notified with daily wellness tips', default: 'true' },
        { key: LS.notifAppNotif, label: 'App Notifications', desc: 'General system alerts from HealthBridge', default: 'true' },
      ];
  
      container.innerHTML = `
        <div class="st-panel-section-wrap">
          ${items.map(it => {
            const on = get(it.key, it.default) === 'true';
            return `
              <div class="st-notif-item">
                <div class="st-notif-info">
                  <h4>${it.label}</h4>
                  <p>${it.desc}</p>
                </div>
                <div class="st-toggle ${on ? 'st-on' : ''}" data-key="${it.key}"></div>
              </div>
            `;
          }).join('')}
        </div>
      `;
  
      container.querySelectorAll('.st-toggle').forEach(tog => {
        tog.addEventListener('click', () => {
          const isOn = tog.classList.toggle('st-on');
          set(tog.dataset.key, isOn ? 'true' : 'false');
          showToast('Notification preference saved');
        });
      });
    }
  
    // ── PRIVACY & SECURITY ──
    function buildPrivacy(container) {
      const chatOn = get(LS.privSaveChat, 'true') === 'true';
      const recOn = get(LS.privRecommendations, 'true') === 'true';
      const dataShare = get(LS.privDataShare, 'false') === 'true';
  
      container.innerHTML = `
        <div class="st-panel-section-wrap" style="margin-bottom:24px;">
          <div class="st-notif-item">
            <div class="st-notif-info">
              <h4>Save Chat History</h4>
              <p>Store AI conversations locally for context</p>
            </div>
            <div class="st-toggle ${chatOn ? 'st-on' : ''}" data-key="${LS.privSaveChat}"></div>
          </div>
          <div class="st-notif-item">
            <div class="st-notif-info">
              <h4>Personalized Recommendations</h4>
              <p>Allow app to suggest based on your health info</p>
            </div>
            <div class="st-toggle ${recOn ? 'st-on' : ''}" data-key="${LS.privRecommendations}"></div>
          </div>
          <div class="st-notif-item">
            <div class="st-notif-info">
              <h4>Data Sharing</h4>
              <p>Allow anonymous usage reporting</p>
            </div>
            <div class="st-toggle ${dataShare ? 'st-on' : ''}" data-key="${LS.privDataShare}"></div>
          </div>
        </div>
        
        <div class="st-items-list">
          <div class="st-item st-interactive-row st-danger-interactive" id="stPrivClearData">
            <div class="st-item-icon" style="background:var(--warning-bg);color:var(--warning)"><i class="fa-solid fa-broom"></i></div>
            <div class="st-item-body">
              <h4 style="color:var(--warning)">Clear Local Data</h4>
              <p>Remove all HealthBridge-specific local data</p>
            </div>
            <div class="st-item-right">
              <i class="fa-solid fa-chevron-right st-item-arrow" style="color:var(--warning)"></i>
            </div>
          </div>
        </div>
      `;
  
      container.querySelectorAll('.st-toggle').forEach(tog => {
        tog.addEventListener('click', () => {
          const isOn = tog.classList.toggle('st-on');
          set(tog.dataset.key, isOn ? 'true' : 'false');
          showToast('Privacy update applied');
        });
      });
  
      document.getElementById('stPrivClearData').addEventListener('click', () => {
        openModal('stClearDataModal');
      });
    }
  
    // ── HEALTH DATA ──
    function buildHealthData(container) {
      container.innerHTML = `
        <p style="font-size:13.5px;color:var(--text-secondary);margin-bottom:16px;">Manage your locally stored health records, logs, and preferences.</p>
        <div class="st-items-list" style="margin-bottom:24px;">
          <div class="st-item st-interactive-row" onclick="showInfoDialog('Health Profile', 'View and manage physical traits, chronic conditions, and personal health data. Connected modules will appear here.')">
            <div class="st-item-icon st-ic-blue"><i class="fa-solid fa-file-medical"></i></div>
            <div class="st-item-body">
              <h4>Health Profile</h4>
              <p>Physical stats and base health information</p>
            </div>
            <div class="st-item-right"><i class="fa-solid fa-chevron-right st-item-arrow"></i></div>
          </div>
          <div class="st-item st-interactive-row" onclick="showInfoDialog('Vaccination Records', 'Manage your immunization logs manually or via connected API sources.')">
            <div class="st-item-icon st-ic-green"><i class="fa-solid fa-syringe"></i></div>
            <div class="st-item-body">
              <h4>Vaccination Records</h4>
              <p>Your logged immunization history</p>
            </div>
            <div class="st-item-right"><i class="fa-solid fa-chevron-right st-item-arrow"></i></div>
          </div>
          <div class="st-item st-interactive-row" onclick="showInfoDialog('Symptom History', 'Logs generated from your symptom checker sessions.')">
            <div class="st-item-icon st-ic-amber"><i class="fa-solid fa-stethoscope"></i></div>
            <div class="st-item-body">
              <h4>Symptom History</h4>
              <p>Past symptom checker reports</p>
            </div>
            <div class="st-item-right"><i class="fa-solid fa-chevron-right st-item-arrow"></i></div>
          </div>
          <div class="st-item st-interactive-row" onclick="showInfoDialog('Chat History', 'Past automated AI diagnostic and query sessions.')">
            <div class="st-item-icon st-ic-purple"><i class="fa-solid fa-comments"></i></div>
            <div class="st-item-body">
              <h4>Chat History</h4>
              <p>Conversations with AI Assistant</p>
            </div>
            <div class="st-item-right"><i class="fa-solid fa-chevron-right st-item-arrow"></i></div>
          </div>
        </div>
  
        <div class="st-data-cards">
          <div class="st-data-card" id="stBtnExportData">
            <i class="fa-solid fa-download" style="color:var(--brand-teal)"></i>
            <h4>Export My Data</h4>
            <p>Download all preferences as JSON</p>
          </div>
          <div class="st-data-card" id="stBtnClearHealthData" style="border-color:rgba(245,158,11,0.3);">
            <i class="fa-solid fa-broom" style="color:var(--warning)"></i>
            <h4 style="color:var(--warning)">Clear Local Data</h4>
            <p>Remove offline saved health logs</p>
          </div>
        </div>
      `;
  
      document.getElementById('stBtnExportData').addEventListener('click', performExport);
      document.getElementById('stBtnClearHealthData').addEventListener('click', () => {
        openModal('stClearDataModal');
      });
    }
  
    // ── APPEARANCE ──
    function buildAppearance(container) {
      const currentTheme = get(LS.theme, 'system');
      const rm = get(LS.reduceMotion, 'false') === 'true';
  
      container.innerHTML = `
        <p style="font-size:13.5px;color:var(--text-secondary);margin-bottom:8px;">Choose how HealthBridge AI looks for you.</p>
        <div class="st-theme-grid" style="margin-bottom:24px;">
          <div class="st-theme-card ${currentTheme === 'light' ? 'st-theme-active' : ''}" data-theme-val="light">
            <i class="fa-solid fa-sun"></i>
            <span>Light</span>
          </div>
          <div class="st-theme-card ${currentTheme === 'dark' ? 'st-theme-active' : ''}" data-theme-val="dark">
            <i class="fa-solid fa-moon"></i>
            <span>Dark</span>
          </div>
          <div class="st-theme-card ${currentTheme === 'system' ? 'st-theme-active' : ''}" data-theme-val="system">
            <i class="fa-solid fa-desktop"></i>
            <span>System</span>
          </div>
        </div>
  
        <div class="st-items-list">
          <div class="st-notif-item" style="padding:16px 14px;background:var(--surface-alt);border-radius:var(--r-md);border:1px solid var(--border);">
            <div class="st-notif-info">
              <h4>Reduced Motion</h4>
              <p>Minimize animations and transitions on the Settings page</p>
            </div>
            <div class="st-toggle ${rm ? 'st-on' : ''}" data-key="${LS.reduceMotion}" id="stAppearanceRM"></div>
          </div>
        </div>
      `;
  
      // Theme toggles
      container.querySelectorAll('.st-theme-card').forEach(card => {
        card.addEventListener('click', () => {
          container.querySelectorAll('.st-theme-card').forEach(c => c.classList.remove('st-theme-active'));
          card.classList.add('st-theme-active');
          const val = card.dataset.themeVal;
          set(LS.theme, val);
          localStorage.setItem('healthbridge-theme', val);

          if (typeof window.applyTheme === 'function') {
            window.applyTheme(val);
          } else {
            const effectiveTheme = (val === 'system')
              ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
              : val;
            document.documentElement.setAttribute('data-theme', effectiveTheme);
            document.body.setAttribute('data-theme', effectiveTheme);
          }
          if (typeof showToast === 'function') {
            showToast('Theme updated to ' + val);
          }
        });
      });
  
      // Reduced motion
      const rmToggle = document.getElementById('stAppearanceRM');
      if(rmToggle) {
        rmToggle.addEventListener('click', () => {
          const isOn = rmToggle.classList.toggle('st-on');
          set(LS.reduceMotion, isOn ? 'true' : 'false');
          applyAccessibilityGlobal();
          showToast(isOn ? 'Animations reduced' : 'Animations restored');
        });
      }
    }
  
    // ── ACCESSIBILITY ──
    function buildAccessibility(container) {
      const hc = get(LS.highContrast, 'false') === 'true';
      const rm = get(LS.reduceMotion, 'false') === 'true';
      const lg = get(LS.fontSize, 'false') === 'true';
  
      container.innerHTML = `
        <p style="font-size:13.5px;color:var(--text-secondary);margin-bottom:8px;">Make HealthBridge AI easier to use.</p>
        <div class="st-access-grid">
          <div class="st-access-card ${rm ? 'st-access-on' : ''}" id="stAccRM">
            <i class="fa-solid fa-gauge-simple"></i>
            <span>Reduced Motion</span>
          </div>
          <div class="st-access-card ${lg ? 'st-access-on' : ''}" id="stAccLgText">
            <i class="fa-solid fa-text-height"></i>
            <span>Larger Text</span>
          </div>
          <div class="st-access-card ${hc ? 'st-access-on' : ''}" id="stAccHC">
            <i class="fa-solid fa-circle-half-stroke"></i>
            <span>High Contrast</span>
          </div>
        </div>
      `;
  
      document.getElementById('stAccRM').addEventListener('click', function () {
        const on = this.classList.toggle('st-access-on');
        set(LS.reduceMotion, on ? 'true' : 'false');
        applyAccessibilityGlobal();
        showToast('Reduce motion ' + (on ? 'enabled' : 'disabled'));
      });
  
      document.getElementById('stAccLgText').addEventListener('click', function () {
        const on = this.classList.toggle('st-access-on');
        set(LS.fontSize, on ? 'true' : 'false');
        applyAccessibilityGlobal();
        showToast('Larger text ' + (on ? 'enabled' : 'disabled'));
      });
  
      document.getElementById('stAccHC').addEventListener('click', function () {
        const on = this.classList.toggle('st-access-on');
        set(LS.highContrast, on ? 'true' : 'false');
        applyAccessibilityGlobal();
        showToast('High contrast ' + (on ? 'enabled' : 'disabled'));
      });
    }
  
    function applyAccessibilityGlobal() {
      const app = document.querySelector('.app');
      if(!app) return;
  
      if (get(LS.reduceMotion, 'false') === 'true') {
        app.classList.add('st-opt-reduce-motion');
      } else {
        app.classList.remove('st-opt-reduce-motion');
      }
  
      if (get(LS.highContrast, 'false') === 'true') {
        app.classList.add('st-opt-high-contrast');
      } else {
        app.classList.remove('st-opt-high-contrast');
      }
  
      if (get(LS.fontSize, 'false') === 'true') {
        app.classList.add('st-opt-larger-text');
      } else {
        app.classList.remove('st-opt-larger-text');
      }
    }
  
    // ── ACCOUNT ──
    function buildAccount(container) {
      const name = get(LS.profileName, 'Parth Chouhan');
      const email = get(LS.profileEmail, 'parth@healthbridge.ai');
  
      container.innerHTML = `
        <div class="st-account-avatar" id="stAccountPageAvatar">PC</div>
        <div class="st-account-info">
          <h4 id="stAccountPageName">${name}</h4>
          <p id="stAccountPageEmail">${email}</p>
        </div>
        <div class="st-account-actions">
          <button class="st-account-btn" id="stAccEditProfile"><i class="fa-solid fa-user-pen"></i> Account Information</button>
          <button class="st-account-btn" id="stAccEmailPref"><i class="fa-solid fa-envelope-open-text"></i> Email Preferences</button>
          <button class="st-account-btn" id="stAccChangePass"><i class="fa-solid fa-key"></i> Change Password</button>
          <button class="st-account-btn st-btn-logout" id="stAccLogout"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</button>
        </div>
      `;
  
      document.getElementById('stAccEditProfile').addEventListener('click', openProfileModal);
      document.getElementById('stAccEmailPref').addEventListener('click', () => showInfoDialog('Email Preferences', 'Manage which newsletters and account alerts you wish to receive. Prototype is currently disconnected from mailers.'));
      document.getElementById('stAccChangePass').addEventListener('click', () => openModal('stPasswordModal'));
      document.getElementById('stAccLogout').addEventListener('click', () => openModal('stSignOutModal'));
    }
  
    // ── HELP & SUPPORT ──
    function buildHelp(container) {
      container.innerHTML = `
        <p style="font-size:13.5px;color:var(--text-secondary);margin-bottom:12px;">We're here to help. Choose an option below.</p>
        <div class="st-help-grid">
          <div class="st-help-card" onclick="showInfoDialog('Help Center', 'Comprehensive guides and tutorials for using HealthBridge AI modules.')">
            <i class="fa-solid fa-book"></i>
            <h4>Help Center</h4>
            <p>Learn how to use features</p>
          </div>
          <div class="st-help-card" onclick="showInfoDialog('Contact Support', 'Send an email or open a support chat ticket with our response team.')">
            <i class="fa-solid fa-envelope"></i>
            <h4>Contact Support</h4>
            <p>Reach out to our team directly</p>
          </div>
          <div class="st-help-card" onclick="showInfoDialog('Report a Problem', 'Submit a formal bug report or user experience issue directly to the developers.')">
            <i class="fa-solid fa-bug"></i>
            <h4>Report a Problem</h4>
            <p>Help us improve</p>
          </div>
          <div class="st-help-card" onclick="showInfoDialog('About HealthBridge AI', 'Build Version: 2.0.0-SVH<br>Developed by: Team The Mavericks<br>License: Open Source Health Initiative')">
            <i class="fa-solid fa-circle-info"></i>
            <h4>About HealthBridge AI</h4>
            <p>App details and versions</p>
          </div>
        </div>
      `;
    }
  
    // ── Profile Modal Logic ──
    function openProfileModal() {
      const nameIn = document.getElementById('stPfName');
      const emailIn = document.getElementById('stPfEmail');
      const phoneIn = document.getElementById('stPfPhone');
      const locIn = document.getElementById('stPfLocation');
  
      nameIn.value = get(LS.profileName, '');
      emailIn.value = get(LS.profileEmail, '');
      phoneIn.value = get(LS.profilePhone, '');
      locIn.value = get(LS.profileLocation, '');
  
      openModal('stProfileModal');
    }
  
    document.getElementById('stProfileSave').addEventListener('click', () => {
      const name = document.getElementById('stPfName').value.trim();
      const email = document.getElementById('stPfEmail').value.trim();
      const phone = document.getElementById('stPfPhone').value.trim();
      const loc = document.getElementById('stPfLocation').value.trim();
  
      set(LS.profileName, name);
      set(LS.profileEmail, email);
      set(LS.profilePhone, phone);
      set(LS.profileLocation, loc);
  
      closeModal('stProfileModal');
      showToast('Profile information saved');
      updateSidebarUserInfo();
      
      // Update local account section if rendered
      if(document.getElementById('stAccountPageName')) {
        document.getElementById('stAccountPageName').textContent = name || 'Parth Chouhan';
        document.getElementById('stAccountPageEmail').textContent = email || 'parth@healthbridge.ai';
      }
    });
  
    function updateSidebarUserInfo() {
      const name = get(LS.profileName, 'Parth Chouhan');
      document.getElementById('stNavUserName').textContent = name;
      const init = name ? name.substring(0, 2).toUpperCase() : 'PC';
      document.getElementById('stNavAvatar').textContent = init;
      document.getElementById('stTopbarAvatar').textContent = init;
      
      if(document.getElementById('stAccountPageAvatar')){
        document.getElementById('stAccountPageAvatar').textContent = init;
      }
    }
  
    // ── General Modals ──
    function openModal(id) {
      const mod = document.getElementById(id);
      if(mod) mod.classList.add('st-modal-open');
    }
    
    function closeModal(id) {
      const mod = document.getElementById(id);
      if(mod) mod.classList.remove('st-modal-open');
    }
  
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        closeModal(e.currentTarget.closest('.st-modal-overlay').id);
      });
    });
  
    window.showInfoDialog = function(title, bodyHtml) {
      document.getElementById('stInfoModalTitle').innerHTML = `<i class="fa-solid fa-circle-info" style="color:var(--brand-teal);margin-right:8px;"></i> ${title}`;
      document.getElementById('stInfoModalBody').innerHTML = `<p style="font-size:14px;line-height:1.6;">${bodyHtml}</p>`;
      openModal('stInfoModal');
    };
  
    function initTogglesInModal(modalId, toggleConfigArray) {
      toggleConfigArray.forEach(cfg => {
        const el = document.getElementById(cfg.id);
        if(!el) return;
        const isOn = get(cfg.key, cfg.default) === 'true';
        if(isOn) el.classList.add('st-on');
        else el.classList.remove('st-on');
  
        el.onclick = function() {
          const state = el.classList.toggle('st-on');
          set(cfg.key, state ? 'true' : 'false');
        };
      });
    }
  
    // ── Generic Data Actions ──
    document.getElementById('stConfirmClearData').addEventListener('click', () => {
      Object.values(LS).forEach(keyVal => {
        localStorage.removeItem(keyVal);
      });
      closeModal('stClearDataModal');
      showToast('Local settings wiped successfully');
      renderPanel();
      applyAccessibilityGlobal();
      updateSidebarUserInfo();
    });
  
    function performExport() {
      const data = {};
      Object.entries(LS).forEach(([k, v]) => {
        const val = localStorage.getItem(v);
        if(val !== null) data[k] = val;
      });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'healthbridge-settings.json';
      a.click();
      showToast('Settings exported to JSON');
    }
  
    // ── Danger Zone Banner ──
    document.getElementById('stDangerZoneBanner').addEventListener('click', () => {
      openModal('stDangerModal');
    });
  
    document.getElementById('stDangerExportBtn').addEventListener('click', performExport);
    document.getElementById('stDangerResetBtn').addEventListener('click', () => {
      openModal('stClearDataModal');
      closeModal('stDangerModal');
    });
  
    // ── Privacy Card ──
    document.getElementById('stPrivacyLearnMore').addEventListener('click', () => {
      showInfoDialog('Privacy & Security Policy', 'HealthBridge AI prototype operates primarily on local storage mechanisms to protect your health patterns. In a production environment, strict HIPAA compliant cloud endpoints with E2E encryption ensure total safety. We never sell your personalized health profiling data.');
    });
  
    // ── Search ──
    function initSearch() {
      const input = document.getElementById('stSearchInput');
      const clearBtn = document.getElementById('stSearchClear');
      const overlay = document.getElementById('stSearchResults');
      
      if (!input) return;
  
      input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        
        if (q.length > 0) {
          clearBtn.style.display = 'block';
          
          let matches = searchIndex.filter(item => 
            item.title.toLowerCase().includes(q) || 
            item.desc.toLowerCase().includes(q) || 
            item.match.includes(q)
          );
          
          if(matches.length === 0) {
            overlay.innerHTML = `<div class="st-search-empty">No settings found for "${q}"</div>`;
          } else {
            overlay.innerHTML = matches.map(m => `
              <div class="st-search-result-item" data-goto="${m.cat}">
                <div class="st-search-res-title">${m.title}</div>
                <div class="st-search-res-path"><i class="fa-solid fa-angle-right"></i> ${categoryMeta[m.cat].title}</div>
              </div>
            `).join('');
          }
          overlay.style.display = 'block';
        } else {
          clearBtn.style.display = 'none';
          overlay.style.display = 'none';
        }
      });
  
      clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        overlay.style.display = 'none';
        input.focus();
      });
  
      // Click outside to close map
      document.addEventListener('click', (e) => {
        if(!e.target.closest('.st-search-wrap') && !e.target.closest('#stSearchResults')) {
          overlay.style.display = 'none';
        }
      });
  
      // Handle click on result
      overlay.addEventListener('click', (e) => {
        const item = e.target.closest('.st-search-result-item');
        if(item) {
          const cat = item.dataset.goto;
          navigateToCategory(cat);
          overlay.style.display = 'none';
          input.value = '';
          clearBtn.style.display = 'none';
        }
      });
    }
  
  })();
  
