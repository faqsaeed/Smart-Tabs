// background.js for TabTrackr Chrome Extension
// Handles tab grouping (with AI), session save/restore, and tab time tracking

// Use importScripts for shared modules (for service worker compatibility)
importScripts('shared/ai.js', 'shared/chromeUtils.js');

// In-memory session and tracking data
let trackingActive = false;
let tabTimes = {}; // { tabId: { start: timestamp, total: ms } }
let trackingStartTime = null;

// Message listener for popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GROUP_TABS') {
    chrome.tabs.query({currentWindow: true}, async (tabs) => {
      const tabData = tabs.map(tab => ({title: tab.title, url: tab.url}));
      const groups = await groupTabsWithAI(tabData);
      sendResponse({status: 'success', groups});
    });
    return true; // async
  } else if (request.type === 'SAVE_SESSION') {
    // Save all tabs in all windows, and store the active tab index
    chrome.tabs.query({}, (tabs) => {
      chrome.tabs.query({active: true, currentWindow: true}, (activeTabs) => {
        const sessionTabs = tabs
          .filter(tab => tab && tab.url)
          .map(tab => ({
            title: tab.title || '',
            url: tab.url,
            windowId: tab.windowId,
            id: tab.id
          }));
        const activeTabId = activeTabs.length > 0 ? activeTabs[0].id : null;
        const activeTabIndex = sessionTabs.findIndex(tab => tab.id === activeTabId);
        const sessionName = request.sessionName || `Session-${Date.now()}`;
        chrome.storage.local.get(['tabSessions'], (result) => {
          const tabSessions = result.tabSessions || {};
          tabSessions[sessionName] = { tabs: sessionTabs, activeTabIndex };
          chrome.storage.local.set({tabSessions}, () => {
            sendResponse({status: 'success', sessionName});
          });
        });
      });
    });
    return true;
  } else if (request.type === 'RESTORE_SESSION') {
    // --- Robust, Safe Session Restore Logic ---
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
      const urls = sessionTabs
        .map(tab => (tab && typeof tab.url === 'string' ? tab.url : null))
        .filter(Boolean);
      if (!urls.length) {
        sendResponse({status: 'error', message: 'No valid URLs to restore'});
        return;
      }
      chrome.windows.create({url: urls}, win => {
        if (chrome.runtime.lastError) {
          sendResponse({status: 'error', message: chrome.runtime.lastError.message});
        } else {
          sendResponse({status: 'success', sessionName, count: urls.length});
        }
      });
    });
    return true;
  } else if (request.type === 'GET_TRACKING_DATA') {
    // Return tabTimes as an array for UI display
    const data = Object.values(tabTimes).map(tab => ({
      title: tab.title,
      url: tab.url,
      seconds: Math.round((tab.total || 0) / 1000)
    }));
    sendResponse({status: 'success', data});
    return true;
  } else if (request.type === 'START_TRACKING') {
    trackingActive = true;
    tabTimes = {};
    trackingStartTime = Date.now();
    // Only start timer for the currently active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        const tab = tabs[0];
        tabTimes[tab.id] = { start: Date.now(), total: 0, title: tab.title, url: tab.url };
      }
    });
    sendResponse({status: 'tracking_started'});
    return true;
  } else if (request.type === 'STOP_TRACKING') {
    trackingActive = false;
    Object.keys(tabTimes).forEach(tabId => {
      if (tabTimes[tabId].start) {
        tabTimes[tabId].total += Date.now() - tabTimes[tabId].start;
        tabTimes[tabId].start = null;
      }
    });
    sendResponse({status: 'tracking_stopped'});
    return true;
  } else if (request.type === 'EXPORT_CSV') {
    let csv = 'Tab Title,Tab URL,Time Spent (seconds)\n';
    Object.values(tabTimes).forEach(tab => {
      const seconds = Math.round((tab.total || 0) / 1000);
      csv += `"${tab.title}","${tab.url}",${seconds}\n`;
    });
    sendResponse({status: 'csv', csv});
    return true;
  }
  return true;
});

// Tab activation tracking
chrome.tabs.onActivated.addListener(activeInfo => {
  if (!trackingActive) return;
  const now = Date.now();
  // Pause all running timers
  Object.keys(tabTimes).forEach(tabId => {
    if (tabTimes[tabId].start) {
      tabTimes[tabId].total += now - tabTimes[tabId].start;
      tabTimes[tabId].start = null;
    }
  });
  // Start timer for the newly active tab
  tabTimes[activeInfo.tabId] = tabTimes[activeInfo.tabId] || { total: 0 };
  tabTimes[activeInfo.tabId].start = now;
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab) {
      tabTimes[activeInfo.tabId].title = tab.title;
      tabTimes[activeInfo.tabId].url = tab.url;
    }
  });
});

// Tab removal cleanup
chrome.tabs.onRemoved.addListener(tabId => {
  if (tabTimes[tabId]) delete tabTimes[tabId];
});

