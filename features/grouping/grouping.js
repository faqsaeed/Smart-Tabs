// features/grouping/grouping.js

window.initGrouping = function(container, onBack) {
  container.innerHTML = `
    <div class="card">
      <h2>AI Tab Grouping</h2>
      <button id="groupTabsBtn">Group Open Tabs</button>
      <div id="groupResults"></div>
      <button id="backBtn">Back</button>
    </div>
  `;
  document.getElementById('groupTabsBtn').onclick = async () => {
    document.getElementById('groupResults').textContent = 'Grouping...';
    const tabs = await queryTabs({currentWindow: true});
    const tabData = tabs.map(tab => ({title: tab.title, url: tab.url}));
    const groups = await groupTabsWithAI(tabData);
    if (!groups.length) {
      document.getElementById('groupResults').textContent = 'No groups found.';
      return;
    }
    document.getElementById('groupResults').innerHTML = groups.map((g, i) => `Group ${i+1}: [${g.join(', ')}]`).join('<br>');
  };
  document.getElementById('backBtn').onclick = onBack;
} 