let currentPage = 1;

async function loadTrades() {
  const params = new URLSearchParams({
    page: currentPage,
    limit: 15,
    search: document.getElementById('searchInput')?.value || '',
    sort: document.getElementById('sortSelect')?.value || 'completedAt',
    order: document.getElementById('orderSelect')?.value || 'desc',
    tradeSize: document.getElementById('sizeFilter')?.value || '',
    middleman: document.getElementById('mmFilter')?.value || '',
    dateFrom: document.getElementById('dateFrom')?.value || '',
    dateTo: document.getElementById('dateTo')?.value || ''
  });

  const { trades, pagination } = await MM2.api(`/trades?${params}`);
  const tbody = document.getElementById('tradesBody');
  tbody.innerHTML = trades.length ? trades.map(t => `
    <tr>
      <td>${MM2.formatDate(t.completedAt)}</td>
      <td>${t.buyer}</td>
      <td>${t.seller}</td>
      <td>${t.buyerItem}</td>
      <td>${t.sellerItem}</td>
      <td>${MM2.formatNumber(t.value)}</td>
      <td>${MM2.middlemanDisplay(t.middleman)}</td>
      <td>${MM2.tradeSizeLabel(t.tradeSize)}</td>
      <td>${t.status}</td>
      <td>${t.verified ? '✓ Verified' : t.isTest ? '⚠ Test' : '—'}</td>
    </tr>
  `).join('') : '<tr><td colspan="10" style="text-align:center;color:var(--text-secondary)">No trades found</td></tr>';

  document.getElementById('pageInfo').textContent = `Page ${pagination.page} of ${pagination.pages || 1} (${pagination.total} total)`;
}

function bindControls() {
  document.getElementById('applyFilters')?.addEventListener('click', () => { currentPage = 1; loadTrades(); });
  document.getElementById('prevPage')?.addEventListener('click', () => { if (currentPage > 1) { currentPage -= 1; loadTrades(); } });
  document.getElementById('nextPage')?.addEventListener('click', () => { currentPage += 1; loadTrades(); });
}

document.addEventListener('DOMContentLoaded', async () => {
  MM2.mountLayout('trades');
  bindControls();
  await loadTrades();
  MM2.initSocket({ onTrade: () => loadTrades() });
});
