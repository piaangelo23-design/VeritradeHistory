let currentPage = 1;
let memberDirectory = [];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function traderCell(name, profile) {
  const normalizedName = String(name || '').trim().toLowerCase();
  const directoryProfile = memberDirectory.find(member => [member.username, member.displayName]
    .some(value => String(value || '').trim().toLowerCase() === normalizedName));
  profile = profile || directoryProfile;
  const avatar = profile?.avatar
    ? `<img class="trader-avatar" src="${escapeHtml(profile.avatar)}" alt="">`
    : '<span class="trader-avatar trader-avatar-fallback">?</span>';
  const displayName = escapeHtml(profile?.displayName || name);
  const username = profile?.username && profile.username !== name
    ? `<small>@${escapeHtml(profile.username)}</small>`
    : '';
  return `<div class="trader-cell">${avatar}<span><strong>${displayName}</strong>${username}</span></div>`;
}

function paymentLabel(trade) {
  if (!trade.paymentType) return escapeHtml(MM2.formatNumber(trade.value));
  const amount = trade.paymentAmount ?? trade.value;
  return `${escapeHtml(MM2.formatNumber(amount))} ${escapeHtml(trade.paymentType === 'robux' ? 'Robux' : 'Money')}`;
}

async function loadTrades() {
  const params = new URLSearchParams({
    page: currentPage,
    limit: 15,
    search: document.getElementById('searchInput')?.value || '',
    sort: document.getElementById('sortSelect')?.value || 'completedAt',
    order: document.getElementById('orderSelect')?.value || 'desc',
    tradeSize: document.getElementById('sizeFilter')?.value || '',
    middleman: document.getElementById('mmFilter')?.value || ''
  });

  const { trades, pagination } = await MM2.api(`/trades?${params}`);
  const tbody = document.getElementById('tradesBody');
  tbody.innerHTML = trades.length ? trades.map(t => `
    <tr>
      <td>${traderCell(t.buyer, t.buyerProfile)}</td>
      <td>${traderCell(t.seller, t.sellerProfile)}</td>
      <td>${escapeHtml(t.buyerItem)}</td>
      <td>${escapeHtml(t.sellerItem)}</td>
      <td>${paymentLabel(t)}</td>
      <td>${MM2.middlemanDisplay(t.middleman)}</td>
      <td>${MM2.tradeSizeLabel(t.tradeSize)}</td>
      <td>${t.status}</td>
      <td>${t.verified ? '✓ Verified' : t.isTest ? '⚠ Test' : '—'}</td>
    </tr>
  `).join('') : '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary)">No verified Money/Robux-to-item trades recorded yet.</td></tr>';

  document.getElementById('pageInfo').textContent = `Page ${pagination.page} of ${pagination.pages || 1} (${pagination.total} total)`;
}

async function loadTradeMembers() {
  const grid = document.getElementById('tradeMembersGrid');
  if (!grid) return;
  try {
    let members;
    try {
      const staticResponse = await fetch('/assets/data/discord-members.json');
      members = await staticResponse.json();
    } catch {
      const response = await MM2.api('/members');
      members = response.members;
    }
    members = members.map(member => ({
      ...member,
      avatar: member.avatar || member.avatarUrl || null
    }));
    const total = members.length;
    memberDirectory = members;
    document.getElementById('tradeMemberCount').textContent = `${MM2.formatNumber(total)} members`;
    grid.innerHTML = members.length ? members.map((member) => `
      <article class="member-card glass">
        <img class="member-avatar" src="${escapeHtml(member.avatar)}" alt="">
        <div class="member-details">
          <h3>${escapeHtml(member.displayName || member.username)}</h3>
          <p>@${escapeHtml(member.username)}</p>
          <span class="badge ${member.isOnline ? '' : 'badge-offline'}">${member.isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </article>
    `).join('') : '<p style="color:var(--text-secondary)">No Discord members synced yet.</p>';
  } catch {
    grid.innerHTML = '<p style="color:var(--text-secondary)">Discord members will appear after the bot syncs the server.</p>';
  }
}

function bindControls() {
  document.getElementById('applyFilters')?.addEventListener('click', () => { currentPage = 1; loadTrades(); });
  document.getElementById('prevPage')?.addEventListener('click', () => { if (currentPage > 1) { currentPage -= 1; loadTrades(); } });
  document.getElementById('nextPage')?.addEventListener('click', () => { currentPage += 1; loadTrades(); });
}

document.addEventListener('DOMContentLoaded', async () => {
  MM2.mountLayout('trades');
  bindControls();
  await Promise.all([loadTradeMembers(), loadTrades()]);
  MM2.initSocket({ onTrade: () => loadTrades() });
});
