const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'dashboard.html');

const newTopbar = `    <header class="topbar">
      <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3.5" ry="3.5"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
      </button>

      <div class="topbar-center" style="display: flex; align-items: center; justify-content: center; flex: 1;">
        <!-- Location moved to Live Surveillance -->
      </div>

      <div class="topbar-actions">
        <button class="icon-btn" id="notifBell" aria-label="Notifications">
          <i class="fa-solid fa-bell"></i>
          <span class="badge-dot">3</span>
        </button>

        <button class="theme-toggle" id="themeToggle" role="switch" aria-checked="false" aria-label="Toggle dark mode">
          <span class="knob">
            <i class="fa-solid fa-sun icon-sun" aria-hidden="true"></i>
            <i class="fa-solid fa-moon icon-moon" aria-hidden="true"></i>
          </span>
        </button>

        <!-- Auth Unsigned State -->
        <div id="authUnsigned" style="display: none; align-items: center; gap: 8px;">
          <button id="btnAuthGuest" style="background: rgba(255,255,255,0.7); border: 1px solid rgba(0,0,0,0.1); padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 13px; cursor: pointer; color: var(--text-secondary); transition: all 0.2s;">Guest</button>
          <button id="btnAuthSignUp" style="background: var(--brand-teal); border: none; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 13px; cursor: pointer; color: white; box-shadow: 0 4px 10px rgba(13,148,136,0.3); transition: all 0.2s;">Sign Up / Login</button>
        </div>

        <!-- Auth Signed In State -->
        <div id="authSignedIn" style="display: none; align-items: center; gap: 12px;">
          <div id="authAccountInfo" style="cursor: pointer; display: flex; align-items: center; gap: 8px; background: rgba(20, 184, 166, 0.1); padding: 4px 14px 4px 4px; border-radius: 30px; border: 1px solid rgba(20, 184, 166, 0.2); transition: all 0.2s;">
            <div class="avatar" id="authAvatar" role="img" aria-label="User profile" style="width: 28px; height: 28px; font-size: 11.5px; background: var(--brand-teal); color: white;">US</div>
            <span id="authAccountName" style="font-weight: 600; font-size: 13px; color: var(--text-primary);">User</span>
          </div>
          <button id="btnAuthSignOut" aria-label="Sign out" style="background: transparent; border: 1px solid rgba(0,0,0,0.1); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); transition: all 0.2s;">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </header>`;

for(const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // Match <header class="topbar"> ... </header>
  const replaced = content.replace(/<header class="topbar">[\s\S]*?<\/header>/, newTopbar);
  fs.writeFileSync(file, replaced);
  console.log('Patched', file);
}
