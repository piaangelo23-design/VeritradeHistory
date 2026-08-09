let adminToken = localStorage.getItem('mm2_admin_token');

function authHeaders() {
  return { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };
}

async function adminApi(path, options = {}) {
  const res = await fetch(`/api/admin${path}`, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } });
  if (res.status === 401) { logout(); throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function logout() {
  adminToken = null;
  localStorage.removeItem('mm2_admin_token');
  location.reload();
}

function showPanel(id) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav button').forEach(b => b.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.querySelector(`.admin-nav button[data-panel="${id}"]`)?.classList.add('active');
}

function statusDot(ok) { return ok ? '🟢' : '🔴'; }

async function loadDashboard() {
  const { stats, dashboard, settings } = await adminApi('/dashboard');
  const bot = dashboard.bot || {};
  document.getElementById('botStatusGrid').innerHTML = `
    <div class="status-item glass"><strong>Discord Bot</strong><p>${statusDot(bot.connected)} ${bot.connected ? 'Connected' : 'Offline'}</p></div>
    <div class="status-item glass"><strong>Discord Server</strong><p>${statusDot(bot.guildConnected)} ${bot.guildConnected ? 'Connected' : 'Not Found'}</p></div>
    <div class="status-item glass"><strong>Trade Channel</strong><p>${statusDot(bot.channelAccessible)} ${bot.channelAccessible ? 'Accessible' : 'No Access'}</p></div>
    <div class="status-item glass"><strong>Trade Tracking</strong><p>${statusDot(bot.trackingActive && settings.trackingEnabled)} ${bot.trackingActive && settings.trackingEnabled ? 'Active' : 'Disabled'}</p></div>
    <div class="status-item glass"><strong>Last Trade</strong><p>${dashboard.lastTradeAt ? MM2.formatDate(dashboard.lastTradeAt) : 'None'}</p></div>
    <div class="status-item glass"><strong>Last Sync</strong><p>${dashboard.lastSyncAt ? MM2.formatDate(dashboard.lastSyncAt) : 'None'}</p></div>
  `;

  document.getElementById('settingsForm').innerHTML = `
    <div class="form-group"><label>Trade Channel ID</label><input id="setChannel" value="${settings.tradeChannelId || ''}"></div>
    <div class="form-group"><label>Guild ID</label><input id="setGuild" value="${settings.guildId || ''}"></div>
    <div class="form-group"><label>Tracking Enabled</label><select id="setTracking"><option value="true" ${settings.trackingEnabled ? 'selected' : ''}>Enabled</option><option value="false" ${!settings.trackingEnabled ? 'selected' : ''}>Disabled</option></select></div>
    <div class="form-group"><label>Sync Interval (seconds)</label><input id="setSync" type="number" value="${settings.syncInterval || 60}"></div>
    <div class="form-group"><label>Small Trade Max</label><input id="setSmall" type="number" value="${settings.smallTradeMax || 500}"></div>
    <div class="form-group"><label>Medium Trade Max</label><input id="setMedium" type="number" value="${settings.mediumTradeMax || 5000}"></div>
    <div class="form-group"><label>Parser Header Pattern</label><input id="setParserHeader" value="${settings.tradeParser?.headerPattern || 'TRADE COMPLETED'}"></div>
    <button class="btn btn-primary" id="saveSettings">Save Settings</button>
  `;

  document.getElementById('saveSettings').onclick = async () => {
    await adminApi('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        tradeChannelId: document.getElementById('setChannel').value,
        guildId: document.getElementById('setGuild').value,
        trackingEnabled: document.getElementById('setTracking').value === 'true',
        syncInterval: Number(document.getElementById('setSync').value),
        smallTradeMax: Number(document.getElementById('setSmall').value),
        mediumTradeMax: Number(document.getElementById('setMedium').value),
        tradeParser: { headerPattern: document.getElementById('setParserHeader').value }
      })
    });
    alert('Settings saved');
    loadDashboard();
  };

  const { middlemen } = await MM2.api('/middlemen');
  document.getElementById('middlemenAdmin').innerHTML = middlemen.map(mm => `
    <div class="glass" style="padding:1rem;margin-bottom:0.75rem">
      <strong>${mm.name}</strong> — Vouches: ${mm.vouches} | Trades: ${mm.completedTrades}
      <div style="margin-top:0.5rem;display:flex;gap:0.5rem;flex-wrap:wrap">
        <input data-mm="${mm._id}" class="vouch-input" type="number" value="${mm.vouches}" style="width:120px">
        <button class="btn btn-outline save-vouch" data-id="${mm._id}">Update Vouches</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.save-vouch').forEach(btn => {
    btn.onclick = async () => {
      const input = document.querySelector(`.vouch-input[data-mm="${btn.dataset.id}"]`);
      await adminApi('/vouches', { method: 'POST', body: JSON.stringify({ middlemanId: btn.dataset.id, count: Number(input.value) }) });
      loadDashboard();
    };
  });

  const { logs } = await adminApi('/logs');
  document.getElementById('logsPanel').innerHTML = logs.map(l => `
    <div class="activity-item glass">
      <strong>${l.type}</strong> — ${l.message}
      <div style="color:var(--text-secondary);font-size:0.85rem">${MM2.formatDate(l.createdAt)}</div>
    </div>
  `).join('') || '<p>No logs yet.</p>';
}

document.addEventListener('DOMContentLoaded', async () => {
  MM2.mountLayout('admin');

  if (!adminToken) {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      try {
        const { token } = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        }).then(r => r.json());
        adminToken = token;
        localStorage.setItem('mm2_admin_token', token);
        location.reload();
      } catch {
        document.getElementById('loginError').textContent = 'Invalid credentials';
      }
    };
    return;
  }

  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('adminSection').style.display = 'block';
  document.getElementById('logoutBtn').onclick = logout;

  document.querySelectorAll('.admin-nav button').forEach(btn => {
    btn.onclick = () => showPanel(btn.dataset.panel);
  });

  document.getElementById('refreshBtn').onclick = async () => {
    await adminApi('/refresh', { method: 'POST' });
    loadDashboard();
  };

  document.getElementById('testTradeBtn').onclick = async () => {
    await adminApi('/test-trade', { method: 'POST' });
    alert('Test trade created');
  };

  showPanel('panelOverview');
  await loadDashboard();
});
