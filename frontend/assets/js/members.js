function escapeMemberText(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

document.addEventListener('DOMContentLoaded', async () => {
  MM2.mountLayout('members');
  const grid = document.getElementById('membersGrid');
  try {
    const { members, total } = await MM2.api('/members');
    document.getElementById('memberCount').textContent = `${MM2.formatNumber(total)} members`;
    grid.innerHTML = members.length ? members.map((member) => `
      <article class="member-card glass">
        <img class="member-avatar" src="${escapeMemberText(member.avatar)}" alt="">
        <div class="member-details">
          <h3>${escapeMemberText(member.displayName || member.username)}</h3>
          <p>@${escapeMemberText(member.username)}</p>
          <span class="badge ${member.isOnline ? '' : 'badge-offline'}">${member.isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </article>
    `).join('') : '<p style="color:var(--text-secondary)">No Discord members synced yet.</p>';
  } catch {
    grid.innerHTML = '<p style="color:var(--danger)">Members are not available yet. Start the Discord bot to sync them.</p>';
  }
});