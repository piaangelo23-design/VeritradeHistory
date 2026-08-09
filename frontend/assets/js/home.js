let middlemen = [];
let mmIndex = 0;

function renderLiveTrade(trade) {
  const el = document.getElementById('liveTrade');
  if (!el) return;

  if (!trade || trade.isTest) {
    el.className = 'live-trade-card glass waiting';
    el.innerHTML = '<p>Waiting for the next verified trade...</p>';
    return;
  }

  el.className = 'live-trade-card glass success';
  el.innerHTML = `
    <h3 style="color:var(--success);margin-bottom:1rem">✓ Trade Successfully Completed</h3>
    <div class="trade-row"><span>Buyer:</span><strong>${trade.buyer}</strong></div>
    <div class="trade-row"><span>Seller:</span><strong>${trade.seller}</strong></div>
    <div class="trade-row"><span>${trade.buyer} gave:</span><strong>${trade.buyerItem}</strong></div>
    <div class="trade-row"><span>${trade.seller} gave:</span><strong>${trade.sellerItem}</strong></div>
    <div class="trade-row"><span>Value:</span><strong>${MM2.formatNumber(trade.value)}</strong></div>
    <div class="trade-row"><span>Status:</span><strong>${trade.status}</strong></div>
    <div class="trade-row"><span>Middleman:</span><strong>${MM2.middlemanDisplay(trade.middleman)}</strong></div>
  `;
}

function updateStats(stats) {
  const map = {
    statSmall: stats.smallTrades,
    statMedium: stats.mediumTrades,
    statLarge: stats.largeTrades,
    statTotalTrades: stats.totalTrades,
    statVouches: stats.totalVouches,
    statVisits: stats.totalVisits,
    statMembers: stats.totalMembers,
    statOnline: stats.onlineMembers,
    statActiveMM: stats.activeMiddlemen,
    statValueChanges: stats.valueChanges,
    statNewItems: stats.newItems
  };
  Object.entries(map).forEach(([id, value]) => MM2.animateCounter(document.getElementById(id), value));
}

function renderMiddlemenCards(list) {
  const grid = document.getElementById('middlemenPreview');
  if (!grid) return;
  grid.innerHTML = list.slice(0, 4).map(mm => `
    <article class="mm-card glass">
      <div class="mm-header">
        <img class="mm-avatar" src="${mm.avatar}" alt="${mm.name}">
        <div>
          <h3>${mm.displayName || mm.name}</h3>
          <span class="badge">Trusted Middleman</span>
          <div style="margin-top:0.35rem"><span class="badge ${mm.isOnline ? '' : 'badge-offline'}">${mm.isOnline ? 'Online' : 'Offline'}</span></div>
        </div>
      </div>
      <div class="mm-stats">
        <div><div class="mm-stat-value">${MM2.formatNumber(mm.vouches)}</div><div class="mm-stat-label">Vouches</div></div>
        <div><div class="mm-stat-value">${MM2.formatNumber(mm.completedTrades)}</div><div class="mm-stat-label">Trades</div></div>
        <div><div class="mm-stat-value">${mm.successRate}%</div><div class="mm-stat-label">Success</div></div>
      </div>
      <div class="mm-actions">
        <a class="btn btn-outline" href="/middlemen.html#${mm.slug}">View Profile</a>
        <a class="btn btn-discord" href="${MM2.ASSETS.discordInvite}" target="_blank">Join Discord</a>
      </div>
    </article>
  `).join('');
}

function rotateVouchReminder() {
  const box = document.getElementById('vouchReminder');
  if (!box || !middlemen.length) return;
  const mm = middlemen[mmIndex % middlemen.length];
  mmIndex += 1;
  box.classList.remove('fade');
  void box.offsetWidth;
  box.classList.add('fade');
  box.innerHTML = `
    <img src="${mm.avatar}" alt="${mm.name}">
    <div>
      <div class="badge" style="margin-bottom:0.35rem">Trusted Middleman</div>
      <strong>${mm.displayName || mm.name}</strong>
      <p style="color:var(--text-secondary);margin-top:0.25rem">
        ${MM2.formatNumber(mm.vouches)} vouches · ${MM2.formatNumber(mm.completedTrades)} completed trades
      </p>
      <p style="margin-top:0.35rem">Need a trusted middleman? Open a ticket in our Discord server.</p>
    </div>
    <a class="btn btn-discord" href="${MM2.ASSETS.discordInvite}" target="_blank" style="margin-left:auto">Join Discord</a>
  `;
}

async function initHome() {
  MM2.mountLayout('home');
  await MM2.trackVisitOnce();

  const [{ stats }, { middlemen: mmList }, { trade }] = await Promise.all([
    MM2.api('/stats'),
    MM2.api('/middlemen'),
    MM2.api('/trades/latest')
  ]);

  middlemen = mmList.filter(m => !m.isPlaceholder);
  updateStats(stats);
  renderMiddlemenCards(mmList);
  renderLiveTrade(trade?.isTest ? null : trade);
  rotateVouchReminder();
  setInterval(rotateVouchReminder, 6000);

  MM2.initSocket({
    onTrade: (newTrade) => {
      if (newTrade.isTest) return;
      renderLiveTrade(newTrade);
      MM2.showToast('✓ New Trade Completed', `${newTrade.buyer} ↔ ${newTrade.seller}<br>${newTrade.buyerItem} ↔ ${newTrade.sellerItem}`);
    },
    onStats: updateStats
  });

  setInterval(async () => {
    try {
      const cfg = await MM2.loadPublicConfig();
      const { trade: latest } = await MM2.api('/trades/latest');
      if (latest && !latest.isTest) renderLiveTrade(latest);
    } catch { /* ignore */ }
  }, 60000);
}

document.addEventListener('DOMContentLoaded', initHome);
