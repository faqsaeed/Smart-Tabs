// features/grouping/groupingBackground.js
importScripts('../../shared/ai.js');

function localGroupTabs(tabData) {
  // Simple keyword-based grouping as fallback
  const groups = {};
  const keywords = {
    Work: [/work|jira|slack|mail|office|docs/i],
    Research: [/arxiv|wikipedia|scholar|research/i],
    Entertainment: [/youtube|netflix|spotify|music|movie|game/i],
    Social: [/twitter|facebook|instagram|reddit|linkedin/i]
  };
  tabData.forEach(tab => {
    let found = false;
    for (const [group, regexes] of Object.entries(keywords)) {
      if (regexes.some(r => r.test(tab.title) || r.test(tab.url))) {
        groups[group] = groups[group] || [];
        groups[group].push(tab.url);
        found = true;
        break;
      }
    }
    if (!found) {
      groups.Other = groups.Other || [];
      groups.Other.push(tab.url);
    }
  });
  return groups;
}

self.handleGroupingMessage = function(request, sendResponse) {
  if (request.type === 'GROUP_TABS') {
    chrome.tabs.query({currentWindow: true}, async (tabs) => {
      try {
        const tabData = tabs.map(tab => ({title: tab.title, url: tab.url}));
        let groups;
        try {
          groups = await groupTabsWithAI(tabData);
        } catch (e) {
          console.warn('[TabTrackr] AI grouping failed or no key, using local classifier:', e);
          groups = localGroupTabs(tabData);
        }
        sendResponse({status: 'success', groups});
      } catch (e) {
        sendResponse({status: 'error', message: e.message});
      }
    });
    return true;
  }
  return false;
}; 