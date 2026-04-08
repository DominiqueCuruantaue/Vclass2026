// Library.js - Digital Library functionality
(function() {
    'use strict';

    // Mock library data
    const mockBooks = [
        {
            id: 1,
            title: 'Matemática 10ª Classe - Completo',
            author: 'Ministério da Educação',
            subject: 'matematica',
            grade: '10',
            type: 'book',
            pages: 320,
            size: '12.5 MB',
            downloads: 234,
            rating: 4.5,
            thumbnail: 'https://via.placeholder.com/200x280/6366f1/ffffff?text=Matemática',
            pdf_url: '#',
            description: 'Livro completo de Matemática para 10ª classe, incluindo álgebra, geometria e trigonometria.',
            isFavorite: false
        },
        {
            id: 2,
            title: 'Português - Gramática e Literatura',
            author: 'Prof. João Silva',
            subject: 'portugues',
            grade: '11',
            type: 'book',
            pages: 280,
            size: '10.2 MB',
            downloads: 189,
            rating: 4.3,
            thumbnail: 'https://via.placeholder.com/200x280/ef4444/ffffff?text=Português',
            pdf_url: '#',
            description: 'Manual completo de Português com gramática, literatura e exercícios práticos.',
            isFavorite: true
        },
        {
            id: 3,
            title: 'Física - Mecânica Clássica',
            author: 'Dr. Carlos Moura',
            subject: 'fisica',
            grade: '11',
            type: 'book',
            pages: 245,
            size: '15.8 MB',
            downloads: 167,
            rating: 4.7,
            thumbnail: 'https://via.placeholder.com/200x280/10b981/ffffff?text=Física',
            pdf_url: '#',
            description: 'Estudo completo de mecânica clássica, cinemática e dinâmica.',
            isFavorite: false
        },
        {
            id: 4,
            title: 'Química Orgânica - Apostila',
            author: 'Profª. Ana Santos',
            subject: 'quimica',
            grade: '12',
            type: 'handout',
            pages: 85,
            size: '4.2 MB',
            downloads: 142,
            rating: 4.4,
            thumbnail: 'https://via.placeholder.com/200x280/f59e0b/ffffff?text=Química',
            pdf_url: '#',
            description: 'Apostila resumida de química orgânica com exercícios resolvidos.',
            isFavorite: false
        },
        {
            id: 5,
            title: 'Exercícios de Matemática - Funções',
            author: 'Prof. Pedro Costa',
            subject: 'matematica',
            grade: '10',
            type: 'exercises',
            pages: 45,
            size: '2.1 MB',
            downloads: 312,
            rating: 4.6,
            thumbnail: 'https://via.placeholder.com/200x280/8b5cf6/ffffff?text=Exercícios',
            pdf_url: '#',
            description: 'Lista completa de exercícios sobre funções com gabarito.',
            isFavorite: true
        },
        {
            id: 6,
            title: 'Biologia - Genética',
            author: 'Dr. Maria Ferreira',
            subject: 'biologia',
            grade: '12',
            type: 'book',
            pages: 198,
            size: '8.7 MB',
            downloads: 156,
            rating: 4.8,
            thumbnail: 'https://via.placeholder.com/200x280/14b8a6/ffffff?text=Biologia',
            pdf_url: '#',
            description: 'Manual completo de genética, DNA, RNA e hereditariedade.',
            isFavorite: false
        },
        {
            id: 7,
            title: 'História de Moçambique',
            author: 'Prof. Armando Guebuza',
            subject: 'historia',
            grade: '11',
            type: 'book',
            pages: 310,
            size: '11.3 MB',
            downloads: 198,
            rating: 4.5,
            thumbnail: 'https://via.placeholder.com/200x280/f97316/ffffff?text=História',
            pdf_url: '#',
            description: 'História completa de Moçambique desde a época colonial até a independência.',
            isFavorite: false
        },
        {
            id: 8,
            title: 'Geografia - Climatologia',
            author: 'Profª. Teresa Macamo',
            subject: 'geografia',
            grade: '10',
            type: 'handout',
            pages: 67,
            size: '5.4 MB',
            downloads: 134,
            rating: 4.2,
            thumbnail: 'https://via.placeholder.com/200x280/06b6d4/ffffff?text=Geografia',
            pdf_url: '#',
            description: 'Apostila sobre climatologia, tipos de clima e fenômenos atmosféricos.',
            isFavorite: false
        }
    ];

    let currentCategory = 'all';
    let currentBooks = [...mockBooks];

    // Load library
    window.loadLibrary = function() {
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
            renderBooks(mockBooks);
        }, 500);
    };

    // Render books
    function renderBooks(books) {
        const grid = document.getElementById('books-grid');
        const emptyState = document.getElementById('empty-state');

        if (books.length === 0) {
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        grid.classList.remove('hidden');
        grid.innerHTML = '';

        books.forEach(book => {
            const card = createBookCard(book);
            grid.appendChild(card);
        });
    }

    // Create book card
    function createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition';
        
        const typeColors = {
            book: 'bg-blue-100 text-blue-800',
            handout: 'bg-green-100 text-green-800',
            exercises: 'bg-purple-100 text-purple-800'
        };

        const typeLabels = {
            book: 'Livro',
            handout: 'Apostila',
            exercises: 'Exercícios'
        };

        card.innerHTML = `
            <div class="relative">
                <img src="${book.thumbnail}" alt="${book.title}" class="w-full h-48 object-cover">
                <div class="absolute top-2 right-2">
                    <button onclick="toggleFavorite(${book.id})" class="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100">
                        <i class="fas fa-heart ${book.isFavorite ? 'text-red-500' : 'text-gray-400'}"></i>
                    </button>
                </div>
                <div class="absolute bottom-2 left-2">
                    <span class="px-2 py-1 ${typeColors[book.type]} rounded-full text-xs font-medium">
                        ${typeLabels[book.type]}
                    </span>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-gray-900 mb-1 line-clamp-2">${book.title}</h3>
                <p class="text-sm text-gray-600 mb-2">${book.author}</p>
                <div class="flex items-center text-sm text-gray-500 mb-3">
                    <i class="fas fa-star text-yellow-400 mr-1"></i>
                    <span class="mr-3">${book.rating}</span>
                    <i class="fas fa-download mr-1"></i>
                    <span>${book.downloads}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span><i class="fas fa-file-pdf mr-1"></i>${book.pages} páginas</span>
                    <span><i class="fas fa-hdd mr-1"></i>${book.size}</span>
                </div>
                <div class="flex space-x-2">
                    <button onclick="viewBook(${book.id})" class="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition">
                        <i class="fas fa-eye mr-1"></i>Visualizar
                    </button>
                    <button onclick="downloadBook(${book.id})" class="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    // Filter books
    window.filterBooks = function(category) {
        currentCategory = category;
        let filtered = [...mockBooks];

        if (category !== 'all') {
            if (category === 'favorites') {
                filtered = filtered.filter(book => book.isFavorite);
            } else {
                filtered = filtered.filter(book => book.type === category);
            }
        }

        // Apply other filters
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const subjectFilter = document.getElementById('subject-filter').value;
        const gradeFilter = document.getElementById('grade-filter').value;

        if (searchTerm) {
            filtered = filtered.filter(book => 
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                book.description.toLowerCase().includes(searchTerm)
            );
        }

        if (subjectFilter) {
            filtered = filtered.filter(book => book.subject === subjectFilter);
        }

        if (gradeFilter) {
            filtered = filtered.filter(book => book.grade === gradeFilter);
        }

        currentBooks = filtered;
        renderBooks(filtered);
    };

    // Toggle favorite
    window.toggleFavorite = function(bookId) {
        const book = mockBooks.find(b => b.id === bookId);
        if (book) {
            book.isFavorite = !book.isFavorite;
            VClass.showNotification(
                book.isFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
                book.isFavorite ? 'success' : 'info'
            );
            filterBooks(currentCategory);
        }
    };

    // View book
    window.viewBook = function(bookId) {
        const book = mockBooks.find(b => b.id === bookId);
        if (book) {
            VClass.showNotification('Abrindo visualizador...', 'info');
            // In production, open PDF viewer
            setTimeout(() => {
                window.open(book.pdf_url, '_blank');
            }, 500);
        }
    };

    // Download book
    window.downloadBook = function(bookId) {
        const book = mockBooks.find(b => b.id === bookId);
        if (book) {
            VClass.showLoading('Preparando download...');
            // In production, trigger actual download
            setTimeout(() => {
                VClass.hideLoading();
                VClass.showNotification('Download iniciado!', 'success');
                book.downloads++;
                filterBooks(currentCategory);
            }, 1000);
        }
    };

    // Search functionality with debounce
    const searchInput = document.getElementById('search-input');
    const subjectFilter = document.getElementById('subject-filter');
    const gradeFilter = document.getElementById('grade-filter');

    if (searchInput) {
        searchInput.addEventListener('input', VClass.debounce(function() {
            filterBooks(currentCategory);
        }, 300));
    }

    if (subjectFilter) {
        subjectFilter.addEventListener('change', function() {
            filterBooks(currentCategory);
        });
    }

    if (gradeFilter) {
        gradeFilter.addEventListener('change', function() {
            filterBooks(currentCategory);
        });
    }

    // Upload form
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            VClass.showLoading('Fazendo upload...');
            
            // Simulate upload
            setTimeout(() => {
                VClass.hideLoading();
                VClass.showNotification('Material adicionado com sucesso!', 'success');
                closeUploadModal();
                uploadForm.reset();
            }, 2000);
        });
    }

})();
