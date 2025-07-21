// popup/popup.js
const dashboard = document.getElementById('dashboard');
const featureContainer = document.getElementById('feature-container');

const features = {
  grouping: {
    card: document.getElementById('grouping-card'),
    html: '../features/grouping/index.html',
    js: '../features/grouping/grouping.js',
    init: 'initGrouping'
  },
  session: {
    card: document.getElementById('session-card'),
    html: '../features/session/index.html',
    js: '../features/session/session.js',
    init: 'initSession'
  },
  tracking: {
    card: document.getElementById('tracking-card'),
    html: '../features/tracking/index.html',
    js: '../features/tracking/tracking.js',
    init: 'initTracking'
  }
};

Object.entries(features).forEach(([key, {card, html, js, init}]) => {
  card.onclick = async () => {
    dashboard.style.display = 'none';
    featureContainer.style.display = '';
    // Load HTML
    const htmlResp = await fetch(html);
    featureContainer.innerHTML = await htmlResp.text();
    // Dynamically load JS as a classic script
    const script = document.createElement('script');
    script.src = js;
    script.onload = () => {
      const container = featureContainer.querySelector('div');
      window[init](container, () => {
        featureContainer.style.display = 'none';
        dashboard.style.display = '';
        featureContainer.innerHTML = '';
      });
    };
    featureContainer.appendChild(script);
  };
}); 