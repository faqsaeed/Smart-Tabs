// features/tracking/tracking.js
// import { queryTabs } from '../../shared/chromeUtils.js';

window.initTracking = function(container, onBack) {
  container.innerHTML = `
    <div class="card">
      <h2>Tab Time Tracking</h2>
      <button id="startTrackingBtn">Start Tracking</button>
      <button id="stopTrackingBtn">Stop Tracking</button>
      <button id="refreshTrackingBtn">Refresh Results</button>
      <button id="exportCSVBtn">Export CSV</button>
      <div id="trackingStatus"></div>
      <div id="trackingResults"></div>
      <button id="backBtn">Back</button>
    </div>
  `;
  document.getElementById('startTrackingBtn').onclick = () => {
    chrome.runtime.sendMessage({type: 'START_TRACKING'}, () => {
      setStatus('Tracking started.');
      showResults();
    });
  };
  document.getElementById('stopTrackingBtn').onclick = () => {
    chrome.runtime.sendMessage({type: 'STOP_TRACKING'}, () => {
      setStatus('Tracking stopped.');
      showResults();
    });
  };
  document.getElementById('refreshTrackingBtn').onclick = showResults;
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
  function showResults() {
    chrome.runtime.sendMessage({type: 'GET_TRACKING_DATA'}, response => {
      const resultsDiv = document.getElementById('trackingResults');
      if (response && response.data && response.data.length) {
        resultsDiv.innerHTML = '<b>Tab Tracking Results:</b><br>' +
          response.data.map(tab => `${tab.title} (${tab.url}): ${tab.seconds} sec`).join('<br>');
      } else {
        resultsDiv.innerHTML = '<i>No tracking data available.</i>';
      }
    });
  }
  showResults();
} 