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
    // Save all tabs in all windows, and store the active tab index
    chrome.tabs.query({}, (tabs) => {
      chrome.tabs.query({active: true, currentWindow: true}, (activeTabs) => {
        const sessionTabs = tabs.map(tab => ({title: tab.title, url: tab.url, windowId: tab.windowId, id: tab.id}));
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
    chrome.storage.local.get(['tabSessions'], async (result) => {
      const tabSessions = result.tabSessions || {};
      const sessionName = request.sessionName || Object.keys(tabSessions).pop();
      const sessionData = tabSessions[sessionName] || {};
      const sessionTabs = sessionData.tabs || [];
      const activeTabIndex = sessionData.activeTabIndex || 0;
      // Get all current tabs
      chrome.tabs.query({}, async (currentTabs) => {
        // Get the extension's own tab (if any)
        let extensionTabId = null;
        try {
          const views = await chrome.tabs.query({url: chrome.runtime.getURL('*')});
          if (views.length > 0) extensionTabId = views[0].id;
        } catch (e) {}
        // Get the currently active tab
        const activeTab = currentTabs.find(tab => tab.active);
        // Close all tabs except the currently active one and the extension tab
        const tabsToClose = currentTabs.map(tab => tab.id).filter(id => id !== extensionTabId && id !== (activeTab && activeTab.id));
        chrome.tabs.remove(tabsToClose, async () => {
          // Deduplicate URLs to avoid opening the same tab multiple times
          const seen = new Set();
          let createdTabIds = [];
          for (const tab of sessionTabs) {
            if (!tab.url || seen.has(tab.url)) continue;
            seen.add(tab.url);
            try {
              const created = await chrome.tabs.create({url: tab.url});
              createdTabIds.push(created.id);
            } catch (e) {
              // Handle errors (e.g., permission, blocked URLs)
              console.warn('Could not open tab:', tab.url, e);
            }
          }
          // Remove the previously active tab (now a leftover)
          if (activeTab && activeTab.id) {
            chrome.tabs.remove(activeTab.id);
          }
          // Switch to the tab that was active when the session was saved
          if (createdTabIds.length > 0 && activeTabIndex >= 0 && activeTabIndex < createdTabIds.length) {
            chrome.tabs.update(createdTabIds[activeTabIndex], {active: true});
          }
          sendResponse({status: 'success', sessionName, count: seen.size});
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

// TODO: Implement session storage and tracking logic 