// features/tracking/trackingBackground.js

let trackingActive = false;
let tabTimes = {};
let trackingStartTime = null;

function saveTrackingData() {
  chrome.storage.local.set({ tabTimes });
}

function loadTrackingData(callback) {
  chrome.storage.local.get(['tabTimes'], (result) => {
    tabTimes = result.tabTimes || {};
    if (callback) callback();
  });
}

self.handleTrackingMessage = function(request, sendResponse) {
  if (request.type === 'START_TRACKING') {
    trackingActive = true;
    loadTrackingData(() => {
      trackingStartTime = Date.now();
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length > 0) {
          const tab = tabs[0];
          tabTimes[tab.id] = tabTimes[tab.id] || { total: 0 };
          tabTimes[tab.id].start = Date.now();
          tabTimes[tab.id].title = tab.title;
          tabTimes[tab.id].url = tab.url;
          console.log('[TabTrackr] Started tracking tab:', tab.id, tab.title, tab.url);
        }
        saveTrackingData();
        sendResponse({status: 'tracking_started'});
      });
    });
    return true;
  }
  if (request.type === 'STOP_TRACKING') {
    trackingActive = false;
    Object.keys(tabTimes).forEach(tabId => {
      if (tabTimes[tabId].start) {
        tabTimes[tabId].total += Date.now() - tabTimes[tabId].start;
        tabTimes[tabId].start = null;
      }
    });
    saveTrackingData();
    sendResponse({status: 'tracking_stopped'});
    return true;
  }
  if (request.type === 'GET_TRACKING_DATA') {
    loadTrackingData(() => {
      const data = Object.values(tabTimes).map(tab => ({
        title: tab.title,
        url: tab.url,
        seconds: Math.round((tab.total || 0) / 1000)
      }));
      sendResponse({status: 'success', data});
    });
    return true;
  }
  if (request.type === 'EXPORT_CSV') {
    loadTrackingData(() => {
      let csv = 'Tab Title,Tab URL,Time Spent (seconds)\n';
      Object.values(tabTimes).forEach(tab => {
        const seconds = Math.round((tab.total || 0) / 1000);
        csv += `"${tab.title}","${tab.url}",${seconds}\n`;
      });
      sendResponse({status: 'csv', csv});
    });
    return true;
  }
  return false;
};

self.trackingTabActivated = function(activeInfo) {
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
    saveTrackingData();
  });
};

chrome.windows && chrome.windows.onFocusChanged && chrome.windows.onFocusChanged.addListener(function(windowId) {
  if (!trackingActive) return;
  const now = Date.now();
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // All Chrome windows lost focus, pause all
    Object.keys(tabTimes).forEach(tabId => {
      if (tabTimes[tabId].start) {
        tabTimes[tabId].total += now - tabTimes[tabId].start;
        tabTimes[tabId].start = null;
      }
    });
    saveTrackingData();
  } else {
    // A window gained focus, resume active tab
    chrome.windows.get(windowId, {populate: true}, (win) => {
      if (win && win.focused) {
        const activeTab = win.tabs.find(tab => tab.active);
        if (activeTab) {
          tabTimes[activeTab.id] = tabTimes[activeTab.id] || { total: 0 };
          tabTimes[activeTab.id].start = now;
          tabTimes[activeTab.id].title = activeTab.title;
          tabTimes[activeTab.id].url = activeTab.url;
        }
        saveTrackingData();
      }
    });
  }
}); 