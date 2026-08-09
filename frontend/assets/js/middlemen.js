document.addEventListener('DOMContentLoaded', async () => {
  MM2.mountLayout('middlemen');
  const { middlemen } = await MM2.api('/middlemen');
  const grid = document.getElementById('middlemenGrid');
  grid.innerHTML = middlemen.map(mm => `
    <article class="mm-card glass" id="${mm.slug}">
      <div class="mm-header">
        <img class="mm-avatar" src="${mm.avatar}" alt="${mm.name}">
        <div>
          <h3>${mm.displayName || mm.name}</h3>
          ${mm.isTrusted ? '<span class="badge">Trusted Middleman</span>' : ''}
          ${mm.isPlaceholder ? '<span class="badge badge-offline">Placeholder</span>' : ''}
          <div style="margin-top:0.35rem"><span class="badge ${mm.isOnline ? '' : 'badge-offline'}">${mm.isOnline ? 'Online' : 'Offline'}</span></div>
        </div>
      </div>
      <div class="mm-stats">
        <div><div class="mm-stat-value">${MM2.formatNumber(mm.vouches)}</div><div class="mm-stat-label">Total Vouches</div></div>
        <div><div class="mm-stat-value">${MM2.formatNumber(mm.completedTrades)}</div><div class="mm-stat-label">Completed Trades</div></div>
        <div><div class="mm-stat-value">${mm.successRate}%</div><div class="mm-stat-label">Success Rate</div></div>
      </div>
      <div class="mm-actions">
        <a class="btn btn-outline" href="#${mm.slug}">View Profile</a>
        <a class="btn btn-discord" href="${MM2.ASSETS.discordInvite}" target="_blank">Join Discord</a>
      </div>
    </article>
  `).join('');
});
