const ASSETS = {
  logo: 'https://media.discordapp.net/attachments/1474771451554037801/1525567093863616634/image.png?ex=6a796d52&is=6a781bd2&hm=106bc29289882c1c7526fb808349dd837e19389093908d771d7189f47c7dd3d2&=&format=webp&quality=lossless',
  banner: 'https://media.discordapp.net/attachments/1474771451554037801/1525567093863616634/image.png?ex=6a796d52&is=6a781bd2&hm=106bc29289882c1c7526fb808349dd837e19389093908d771d7189f47c7dd3d2&=&format=webp&quality=lossless',
  discordInvite: 'https://discord.gg/HpPSfvjmmT'
};

let publicConfig = { discordInvite: ASSETS.discordInvite, syncInterval: 60 };
let socket = null;

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

async function loadPublicConfig() {
  try {
    publicConfig = await api('/config/public');
  } catch {
    publicConfig.discordInvite = ASSETS.discordInvite;
  }
  return publicConfig;
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num || 0);
}

function formatDate(date) {
  return new Date(date).toLocaleString();
}

function animateCounter(el, target, duration = 1200) {
  if (!el) return;
  const start = parseInt(el.dataset.current || el.textContent.replace(/,/g, ''), 10) || 0;
  const diff = target - start;
  const startTime = performance.now();
  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(start + diff * (1 - Math.pow(1 - progress, 3)));
    el.textContent = formatNumber(value);
    el.dataset.current = value;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initSocket(handlers = {}) {
  if (typeof io === 'undefined') return null;
  socket = io();
  if (handlers.onTrade) socket.on('trade:new', handlers.onTrade);
  if (handlers.onStats) socket.on('stats:update', handlers.onStats);
  return socket;
}

function showToast(title, body) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast glass';
  toast.innerHTML = `<strong>${title}</strong><div style="margin-top:0.35rem;color:var(--text-secondary);font-size:0.9rem">${body}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

function renderNavbar(activePage = '') {
  const pages = [
    { href: '/', label: 'Home', id: 'home' },
    { href: '/trades.html', label: 'Trades', id: 'trades' },
    { href: '/market-activity.html', label: 'Market', id: 'market' },
    { href: '/middlemen.html', label: 'Middlemen', id: 'middlemen' },
    { href: '/members.html', label: 'Members', id: 'members' },
    { href: '/values.html', label: 'Values', id: 'values' },
    { href: '/value-changes.html', label: 'Value Changes', id: 'value-changes' },
    { href: '/new-items.html', label: 'New Items', id: 'new-items' },
    { href: '/activity.html', label: 'Activity', id: 'activity' },
    { href: '/admin.html', label: 'Admin', id: 'admin' }
  ];

  return `
  <nav class="navbar">
    <div class="container">
      <a href="/" class="brand">
        <img src="${ASSETS.logo}" alt="MM2 Tracker Logo">
        <span class="gradient-text">MM2 Tracker</span>
      </a>
      <button class="nav-toggle" aria-label="Toggle menu">☰</button>
      <ul class="nav-links">
        ${pages.map(p => `<li><a href="${p.href}" class="${activePage === p.id ? 'active' : ''}">${p.label}</a></li>`).join('')}
        <li><a href="${ASSETS.discordInvite}" class="btn btn-discord" target="_blank" rel="noopener">Join Discord</a></li>
      </ul>
    </div>
  </nav>`;
}

function renderFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-banner" style="background-image:url('${ASSETS.banner}')"></div>
      <div class="footer-grid">
        <div>
          <div class="brand" style="margin-bottom:1rem">
            <img src="${ASSETS.logo}" alt="Logo" style="width:48px;height:48px;border-radius:12px">
            <span class="gradient-text">MM2 Tracker</span>
          </div>
          <p style="color:var(--text-secondary)">Premium Roblox MM2 Middleman + Trade Tracker. Real verified trades from our Discord server.</p>
        </div>
        <div>
          <h4>Navigation</h4>
          <ul class="footer-links">
            <li><a href="/trades.html">Trade History</a></li>
            <li><a href="/middlemen.html">Middlemen</a></li>
            <li><a href="/values.html">Value List</a></li>
            <li><a href="/activity.html">Activity Feed</a></li>
          </ul>
        </div>
        <div>
          <h4>Community</h4>
          <ul class="footer-links">
            <li><a href="${ASSETS.discordInvite}" target="_blank" rel="noopener">Join Discord</a></li>
            <li><a href="/admin.html">Admin Dashboard</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} MM2 Tracker. All rights reserved.</span>
        <span>Verified trades only — no fake data.</span>
      </div>
    </div>
  </footer>`;
}

function mountLayout(activePage) {
  const navMount = document.getElementById('navbar');
  const footerMount = document.getElementById('footer');
  if (navMount) navMount.innerHTML = renderNavbar(activePage);
  if (footerMount) footerMount.innerHTML = renderFooter();

  document.querySelector('.nav-toggle')?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('open');
  });
}

async function trackVisitOnce() {
  if (sessionStorage.getItem('visitTracked')) return;
  try {
    await api('/stats/visit', { method: 'POST' });
    sessionStorage.setItem('visitTracked', '1');
  } catch { /* ignore */ }
}

function tradeSizeLabel(size) {
  return { small: 'Small', medium: 'Medium', large: 'Large', test: 'Test' }[size] || size;
}

function middlemanDisplay(mm) {
  return mm || 'Direct Trade';
}

window.MM2 = {
  ASSETS,
  api,
  loadPublicConfig,
  formatNumber,
  formatDate,
  animateCounter,
  initSocket,
  showToast,
  mountLayout,
  trackVisitOnce,
  tradeSizeLabel,
  middlemanDisplay
};
