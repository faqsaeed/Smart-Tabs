// features/session/sessionBackground.js

self.handleSessionMessage = function(request, sendResponse) {
  if (request.type === 'SAVE_SESSION') {
    chrome.tabs.query({}, (tabs) => {
      const tabData = tabs
        .filter(tab => tab && typeof tab.url === 'string' && tab.url.startsWith('http'))
        .map(tab => ({
          url: tab.url,
          pinned: tab.pinned
        }));
      if (!tabData.length) {
        sendResponse({ status: 'error', message: 'No valid tabs to save' });
        return;
      }
      const sessionName = request.sessionName || new Date().toISOString();
      chrome.storage.local.get(['tabSessions'], (result) => {
        const tabSessions = result.tabSessions || {};
        tabSessions[sessionName] = { tabs: tabData };
        chrome.storage.local.set({ tabSessions }, () => {
          sendResponse({ status: 'success', sessionName });
        });
      });
    });
    return true;
  }
  if (request.type === 'GET_SESSIONS') {
    chrome.storage.local.get(['tabSessions'], (result) => {
      sendResponse({ status: 'success', sessions: result.tabSessions || {} });
    });
    return true;
  }
  if (request.type === 'DELETE_SESSION') {
    chrome.storage.local.get(['tabSessions'], (result) => {
      const tabSessions = result.tabSessions || {};
      delete tabSessions[request.sessionName];
      chrome.storage.local.set({ tabSessions }, () => {
        sendResponse({ status: 'success', deleted: request.sessionName });
      });
    });
    return true;
  }
  if (request.type === 'RESTORE_SESSION') {
    console.log('[TabTrackr] RESTORE_SESSION requested');
    chrome.storage.local.get(['tabSessions'], (result) => {
      const tabSessions = result.tabSessions || {};
      const sessionName = request.sessionName || Object.keys(tabSessions).pop();
      const sessionData = tabSessions[sessionName];
      if (!sessionData) {
        sendResponse({status: 'error', message: 'No session data found'});
        return;
      }
      const sessionTabs = Array.isArray(sessionData)
        ? sessionData
        : Array.isArray(sessionData.tabs)
          ? sessionData.tabs
          : [];
      if (!sessionTabs.length) {
        sendResponse({status: 'error', message: 'No tabs to restore'});
        return;
      }
      // Deduplicate URLs
      const seen = new Set();
      const urls = sessionTabs
        .map(tab => (tab && typeof tab.url === 'string' && tab.url.startsWith('http') ? tab.url : null))
        .filter(url => {
          if (!url || seen.has(url)) return false;
          seen.add(url);
          return true;
        });
      if (!urls.length) {
        sendResponse({status: 'error', message: 'No valid URLs to restore'});
        return;
      }
      console.log(`[TabTrackr] Attempting to open ${urls.length} tabs in a new window for session "${sessionName}"`);
      chrome.windows.create({url: urls, focused: true}, win => {
        if (chrome.runtime.lastError) {
          console.error('[TabTrackr] Error creating window:', chrome.runtime.lastError);
          sendResponse({status: 'error', message: chrome.runtime.lastError.message});
        } else {
          console.log(`[TabTrackr] Successfully restored session "${sessionName}" with ${urls.length} tabs in window ${win.id}`);
          // Ensure the new window gets focus
          chrome.windows.update(win.id, {focused: true}, () => {
            sendResponse({status: 'success', message: `Session "${sessionName}" restored with ${urls.length} tabs`});
          });
        }
      });
    });
    return true;
  }
  return false;
}; 