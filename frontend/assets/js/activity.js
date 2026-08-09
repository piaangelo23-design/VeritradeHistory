const typeLabels = {
  trade: 'New verified trade',
  vouch: 'New vouch',
  value_change: 'Value change',
  new_item: 'New item',
  announcement: 'Announcement',
  market_update: 'Market update',
  sync: 'Sync',
  system: 'System'
};

document.addEventListener('DOMContentLoaded', async () => {
  MM2.mountLayout('activity');
  const { activities } = await MM2.api('/activities?limit=50');
  const feed = document.getElementById('activityFeed');
  feed.innerHTML = activities.length ? activities.map(a => `
    <div class="activity-item glass">
      <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap">
        <strong>${typeLabels[a.type] || a.type}${a.isTest ? ' (Test)' : ''}</strong>
        <span style="color:var(--text-secondary);font-size:0.85rem">${MM2.formatDate(a.createdAt)}</span>
      </div>
      <p style="margin-top:0.35rem">${a.title}</p>
      ${a.message ? `<p style="color:var(--text-secondary);font-size:0.9rem">${a.message}</p>` : ''}
    </div>
  `).join('') : `<div class="glass" style="padding:2rem;text-align:center;color:var(--text-secondary)">No activity yet.</div>`;

  MM2.initSocket({
    onTrade: () => location.reload()
  });
});
