// Global Application State
let appState = {
    releases: [],
    filteredReleases: [],
    activeFilter: 'all',
    searchQuery: '',
    isLoading: false,
    selectedRelease: null
};

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    spinnerIcon: document.querySelector('.spinner-icon'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search'),
    typeFilters: document.getElementById('type-filters'),
    statusSummary: document.getElementById('status-summary'),
    skeletonLoader: document.getElementById('skeleton-loader'),
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    emptyContainer: document.getElementById('empty-container'),
    notesGrid: document.getElementById('notes-grid'),
    
    // Tweet Modal Elements
    tweetModal: document.getElementById('tweet-modal'),
    closeModalBtn: document.getElementById('close-modal'),
    cancelTweetBtn: document.getElementById('cancel-tweet-btn'),
    submitTweetBtn: document.getElementById('submit-tweet-btn'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCount: document.getElementById('char-count'),
    tweetUrlPreview: document.getElementById('tweet-url-preview'),
    tweetLivePreview: document.getElementById('tweet-live-preview')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchReleases();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh / Fetch handlers
    elements.refreshBtn.addEventListener('click', fetchReleases);
    elements.retryBtn.addEventListener('click', fetchReleases);
    
    // Search handlers
    elements.searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value.toLowerCase().trim();
        elements.clearSearchBtn.style.display = appState.searchQuery ? 'block' : 'none';
        applyFilters();
    });
    
    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        appState.searchQuery = '';
        elements.clearSearchBtn.style.display = 'none';
        applyFilters();
    });
    
    // Filter pill handlers
    elements.typeFilters.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        // Update active UI state
        elements.typeFilters.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active'));
        pill.classList.add('active');
        
        // Update active filter state
        appState.activeFilter = pill.dataset.type.toLowerCase();
        applyFilters();
    });
    
    // Tweet Modal event listeners
    elements.closeModalBtn.addEventListener('click', closeTweetModal);
    elements.cancelTweetBtn.addEventListener('click', closeTweetModal);
    
    elements.tweetTextarea.addEventListener('input', () => {
        updateTweetPreviewAndCounter();
    });
    
    elements.submitTweetBtn.addEventListener('click', postTweetToX);
}

// Fetch Release Notes from backend
async function fetchReleases() {
    if (appState.isLoading) return;
    
    setLoadingState(true);
    
    try {
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            appState.releases = data.releases;
            applyFilters();
            showErrorState(false);
        } else {
            throw new Error(data.error || 'Unknown error occurred while fetching updates');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        elements.errorMessage.textContent = error.message || 'Failed to connect to backend server.';
        showErrorState(true);
    } finally {
        setLoadingState(false);
    }
}

// Toggle loading states
function setLoadingState(isLoading) {
    appState.isLoading = isLoading;
    if (isLoading) {
        elements.spinnerIcon.classList.add('spinning');
        elements.refreshBtn.disabled = true;
        elements.skeletonLoader.style.display = 'grid';
        elements.notesGrid.style.display = 'none';
        elements.emptyContainer.style.display = 'none';
        elements.errorContainer.style.display = 'none';
        elements.statusSummary.textContent = 'Syncing latest releases...';
    } else {
        elements.spinnerIcon.classList.remove('spinning');
        elements.refreshBtn.disabled = false;
        elements.skeletonLoader.style.display = 'none';
    }
}

// Toggle Error state
function showErrorState(isError) {
    if (isError) {
        elements.errorContainer.style.display = 'block';
        elements.notesGrid.style.display = 'none';
        elements.emptyContainer.style.display = 'none';
        elements.statusSummary.textContent = 'Failed to load releases';
    } else {
        elements.errorContainer.style.display = 'none';
    }
}

// Filter and Search processor
function applyFilters() {
    let results = appState.releases;
    
    // 1. Type Filter
    if (appState.activeFilter !== 'all') {
        results = results.filter(release => release.type.toLowerCase() === appState.activeFilter);
    }
    
    // 2. Search query filter
    if (appState.searchQuery) {
        results = results.filter(release => {
            return (
                release.type.toLowerCase().includes(appState.searchQuery) ||
                release.date.toLowerCase().includes(appState.searchQuery) ||
                release.text.toLowerCase().includes(appState.searchQuery)
            );
        });
    }
    
    appState.filteredReleases = results;
    renderReleases();
}

// Render filtered cards to UI
function renderReleases() {
    const list = appState.filteredReleases;
    
    // Update count summary
    if (list.length === 0) {
        elements.statusSummary.textContent = 'No updates match criteria';
        elements.notesGrid.style.display = 'none';
        elements.emptyContainer.style.display = 'block';
        return;
    }
    
    elements.emptyContainer.style.display = 'none';
    elements.notesGrid.style.display = 'grid';
    elements.statusSummary.textContent = `Showing ${list.length} update${list.length === 1 ? '' : 's'}`;
    
    // Clear old elements
    elements.notesGrid.innerHTML = '';
    
    // Create new cards
    list.forEach(release => {
        const card = createReleaseCard(release);
        elements.notesGrid.appendChild(card);
    });
}

// Helper to create HTML template for a single Release note card
function createReleaseCard(release) {
    const card = document.createElement('div');
    card.className = 'release-card';
    card.dataset.id = release.id;
    
    // Get lowercase type class for styling
    const typeClass = release.type.toLowerCase();
    
    // Build card inner HTML
    card.innerHTML = `
        <div class="card-header">
            <div class="card-meta">
                <span class="type-badge ${typeClass}">${release.type}</span>
                <span class="card-date"><i class="fa-regular fa-calendar-days"></i> ${release.date}</span>
            </div>
            
            <div class="share-action-container">
                <button class="action-btn btn-tweet-action" title="Tweet about this specific update">
                    <i class="fa-brands fa-x-twitter"></i>
                </button>
            </div>
        </div>
        
        <div class="card-content">
            ${release.html}
        </div>
        
        <div class="card-footer">
            <a href="${release.link}" target="_blank" class="read-more-link">
                View Original Note <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
        </div>
    `;
    
    // Bind Tweet click event to button inside the card
    const tweetBtn = card.querySelector('.btn-tweet-action');
    tweetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openTweetComposer(release);
    });
    
    return card;
}

// Prepare and open the Tweet composer modal
function openTweetComposer(release) {
    appState.selectedRelease = release;
    
    // Construct recommended initial tweet text
    // Format: "📢 BigQuery Update: [Type] ([Date])\n\n[Clean content snippet...]"
    // Max characters = 280. We reserve 23 characters for Twitter URL shortening and some for tags/spaces.
    
    const prefix = `📢 BigQuery: ${release.type} (${release.date})\n\n`;
    const suffix = `\n\nRead more:`;
    
    // Max text body length is roughly 280 - prefix - suffix - 23 (standard twitter URL length limit) - 5 (buffer)
    const reservedLen = prefix.length + suffix.length + 23 + 5;
    const maxBodyLen = 280 - reservedLen;
    
    let bodyText = release.text.replace(/\s+/g, ' ').trim();
    if (bodyText.length > maxBodyLen) {
        bodyText = bodyText.substring(0, maxBodyLen - 3) + '...';
    }
    
    const draftText = `${prefix}${bodyText}`;
    
    // Set field values in UI
    elements.tweetTextarea.value = draftText;
    elements.tweetUrlPreview.textContent = release.link.substring(8, 38) + '...';
    
    // Open Modal
    elements.tweetModal.style.display = 'flex';
    // Small timeout to allow browser layout rendering before starting animation
    setTimeout(() => {
        elements.tweetModal.classList.add('active');
    }, 10);
    
    updateTweetPreviewAndCounter();
}

function closeTweetModal() {
    elements.tweetModal.classList.remove('active');
    setTimeout(() => {
        elements.tweetModal.style.display = 'none';
        appState.selectedRelease = null;
    }, 300);
}

// Update character counters and preview UI
function updateTweetPreviewAndCounter() {
    if (!appState.selectedRelease) return;
    
    const text = elements.tweetTextarea.value;
    const url = appState.selectedRelease.link;
    
    // Twitter/X counts all links as exactly 23 characters regardless of actual length
    const textLenWithoutLink = text.length;
    const totalCount = textLenWithoutLink + 23 + 2; // +2 for newlines between text and link
    
    elements.charCount.textContent = totalCount;
    
    // Color thresholds for counter
    const counterElement = elements.charCount.parentElement;
    counterElement.className = 'character-counter';
    elements.submitTweetBtn.disabled = false;
    
    if (totalCount > 280) {
        counterElement.classList.add('danger');
        elements.submitTweetBtn.disabled = true; // Block Tweeting if exceeds limit
    } else if (totalCount > 250) {
        counterElement.classList.add('warning');
    }
    
    // Live preview window update (re-format link as standard blue Twitter link)
    const formattedPreview = escapeHtml(text) + ` <a href="#" onclick="return false;">${escapeHtml(url)}</a>`;
    elements.tweetLivePreview.innerHTML = formattedPreview;
}

// Escapes special tags to prevent HTML injection in preview box
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Direct Web intent deployment
function postTweetToX() {
    if (!appState.selectedRelease) return;
    
    const text = elements.tweetTextarea.value;
    const url = appState.selectedRelease.link;
    
    // Append the link at the end of the text
    const fullTweetText = `${text}\n\n${url}`;
    
    // Build Twitter/X Intent URL
    const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullTweetText)}`;
    
    // Open in new tab
    window.open(tweetIntentUrl, '_blank', 'width=550,height=420');
    
    closeTweetModal();
}
