// background.js for TabTrackr Chrome Extension
// Handles tab grouping (with AI), session save/restore, and tab time tracking

// Use importScripts for shared modules (for service worker compatibility)
importScripts('shared/ai.js', 'shared/chromeUtils.js');

// In-memory session and tracking data
let savedSessions = {};
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
    chrome.tabs.query({currentWindow: true}, (tabs) => {
      const sessionTabs = tabs.map(tab => ({title: tab.title, url: tab.url}));
      const sessionName = request.sessionName || `Session-${Date.now()}`;
      chrome.storage.local.get(['tabSessions'], (result) => {
        const tabSessions = result.tabSessions || {};
        tabSessions[sessionName] = sessionTabs;
        chrome.storage.local.set({tabSessions}, () => {
          sendResponse({status: 'success', sessionName});
        });
      });
    });
    return true;
  } else if (request.type === 'RESTORE_SESSION') {
    chrome.storage.local.get(['tabSessions'], (result) => {
      const tabSessions = result.tabSessions || {};
      const sessionName = request.sessionName || Object.keys(tabSessions).pop();
      const sessionTabs = tabSessions[sessionName] || [];
      // Close all current tabs before opening session tabs
      chrome.tabs.query({currentWindow: true}, (currentTabs) => {
        const currentTabIds = currentTabs.map(tab => tab.id);
        chrome.tabs.remove(currentTabIds, () => {
          for (const tab of sessionTabs) {
            chrome.tabs.create({url: tab.url});
          }
          sendResponse({status: 'success', sessionName, count: sessionTabs.length});
        });
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
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        tabTimes[tab.id] = { start: Date.now(), total: 0, title: tab.title, url: tab.url };
      });
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
  Object.keys(tabTimes).forEach(tabId => {
    if (tabTimes[tabId].start) {
      tabTimes[tabId].total += now - tabTimes[tabId].start;
      tabTimes[tabId].start = null;
    }
  });
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

// TODO: Implement session storage and tracking logic 