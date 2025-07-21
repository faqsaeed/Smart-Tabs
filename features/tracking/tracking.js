// features/tracking/tracking.js
// import { queryTabs } from '../../shared/chromeUtils.js';

export function initTracking(container, onBack) {
  container.innerHTML = `
    <div class="card">
      <h2>Tab Time Tracking</h2>
      <button id="startTrackingBtn">Start Tracking</button>
      <button id="stopTrackingBtn">Stop Tracking</button>
      <button id="exportCSVBtn">Export CSV</button>
      <div id="trackingStatus"></div>
      <button id="backBtn">Back</button>
    </div>
  `;
  document.getElementById('startTrackingBtn').onclick = () => {
    chrome.runtime.sendMessage({type: 'START_TRACKING'}, () => {
      setStatus('Tracking started.');
    });
  };
  document.getElementById('stopTrackingBtn').onclick = () => {
    chrome.runtime.sendMessage({type: 'STOP_TRACKING'}, () => {
      setStatus('Tracking stopped.');
    });
  };
  document.getElementById('exportCSVBtn').onclick = () => {
    chrome.runtime.sendMessage({type: 'EXPORT_CSV'}, response => {
      if (response && response.csv) {
        downloadCSV(response.csv);
        setStatus('CSV exported!');
      } else {
        setStatus('No tracking data to export.');
      }
    });
  };
  document.getElementById('backBtn').onclick = onBack;
  function setStatus(msg) {
    document.getElementById('trackingStatus').textContent = msg;
  }
  function downloadCSV(csv) {
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tab_times.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
} 