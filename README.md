# Smart Tabs

A Chrome extension designed to make tab management smarter and more efficient.  
Currently supports tracking active tab usage time and saving/restoring browsing sessions locally.  
Planned features include automatic tab grouping powered by local NLP or OpenAI GPT for semantic categorization.

---

## 📋 Features

### ✅ Implemented
- **Tab Usage Tracking**
  - Measures *active focus time* for each tab (only counts when the tab is selected).
  - Useful for productivity analysis and time management.
  - Resets automatically when the browser restarts (optional).

- **Session Save & Restore**
  - Save all currently open tabs as a named session.
  - Restore any saved session instantly.
  - Sessions are stored locally for privacy.

### 🚧 Under Development
- **Smart Tab Grouping**
  - Automatically categorizes open tabs into Chrome tab groups.
  - Will support **local NLP** (offline) and **OpenAI GPT** (high accuracy).
  - Color-coded group labels for quick navigation.

---

## 🛠️ Tech Stack

| Component         | Technology |
|-------------------|------------|
| Extension Type    | Chrome Manifest V3 |
| Frontend UI       | HTML, CSS, JavaScript |
| Storage           | Chrome Storage API (local) |
| Tab Management    | Chrome Tabs API, Chrome Sessions API |
| Timing            | Chrome Runtime & Idle APIs |
| Planned NLP       | Local JS NLP libraries / OpenAI GPT API |

---

## ## 🚀 Installation (Developer Mode)

1. **Clone the repository**

   ```bash
   git clone hhttps://github.com/faqsaeed/Smart-Tabs.git
   ```

2. **Open Chrome Extensions**

    - Go to `chrome://extensions/`

    -  Enable Developer mode (toggle in the top right).

3. **Load unpacked extension**

    - Click Load unpacked

    -   Select the cloned project folder.

4. **Start using Smart Tabs**

    - Use the popup menu to view usage stats or manage sessions.

---

## ⚙️ Configuration

  - **Session Data** – Stored locally via Chrome Storage API.

  - **Tab Tracking** – Only counts time when tab is actively focused.

---

## 🧪 Testing

  - **Manual Testing**

      - Usage tracking verified with active/busy browser patterns.

      -  Session saving and restoration tested with multiple named sessions.

---

## 👥 Author

  **Faiq Saeed** – Core logic, UI, feature planning, and future NLP/GPT integration.

---

## 📜 License

This project is for personal/academic use and is not licensed for commercial distribution.