importScripts('features/session/sessionBackground.js', 'features/tracking/trackingBackground.js', 'features/grouping/groupingBackground.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ tabSessions: {} });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Try each handler; if one returns true, stop
  if (handleSessionMessage(request, sendResponse)) return true;
  if (handleTrackingMessage(request, sendResponse)) return true;
  if (handleGroupingMessage(request, sendResponse)) return true;
  // Unknown request type
  sendResponse({status: 'error', message: 'Unknown request type'});
  return true;
});

chrome.tabs.onActivated.addListener(activeInfo => {
  // Only tracking needs to listen to tab activation
  if (typeof trackingTabActivated === 'function') {
    trackingTabActivated(activeInfo);
  }
});
