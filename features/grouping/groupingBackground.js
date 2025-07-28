// features/grouping/groupingBackground.js
importScripts('../../shared/ai.js');

export function handleGroupingMessage(request, sendResponse) {
  if (request.type === 'GROUP_TABS') {
    chrome.tabs.query({currentWindow: true}, async (tabs) => {
      try {
        const tabData = tabs.map(tab => ({title: tab.title, url: tab.url}));
        const groups = await groupTabsWithAI(tabData);
        sendResponse({status: 'success', groups});
      } catch (e) {
        sendResponse({status: 'error', message: e.message});
      }
    });
    return true;
  }
  return false;
} 