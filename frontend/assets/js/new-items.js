document.addEventListener('DOMContentLoaded', async () => {
  MM2.mountLayout('new-items');
  const data = await MM2.api('/neblio');
  const items = data.items || [];
  const grid = document.getElementById('itemsGrid');
  grid.innerHTML = items.length ? items.map(item => `
    <article class="mm-card glass">
      ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:140px;object-fit:cover;border-radius:12px">` : '<div style="height:140px;background:rgba(59,130,246,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--text-secondary)">No Image</div>'}
      <h3>${item.name}</h3>
      <p style="color:var(--text-secondary)">Value: <strong style="color:var(--accent-cyan)">${MM2.formatNumber(item.value)}</strong></p>
      <p style="color:var(--text-secondary)">Rarity: ${item.rarity || '—'}</p>
      <p style="color:var(--text-secondary)">Added: ${MM2.formatDate(item.dateAdded)}</p>
      <span class="badge">${item.status || 'active'}</span>
    </article>
  `).join('') : `<div class="glass" style="padding:2rem;text-align:center;color:var(--text-secondary);grid-column:1/-1">No new items yet. Add items from the admin dashboard.</div>`;
});
