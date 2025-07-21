// features/session/session.js
// import { queryTabs, getFromStorage, setInStorage, createTab } from '../../shared/chromeUtils.js';

export function initSession(container, onBack) {
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
    const tabs = await queryTabs({currentWindow: true});
    const sessionTabs = tabs.map(tab => ({title: tab.title, url: tab.url}));
    const sessionName = prompt('Enter a name for this session (optional):') || `Session-${Date.now()}`;
    const { tabSessions = {} } = await getFromStorage(['tabSessions']);
    tabSessions[sessionName] = sessionTabs;
    await setInStorage({tabSessions});
    updateSessionList();
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
    for (const tab of tabSessions[sessionName]) {
      await createTab({url: tab.url});
    }
  };
  document.getElementById('backBtn').onclick = onBack;
  async function updateSessionList() {
    const { tabSessions = {} } = await getFromStorage(['tabSessions']);
    document.getElementById('sessionList').innerHTML =
      '<b>Saved Sessions:</b><br>' + Object.keys(tabSessions).join('<br>');
  }
  updateSessionList();
} 