# BigQuery Release Notes Dashboard

A premium, modern web dashboard built with **Python Flask** and **Vanilla JS/CSS/HTML** that parses the official Google Cloud BigQuery Release Notes RSS feed, breaks them down into individual granular updates, and allows users to Tweet about specific updates directly with an interactive live composer.

## 🚀 Features

- **Granular Entry Parsing**: Splits daily aggregated update logs into individual granular entries (e.g. separating distinct Features, Changes, Deprecations, and Resolutions).
- **Interactive Search & Filtering**: Instant, client-side keyword search across updates, dates, and types, along with category filter pills.
- **X (Twitter) Composer Integration**: Includes a custom-designed composer modal with a live preview card and an accurate character counter (accounting for X's 23-character link rule).
- **Premium Dark Aesthetics**: Designed using glassmorphic cards, smooth gradient backdrops, and active-focus glowing borders.
- **Micro-Animations & Feedback**: Includes custom CSS animations for loading skeletons, spinner state transitions, and modal entrance effects.

## 📁 Project Structure

```text
bq-releases-notes/
├── app.py                  # Flask backend (RSS fetch, BeautifulSoup parsing, and JSON API)
├── requirements.txt        # Python library dependencies
├── README.md               # Project documentation
├── .gitignore              # Files excluded from version control
├── templates/
│   └── index.html          # Core dashboard layout and modal markup
└── static/
    ├── css/
    │   └── styles.css      # Design token variables, card styling, and animations
    └── js/
        └── main.js         # State machine, AJAX fetching, filtering, and Twitter integration
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- pip (Python package installer)

### 1. Clone the repository
```bash
git clone https://github.com/quendinao/Test-fetch-event-talks-app.git
cd Test-fetch-event-talks-app
```

### 2. Set up virtual environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the application
```bash
python app.py
```

The application will start in debug mode on **`http://127.0.0.1:5001`**.

## 💻 Tech Stack
- **Backend**: Python, Flask, `feedparser` (for Atom parsing), `beautifulsoup4` (for HTML manipulation).
- **Frontend**: HTML5, Vanilla CSS3 (custom CSS custom properties), Vanilla JavaScript (ES6+).
- **Icons & Fonts**: FontAwesome v6, Google Fonts (Inter & Outfit).
