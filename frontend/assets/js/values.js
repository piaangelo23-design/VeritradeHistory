document.addEventListener('DOMContentLoaded', async () => {
  MM2.mountLayout('values');
  const data = await MM2.api('/neblio');
  document.getElementById('updateInfo').textContent = data.lastUpdate
    ? `Last update: ${MM2.formatDate(data.lastUpdate)} (${data.source})`
    : data.message;

  const list = data.valueList?.length ? data.valueList : (data.items || []);
  const tbody = document.getElementById('valuesBody');
  tbody.innerHTML = list.length ? list.map(item => `
    <tr>
      <td>${item.image ? `<img src="${item.image}" alt="" style="width:40px;height:40px;border-radius:8px;object-fit:cover">` : '—'}</td>
      <td>${item.name || item.itemName}</td>
      <td>${MM2.formatNumber(item.value)}</td>
      <td>${item.rarity || '—'}</td>
    </tr>
  `).join('') : `<tr><td colspan="4" style="text-align:center;color:var(--text-secondary)">Configure NEBLIO_API_BASE with an authorized API to load live values. Items can be managed from the admin panel.</td></tr>`;
});
