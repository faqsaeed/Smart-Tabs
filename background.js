let trackingActive = false;
let tabTimes = {};
let trackingStartTime = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ tabSessions: {} });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SAVE_SESSION') {
    chrome.tabs.query({}, (tabs) => {
      const tabData = tabs.map(tab => ({
        url: tab.url,
        pinned: tab.pinned
      }));

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
        console.error('[TabTrackr] No session data found for', sessionName);
        sendResponse({status: 'error', message: 'No session data found'});
        return;
      }
      const sessionTabs = Array.isArray(sessionData)
        ? sessionData
        : Array.isArray(sessionData.tabs)
          ? sessionData.tabs
          : [];
      if (!sessionTabs.length) {
        console.error('[TabTrackr] No tabs to restore in session', sessionName);
        sendResponse({status: 'error', message: 'No tabs to restore'});
        return;
      }
      const urls = sessionTabs
        .map(tab => (tab && typeof tab.url === 'string' ? tab.url : null))
        .filter(Boolean);
      if (!urls.length) {
        console.error('[TabTrackr] No valid URLs to restore in session', sessionName);
        sendResponse({status: 'error', message: 'No valid URLs to restore'});
        return;
      }
      console.log(`[TabTrackr] Attempting to open ${urls.length} tabs in a new window for session "${sessionName}"`);
      chrome.windows.create({url: urls}, win => {
        if (chrome.runtime.lastError) {
          console.error('[TabTrackr] Failed to create window for session restore:', chrome.runtime.lastError);
          sendResponse({status: 'error', message: chrome.runtime.lastError.message});
        } else {
          console.log(`[TabTrackr] Successfully restored session "${sessionName}" with ${urls.length} tabs in window ${win.id}`);
          sendResponse({status: 'success', sessionName, count: urls.length});
        }
      });
    });
    return true;
  }

  if (request.type === 'START_TRACKING') {
    trackingActive = true;
    tabTimes = {};
    trackingStartTime = Date.now();
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        const tab = tabs[0];
        tabTimes[tab.id] = { start: Date.now(), total: 0, title: tab.title, url: tab.url };
        console.log('[TabTrackr] Started tracking tab:', tab.id, tab.title, tab.url);
      }
    });
    sendResponse({status: 'tracking_started'});
    return true;
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  if (!trackingActive) return;
  const now = Date.now();
  Object.keys(tabTimes).forEach(tabId => {
    if (tabTimes[tabId].start) {
      tabTimes[tabId].total += now - tabTimes[tabId].start;
      tabTimes[tabId].start = null;
      console.log('[TabTrackr] Paused tab:', tabId, 'Total:', tabTimes[tabId].total);
    }
  });
  tabTimes[activeInfo.tabId] = tabTimes[activeInfo.tabId] || { total: 0 };
  tabTimes[activeInfo.tabId].start = now;
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab) {
      tabTimes[activeInfo.tabId].title = tab.title;
      tabTimes[activeInfo.tabId].url = tab.url;
      console.log('[TabTrackr] Started tracking new active tab:', activeInfo.tabId, tab.title, tab.url);
    }
  });
});
