// features/session/session.js
// import { queryTabs, getFromStorage, setInStorage, createTab } from '../../shared/chromeUtils.js';

window.initSession = function(container, onBack) {
  container.innerHTML = `
    <div class="card">
      <h2>Session Save & Restore</h2>
      <button id="saveSessionBtn">Save Session</button>
      <button id="restoreSessionBtn">Restore Session</button>
      <div id="sessionList"></div>
      <button id="backBtn">Back</button>
    </div>
  `;
  document.getElementById('saveSessionBtn').onclick = async () => {
    // Save all tabs in all windows
    chrome.runtime.sendMessage({type: 'SAVE_SESSION'}, response => {
      updateSessionList();
    });
  };
  document.getElementById('restoreSessionBtn').onclick = async () => {
    const { tabSessions = {} } = await getFromStorage(['tabSessions']);
    const names = Object.keys(tabSessions);
    if (!names.length) {
      alert('No saved sessions.');
      return;
    }
    const sessionName = prompt('Enter session name to restore:\n' + names.join('\n'));
    if (!sessionName || !names.includes(sessionName)) {
      alert('Invalid session name.');
      return;
    }
    chrome.runtime.sendMessage({type: 'RESTORE_SESSION', sessionName}, response => {
      if (response && response.status === 'success') {
        alert(`Restored session '${sessionName}' with ${response.count} tabs.`);
      } else {
        alert('Failed to restore session.');
      }
    });
  };
  document.getElementById('backBtn').onclick = onBack;
  async function updateSessionList() {
    const { tabSessions = {} } = await getFromStorage(['tabSessions']);
    document.getElementById('sessionList').innerHTML =
      '<b>Saved Sessions:</b><br>' + Object.keys(tabSessions).join('<br>');
  }
  updateSessionList();
} 