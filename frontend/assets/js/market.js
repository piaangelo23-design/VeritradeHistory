let volumeChart;

function renderVolumeChart(snapshots) {
  const labels = snapshots.map((snapshot) => MM2.formatDate(snapshot.timestamp));
  const volume = snapshots.map((snapshot) => Number(snapshot.tradeVolume || 0));
  const context = document.getElementById('volumeChart');
  if (!context || typeof Chart === 'undefined' || !snapshots.length) {
    document.getElementById('emptyState').style.display = 'block';
    return;
  }
  volumeChart?.destroy();
  volumeChart = new Chart(context, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Verified trades', data: volume, borderColor: '#6ea8fe', backgroundColor: 'rgba(110,168,254,.14)', fill: true, tension: .25 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
  });
}

async function loadMarketActivity() {
  const status = document.getElementById('marketStatus');
  try {
    const data = await MM2.api('/neblio');
    const snapshots = Array.isArray(data.marketActivity) ? data.marketActivity : [];
    const latest = snapshots[snapshots.length - 1];
    document.getElementById('totalTrades').textContent = latest ? MM2.formatNumber(latest.totalTrades || latest.tradeVolume) : '-';
    document.getElementById('tradeVolume').textContent = latest ? MM2.formatNumber(latest.tradeVolume) : '-';
    document.getElementById('lastUpdate').textContent = latest ? MM2.formatDate(latest.timestamp) : '-';
    renderVolumeChart(snapshots);
    status.textContent = data.provider?.available ? 'Provider connected' : 'Awaiting authorized provider data';
  } catch (error) {
    status.textContent = 'Market data unavailable';
    document.getElementById('emptyState').textContent = error.message;
    document.getElementById('emptyState').style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  MM2.mountLayout('market');
  loadMarketActivity();
  MM2.initSocket({ onTrade: loadMarketActivity });
});
