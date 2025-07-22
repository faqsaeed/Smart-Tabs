// features/session/session.js
// import { queryTabs, getFromStorage, setInStorage, createTab } from '../../shared/chromeUtils.js';

window.initSession = function(container, onBack) {
  let mode = 'default'; // 'default', 'restore', 'edit'
  container.innerHTML = `
    <div class="card">
      <h2>Session Save & Restore</h2>
      <button id="saveSessionBtn">Save Session</button>
      <button id="restoreSessionBtn">Restore Session</button>
      <button id="editSessionsBtn">Edit Saved Sessions</button>
      <button id="backBtn">Back</button>
      <div id="sessionList"></div>
    </div>
    <style>
      .session-row { display: flex; align-items: center; margin: 4px 0; }
      .session-name { flex: 1; font-weight: 500; }
      .session-actions button { margin-left: 4px; }
      .session-edit-input { width: 60%; margin-right: 4px; }
    </style>
  `;
  document.getElementById('saveSessionBtn').onclick = async () => {
    const sessionName = prompt('Enter a name for this session (optional):') || `Session-${Date.now()}`;
    chrome.runtime.sendMessage({type: 'SAVE_SESSION', sessionName}, response => {
      updateSessionList();
    });
  };
  document.getElementById('restoreSessionBtn').onclick = () => {
    mode = 'restore';
    updateSessionList();
  };
  document.getElementById('editSessionsBtn').onclick = () => {
    mode = 'edit';
    updateSessionList();
  };
  document.getElementById('backBtn').onclick = () => {
    if (mode === 'default') onBack();
    else {
      mode = 'default';
      updateSessionList();
    }
  };

  async function updateSessionList() {
    const { tabSessions = {} } = await getFromStorage(['tabSessions']);
    const listDiv = document.getElementById('sessionList');
    if (mode === 'default') {
      listDiv.innerHTML = '';
      return;
    }
    if (!Object.keys(tabSessions).length) {
      listDiv.innerHTML = '<i>No saved sessions.</i>';
      return;
    }
    listDiv.innerHTML = '';
    Object.entries(tabSessions).forEach(([name, tabs]) => {
      const row = document.createElement('div');
      row.className = 'session-row';
      if (mode === 'edit') {
        // Edit mode: show rename input and delete button
        const input = document.createElement('input');
        input.className = 'session-edit-input';
        input.value = name;
        row.appendChild(input);
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.onclick = async () => {
          const newName = input.value.trim();
          if (!newName || newName === name) return;
          const { tabSessions: ts = {} } = await getFromStorage(['tabSessions']);
          if (ts[newName]) {
            alert('A session with this name already exists.');
            return;
          }
          ts[newName] = ts[name];
          delete ts[name];
          await setInStorage({tabSessions: ts});
          updateSessionList();
        };
        row.appendChild(saveBtn);
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.onclick = async () => {
          if (!confirm(`Delete session '${name}'?`)) return;
          const { tabSessions: ts = {} } = await getFromStorage(['tabSessions']);
          delete ts[name];
          await setInStorage({tabSessions: ts});
          updateSessionList();
        };
        row.appendChild(delBtn);
      } else if (mode === 'restore') {
        // Restore mode: show name and restore button
        const nameSpan = document.createElement('span');
        nameSpan.className = 'session-name';
        nameSpan.textContent = name;
        row.appendChild(nameSpan);
        const actions = document.createElement('span');
        actions.className = 'session-actions';
        const restoreBtn = document.createElement('button');
        restoreBtn.textContent = 'Restore';
        restoreBtn.onclick = () => {
          chrome.runtime.sendMessage({type: 'RESTORE_SESSION', sessionName: name}, response => {
            if (response && response.status === 'success') {
              alert(`Restored session '${name}' with ${response.count} tabs.`);
            } else {
              alert('Failed to restore session.');
            }
          });
        };
        actions.appendChild(restoreBtn);
        row.appendChild(actions);
      }
      listDiv.appendChild(row);
    });
  }
  updateSessionList();
} 
} 