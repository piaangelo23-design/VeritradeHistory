let currentPage = 1;
let memberDirectory = [];
let memberPage = 1;
let hasRealTrades = false;
const memberPageSize = 10;
const middlemanDirectory = [
  { name: 'Nexus', avatar: 'https://images-ext-1.discordapp.net/external/0YuLdkrSFKz-YwUpsuSBoHIYUHyPqst1ktVrn5vNfU8/https/cdn.discordapp.com/avatars/1503592341070676132/943a4104c662e1ae3d3c3da649605c8c.webp?format=webp' },
  { name: '[MM] Sheikh Yazan', avatar: 'https://images-ext-1.discordapp.net/external/TKPwvPdy3ucDh5LY8zJwYN5GkRVknya3bVTZLJ3FjeA/https/cdn.discordapp.com/avatars/1258316275554324512/82b9447ddd71839d5efe87351ca54d67.webp?format=webp' },
  { name: 'Ax^Kane ❣MM❣:✅', avatar: 'https://images-ext-1.discordapp.net/external/Gvu61eOBzyNhSSGmbrX4WK7DsHVtLmwJ_5jy6VrDBn8/https/cdn.discordapp.com/avatars/1393307310428000286/96504c97e686e1394d3a02c70e71f43a.webp?format=webp' },
  { name: 'BKA AN DIE MACHT', avatar: 'https://images-ext-1.discordapp.net/external/ChrUUzz0JrUaa4GoszF7adILMTPM2HN4bmuMVyDYhKY/https/cdn.discordapp.com/avatars/1124258480459616327/6a1a46f22e52730281cc082b1c473617.webp?format=webp' }
];

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
  return trade.paymentType === 'robux' ? 'Robux' : trade.paymentType === 'money' ? 'Money' : 'N/A';
}

function profileOnlyRow(member) {
  return `
    <tr class="profile-only-row">
      <td>${traderCell(member.displayName || member.username, member)}</td>
      <td>@${escapeHtml(member.username)}</td>
      <td>N/A</td>
      <td>N/A</td>
      <td>N/A</td>
      <td>N/A</td>
    </tr>
  `;
}

function middlemanCell(name) {
  const normalized = String(name || '').toLowerCase();
  const profile = middlemanDirectory.find(item => normalized.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(normalized));
  if (!profile) return escapeHtml(MM2.middlemanDisplay(name));
  return `<div class="trader-cell"><img class="trader-avatar" src="${profile.avatar}" alt=""><span><strong>${escapeHtml(name)}</strong></span></div>`;
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
  hasRealTrades = trades.length > 0;
  tbody.innerHTML = hasRealTrades ? trades.map(t => `
    <tr>
      <td>${traderCell(t.buyer, t.buyerProfile)}</td>
      <td>${traderCell(t.seller, t.sellerProfile)}</td>
      <td>${paymentLabel(t)}</td>
      <td>${escapeHtml(`${t.buyerItem} -> ${t.sellerItem}`)}</td>
      <td>${paymentLabel(t)}</td>
      <td>${middlemanCell(t.middleman)}</td>
    </tr>
  `).join('') : memberDirectory.length
    ? memberDirectory.slice((memberPage - 1) * memberPageSize, memberPage * memberPageSize).map(profileOnlyRow).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary)">No verified Money/Robux-to-item trades recorded yet.</td></tr>';

  const totalPages = hasRealTrades ? (pagination.pages || 1) : Math.ceil(memberDirectory.length / memberPageSize);
  document.getElementById('pageInfo').textContent = hasRealTrades
    ? `Page ${pagination.page} of ${pagination.pages || 1} (${pagination.total} total)`
    : `Page ${memberPage} of ${totalPages} (${memberDirectory.length} profiles)`;
  document.getElementById('prevPage').disabled = (hasRealTrades ? currentPage : memberPage) === 1;
  document.getElementById('nextPage').disabled = (hasRealTrades ? currentPage : memberPage) >= totalPages;
}

async function loadTradeMembers() {
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
    document.title = `Trade History - ${MM2.formatNumber(total)} Discord Members`;
  } catch {
    memberDirectory = [];
  }
}

function bindControls() {
  document.getElementById('applyFilters')?.addEventListener('click', () => { currentPage = 1; loadTrades(); });
  document.getElementById('prevPage')?.addEventListener('click', () => {
    if (hasRealTrades && currentPage > 1) { currentPage -= 1; loadTrades(); }
    if (!hasRealTrades && memberPage > 1) { memberPage -= 1; loadTrades(); }
  });
  document.getElementById('nextPage')?.addEventListener('click', () => {
    if (hasRealTrades) currentPage += 1;
    else memberPage += 1;
    loadTrades();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  MM2.mountLayout('trades');
  bindControls();
  await loadTradeMembers();
  await loadTrades();
  MM2.initSocket({ onTrade: () => loadTrades() });
});
