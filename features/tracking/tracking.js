// features/tracking/tracking.js
// import { queryTabs } from '../../shared/chromeUtils.js';

window.initTracking = function(container, onBack) {
  // If the container is empty (as in index.html), use it; otherwise, fallback to document.body
  if (!container) {
    container = document.getElementById('tracking-feature') || document.body;
  }
  container.innerHTML = `
    <div class="card" id="trackingCard">
      <h2>Tab Time Tracking</h2>
      <button id="startTrackingBtn">Start Tracking</button>
      <button id="stopTrackingBtn">Stop Tracking</button>
      <button id="viewResultsBtn">View Results</button>
      <button id="exportCSVBtn">Export CSV</button>
      <div id="trackingStatus"></div>
      <div id="trackingResults" style="margin-top: 12px;"></div>
      <button id="backBtn">Back</button>
    </div>
    <style>
      .cute-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
        background: #f7fafd;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }
      .cute-table th, .cute-table td {
        padding: 8px 10px;
        text-align: left;
      }
      .cute-table th {
        background: #e3f0fc;
        font-weight: bold;
      }
      .cute-table tr:nth-child(even) {
        background: #f0f7ff;
      }
      .tab-icon {
        display: inline-block;
        width: 18px;
        height: 18px;
        background: #b3e5fc;
        border-radius: 50%;
        margin-right: 6px;
        vertical-align: middle;
      }
      .tab-title {
        font-weight: 500;
      }
    </style>
  `;
  document.getElementById('startTrackingBtn').onclick = () => {
    chrome.runtime.sendMessage({type: 'START_TRACKING'}, () => {
      setStatus('Tracking started.');
      // Do not show results automatically
    });
  };
  document.getElementById('stopTrackingBtn').onclick = () => {
    chrome.runtime.sendMessage({type: 'STOP_TRACKING'}, () => {
      setStatus('Tracking stopped.');
      // Do not show results automatically
    });
  };
  document.getElementById('viewResultsBtn').onclick = function() {
    showResults();
    // Hide tracking controls, show only results, export, and back
    document.getElementById('startTrackingBtn').style.display = 'none';
    document.getElementById('stopTrackingBtn').style.display = 'none';
    document.getElementById('viewResultsBtn').style.display = 'none';
    document.getElementById('trackingStatus').style.display = 'none';
    // Results, export, and back remain visible
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
  function showResults() {
    chrome.runtime.sendMessage({type: 'GET_TRACKING_DATA'}, response => {
      const resultsDiv = document.getElementById('trackingResults');
      if (response && response.data && response.data.length) {
        let table = `<table class='cute-table'><tr><th></th><th>Tab Title</th><th>Time Used</th></tr>`;
        response.data.forEach((tab, i) => {
          const min = Math.floor(tab.seconds / 60);
          const sec = tab.seconds % 60;
          const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;
          table += `<tr><td><span class='tab-icon'></span></td><td class='tab-title'>${tab.title}</td><td>${timeStr}</td></tr>`;
        });
        table += `</table>`;
        resultsDiv.innerHTML = `<b>Tab Tracking Results:</b><br>` + table;
      } else {
        resultsDiv.innerHTML = '<i>No tracking data available.</i>';
      }
    });
  }
  // Remove: showResults();
} 