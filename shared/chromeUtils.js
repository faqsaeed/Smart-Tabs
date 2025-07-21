// shared/chromeUtils.js
self.queryTabs = async function(query = {}) {
  return new Promise(resolve => {
    chrome.tabs.query(query, resolve);
  });
}
self.getFromStorage = async function(keys) {
  return new Promise(resolve => {
    chrome.storage.local.get(keys, resolve);
  });
}
self.setInStorage = async function(obj) {
  return new Promise(resolve => {
    chrome.storage.local.set(obj, resolve);
  });
}
self.createTab = async function(tabProps) {
  return new Promise(resolve => {
    chrome.tabs.create(tabProps, resolve);
  });
} 