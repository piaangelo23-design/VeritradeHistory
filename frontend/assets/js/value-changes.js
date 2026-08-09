document.addEventListener('DOMContentLoaded', async () => {
  MM2.mountLayout('value-changes');
  const data = await MM2.api('/neblio');
  const changes = data.valueChanges?.length ? data.valueChanges : (data.valueChangesFromDb || []);
  const tbody = document.getElementById('changesBody');
  tbody.innerHTML = changes.length ? changes.map(c => `
    <tr>
      <td>${c.itemName}</td>
      <td>${MM2.formatNumber(c.previousValue)}</td>
      <td>${MM2.formatNumber(c.newValue)}</td>
      <td style="color:${c.change >= 0 ? 'var(--success)' : 'var(--danger)'}">${c.change >= 0 ? '+' : ''}${MM2.formatNumber(c.change)}</td>
      <td>${MM2.formatDate(c.detectedAt)}</td>
    </tr>
  `).join('') : `<tr><td colspan="5" style="text-align:center;color:var(--text-secondary)">No value changes recorded yet.</td></tr>`;
});
