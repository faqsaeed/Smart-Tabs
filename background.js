importScripts('features/session/sessionBackground.js', 'features/tracking/trackingBackground.js', 'features/grouping/groupingBackground.js');

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({ tabSessions: {} });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (self.handleSessionMessage(request, sendResponse)) return true;
  if (self.handleTrackingMessage(request, sendResponse)) return true;
  if (self.handleGroupingMessage(request, sendResponse)) return true;
  sendResponse({status: 'error', message: 'Unknown request type'});
  return true;
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  if (typeof self.trackingTabActivated === 'function') {
    self.trackingTabActivated(activeInfo);
  }
});
