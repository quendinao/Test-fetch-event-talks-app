import logging
from flask import Flask, render_template, jsonify, request
import feedparser
import requests
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_updates_from_html(html_content):
    """
    Parses a single feed entry's HTML and splits it by <h3> sections.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    updates = []
    
    current_type = "Update"
    current_elements = []
    
    # We want to iterate through elements. BeautifulSoup's soup.contents contains children.
    # We'll use soup.find_all(recursive=False) or simply iterate through children.
    # To get clean structure, we can iterate over all child tags.
    for child in soup.contents:
        if child.name:
            if child.name in ['h3', 'h2', 'h4']:
                # If we have accumulated elements for the previous section, save it
                if current_elements:
                    content_html = "".join(str(e) for e in current_elements)
                    text_content = "".join(e.get_text() for e in current_elements if hasattr(e, 'get_text')).strip()
                    if text_content:
                        updates.append({
                            'type': current_type,
                            'html': content_html,
                            'text': text_content
                        })
                current_type = child.get_text().strip()
                current_elements = []
            else:
                current_elements.append(child)
        elif isinstance(child, str) and child.strip():
            # Keep text nodes that are not whitespace
            current_elements.append(child)
            
    # Add the final section
    if current_elements or current_type != "Update":
        content_html = "".join(str(e) for e in current_elements)
        text_content = "".join(e.get_text() if hasattr(e, 'get_text') else str(e) for e in current_elements).strip()
        if text_content:
            updates.append({
                'type': current_type,
                'html': content_html,
                'text': text_content
            })
            
    return updates

def fetch_and_parse_releases():
    """
    Fetches the Atom feed and structures all release notes.
    """
    logging.info(f"Fetching feed from {FEED_URL}")
    response = requests.get(FEED_URL, headers={"User-Agent": "BigQueryReleaseNotesViewer/1.0"}, timeout=15)
    
    if response.status_code != 200:
        raise Exception(f"Failed to fetch feed, status code: {response.status_code}")
        
    feed = feedparser.parse(response.content)
    all_releases = []
    
    for entry in feed.entries:
        # Parse date
        try:
            parsed_date = date_parser.parse(entry.updated)
            iso_date = parsed_date.date().isoformat()
            formatted_date = parsed_date.strftime("%B %d, %Y")
        except Exception:
            iso_date = getattr(entry, 'updated', '')[:10]
            formatted_date = entry.title
            
        # Get content
        content_html = ""
        if 'content' in entry and entry.content:
            content_html = entry.content[0].value
        elif 'summary' in entry:
            content_html = entry.summary
            
        # Split into sub-updates
        sub_updates = parse_updates_from_html(content_html)
        
        # If no sub-updates could be parsed, fall back to the whole entry
        if not sub_updates:
            soup = BeautifulSoup(content_html, 'html.parser')
            text_content = soup.get_text().strip()
            sub_updates = [{
                'type': 'Update',
                'html': content_html,
                'text': text_content
            }]
            
        # Add entry-level details to each sub-update
        for idx, update in enumerate(sub_updates):
            unique_id = f"{entry.id}_{idx}"
            all_releases.append({
                'id': unique_id,
                'entry_id': entry.id,
                'date': formatted_date,
                'iso_date': iso_date,
                'link': entry.link,
                'type': update['type'],
                'html': update['html'],
                'text': update['text']
            })
            
    return all_releases

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        releases = fetch_and_parse_releases()
        return jsonify({
            'success': True,
            'count': len(releases),
            'releases': releases
        })
    except Exception as e:
        logging.error(f"Error fetching/parsing releases: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)
