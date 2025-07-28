// shared/ai.js
// Handles OpenAI integration and tab grouping logic for TabTrackr

const OPENAI_API_URL = 'https://smart-tabs-backend.vercel.app/api/chat';

/**
 * Groups tabs using OpenAI GPT-4 based on title/URL similarity.
 * @param {Array<{title: string, url: string}>} tabs
 * @returns {Promise<Array<Array<number>>>} Array of groups, each group is an array of tab indices
 */
self.groupTabsWithAI = async function(tabs) {
  const tabList = tabs.map((tab, i) => `${i + 1}. ${tab.title} (${tab.url})`).join('\n');
  const prompt = `
  You will be given a numbered list of browser tabs with titles and URLs.
  Your job is to group similar tabs based on topic or content.
  Return ONLY a JSON array of arrays. Each sub-array contains the indices (starting from 0) of tabs that belong to the same group.
  Do not add explanation or extra text. Just return valid JSON.
  
  Example output: [[0,2],[1,3,4]]
  
  Tabs:
  ${tabList}
  `;
  const body = {
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an assistant that groups browser tabs by topic.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 256,
    temperature: 0.2
  };
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const groups = text.match(/\[.*?\]/g)?.map(line => JSON.parse(line)) || [];
    return groups;
  } catch (e) {
    console.error('OpenAI grouping error:', e);
    return [];
  }
} 