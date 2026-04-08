// VClass Global Search Module
// Implements global search across disciplines, lessons, library, and news

const VClassSearch = {
    // Search history storage
    history: [],
    maxHistoryItems: 10,

    // Initialize search
    init() {
        this.loadHistory();
        this.setupEventListeners();
    },

    // Setup event listeners for search inputs
    setupEventListeners() {
        // Listen for search inputs across the platform
        document.querySelectorAll('.global-search-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = e.target.value.trim();
                    if (query) {
                        this.performSearch(query);
                    }
                }
            });
        });

        // Listen for search button clicks
        document.querySelectorAll('.global-search-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.target.closest('.search-container')?.querySelector('.global-search-input');
                if (input) {
                    const query = input.value.trim();
                    if (query) {
                        this.performSearch(query);
                    }
                }
            });
        });
    },

    // Perform global search
    async performSearch(query) {
        if (!query) return;

        // Add to history
        this.addToHistory(query);

        // Redirect to search results page
        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
    },

    // Search in all content
    async searchAll(query) {
        const results = {
            query: query,
            subjects: [],
            lessons: [],
            library: [],
            news: [],
            total: 0
        };

        try {
            // Search in subjects/disciplines
            const subjectsData = mockSubjects.filter(subject => 
                subject.name.toLowerCase().includes(query.toLowerCase()) ||
                (subject.description && subject.description.toLowerCase().includes(query.toLowerCase()))
            );
            results.subjects = subjectsData.slice(0, 5);

            // Search in lessons
            const lessonsData = mockLessons.filter(lesson =>
                lesson.title.toLowerCase().includes(query.toLowerCase()) ||
                (lesson.description && lesson.description.toLowerCase().includes(query.toLowerCase()))
            );
            results.lessons = lessonsData.slice(0, 10);

            // Search in library (if available)
            if (typeof VClassLibrary !== 'undefined') {
                results.library = VClassLibrary.searchBooks(query).slice(0, 8);
            }

            // Search in news (mock data)
            if (typeof mockNews !== 'undefined') {
                results.news = mockNews.filter(item =>
                    item.title.toLowerCase().includes(query.toLowerCase()) ||
                    item.summary.toLowerCase().includes(query.toLowerCase())
                ).slice(0, 5);
            }

            results.total = results.subjects.length + results.lessons.length + 
                           results.library.length + results.news.length;

            return results;
        } catch (error) {
            console.error('Search error:', error);
            return results;
        }
    },

    // Add query to search history
    addToHistory(query) {
        // Remove if already exists
        this.history = this.history.filter(item => item !== query);
        
        // Add to beginning
        this.history.unshift(query);
        
        // Keep only max items
        if (this.history.length > this.maxHistoryItems) {
            this.history = this.history.slice(0, this.maxHistoryItems);
        }
        
        // Save to localStorage
        this.saveHistory();
    },

    // Load search history from localStorage
    loadHistory() {
        try {
            const saved = localStorage.getItem('vclass_search_history');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load search history:', error);
            this.history = [];
        }
    },

    // Save search history to localStorage
    saveHistory() {
        try {
            localStorage.setItem('vclass_search_history', JSON.stringify(this.history));
        } catch (error) {
            console.error('Failed to save search history:', error);
        }
    },

    // Get search history
    getHistory() {
        return this.history;
    },

    // Clear search history
    clearHistory() {
        this.history = [];
        localStorage.removeItem('vclass_search_history');
    },

    // Get search suggestions
    getSuggestions(query) {
        if (!query) return this.getHistory();

        const lowerQuery = query.toLowerCase();
        const suggestions = [];

        // Add matching subjects
        const matchingSubjects = mockSubjects
            .filter(s => s.name.toLowerCase().includes(lowerQuery))
            .map(s => ({ text: s.name, type: 'subject', icon: 'book' }));
        suggestions.push(...matchingSubjects.slice(0, 3));

        // Add matching history
        const matchingHistory = this.history
            .filter(h => h.toLowerCase().includes(lowerQuery))
            .map(h => ({ text: h, type: 'history', icon: 'history' }));
        suggestions.push(...matchingHistory.slice(0, 3));

        return suggestions.slice(0, 8);
    }
};

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        VClassSearch.init();
    });
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.VClassSearch = VClassSearch;
}
