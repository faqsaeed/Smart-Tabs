// shared/chromeUtils.js
export async function queryTabs(query = {}) {
  return new Promise(resolve => {
    chrome.tabs.query(query, resolve);
  });
}
export async function getFromStorage(keys) {
  return new Promise(resolve => {
    chrome.storage.local.get(keys, resolve);
  });
}
export async function setInStorage(obj) {
  return new Promise(resolve => {
    chrome.storage.local.set(obj, resolve);
  });
}
export async function createTab(tabProps) {
  return new Promise(resolve => {
    chrome.tabs.create(tabProps, resolve);
  });
} 