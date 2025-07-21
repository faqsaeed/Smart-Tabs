// shared/ai.js
// Handles OpenAI integration and tab grouping logic for TabTrackr

const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Groups tabs using OpenAI GPT-4 based on title/URL similarity.
 * @param {Array<{title: string, url: string}>} tabs
 * @returns {Promise<Array<Array<number>>>} Array of groups, each group is an array of tab indices
 */
export async function groupTabsWithAI(tabs) {
  const tabList = tabs.map((tab, i) => `${i + 1}. ${tab.title} (${tab.url})`).join('\n');
  const prompt = `Group the following browser tabs by topic or similarity. Return the result as arrays of tab indices (starting from 0), one group per line.\n\n${tabList}`;
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
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
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