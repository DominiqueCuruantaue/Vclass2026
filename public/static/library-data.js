// VClass Library Mock Data
// Mock data for digital library - books, handouts, exercises

const VClassLibrary = {
    // Library statistics
    stats: {
        totalBooks: 124,
        totalHandouts: 68,
        totalExercises: 89,
        totalDownloads: 1247
    },

    // Book categories
    categories: [
        { id: 'all', name: 'Todos', icon: 'th-large', count: 124 },
        { id: 'books', name: 'Livros', icon: 'book', count: 45 },
        { id: 'handouts', name: 'Apostilas', icon: 'file-pdf', count: 38 },
        { id: 'exercises', name: 'Exercícios', icon: 'tasks', count: 41 }
    ],

    // Featured books
    featured: [
        {
            id: 1,
            title: 'Matemática - 12ª Classe',
            author: 'Ministério da Educação',
            subject: 'Matemática',
            grade: 12,
            category: 'books',
            cover: 'https://via.placeholder.com/200x280/3b82f6/ffffff?text=Mat+12',
            pages: 320,
            downloads: 2456,
            rating: 4.8,
            isFeatured: true,
            description: 'Livro oficial de Matemática para a 12ª Classe do Sistema Nacional de Ensino',
            publishedYear: 2023,
            language: 'Português',
            fileSize: '12.5 MB',
            format: 'PDF'
        },
        {
            id: 2,
            title: 'Física e Química - 11ª Classe',
            author: 'Ministério da Educação',
            subject: 'Física',
            grade: 11,
            category: 'books',
            cover: 'https://via.placeholder.com/200x280/10b981/ffffff?text=Fis+11',
            pages: 280,
            downloads: 1892,
            rating: 4.7,
            isFeatured: true,
            description: 'Manual de Física e Química para estudantes da 11ª Classe',
            publishedYear: 2023,
            language: 'Português',
            fileSize: '10.8 MB',
            format: 'PDF'
        },
        {
            id: 3,
            title: 'Biologia - 10ª Classe',
            author: 'Ministério da Educação',
            subject: 'Biologia',
            grade: 10,
            category: 'books',
            cover: 'https://via.placeholder.com/200x280/10b981/ffffff?text=Bio+10',
            pages: 256,
            downloads: 1654,
            rating: 4.6,
            isFeatured: true,
            description: 'Livro de Biologia com conteúdos adaptados ao programa nacional',
            publishedYear: 2022,
            language: 'Português',
            fileSize: '9.2 MB',
            format: 'PDF'
        }
    ],

    // All books collection
    books: [
        // Matemática
        {
            id: 4,
            title: 'Álgebra Linear - Exercícios Resolvidos',
            author: 'Prof. Carlos Manuel',
            subject: 'Matemática',
            grade: 12,
            category: 'exercises',
            cover: 'https://via.placeholder.com/200x280/3b82f6/ffffff?text=Alg+Ex',
            pages: 120,
            downloads: 984,
            rating: 4.5,
            isFeatured: false,
            publishedYear: 2023
        },
        {
            id: 5,
            title: 'Geometria Analítica - Apostila',
            author: 'Prof. Maria Santos',
            subject: 'Matemática',
            grade: 11,
            category: 'handouts',
            cover: 'https://via.placeholder.com/200x280/3b82f6/ffffff?text=Geo+Ap',
            pages: 80,
            downloads: 756,
            rating: 4.4,
            isFeatured: false,
            publishedYear: 2023
        },
        
        // Português
        {
            id: 6,
            title: 'Língua Portuguesa - 12ª Classe',
            author: 'Ministério da Educação',
            subject: 'Português',
            grade: 12,
            category: 'books',
            cover: 'https://via.placeholder.com/200x280/8b5cf6/ffffff?text=Port+12',
            pages: 300,
            downloads: 2134,
            rating: 4.7,
            isFeatured: false,
            publishedYear: 2023
        },
        {
            id: 7,
            title: 'Gramática Prática - Exercícios',
            author: 'Prof. Ana Oliveira',
            subject: 'Português',
            grade: 11,
            category: 'exercises',
            cover: 'https://via.placeholder.com/200x280/8b5cf6/ffffff?text=Gram+Ex',
            pages: 95,
            downloads: 1245,
            rating: 4.6,
            isFeatured: false,
            publishedYear: 2022
        },
        
        // Física
        {
            id: 8,
            title: 'Mecânica Clássica - Teoria e Prática',
            author: 'Prof. João Pedro',
            subject: 'Física',
            grade: 12,
            category: 'books',
            cover: 'https://via.placeholder.com/200x280/10b981/ffffff?text=Mec+12',
            pages: 240,
            downloads: 1567,
            rating: 4.8,
            isFeatured: false,
            publishedYear: 2023
        },
        {
            id: 9,
            title: 'Eletricidade - Exercícios Práticos',
            author: 'Prof. Teresa Lima',
            subject: 'Física',
            grade: 11,
            category: 'exercises',
            cover: 'https://via.placeholder.com/200x280/10b981/ffffff?text=Ele+Ex',
            pages: 110,
            downloads: 892,
            rating: 4.5,
            isFeatured: false,
            publishedYear: 2023
        },
        
        // Química
        {
            id: 10,
            title: 'Química Orgânica - 12ª Classe',
            author: 'Ministério da Educação',
            subject: 'Química',
            grade: 12,
            category: 'books',
            cover: 'https://via.placeholder.com/200x280/f59e0b/ffffff?text=Quim+12',
            pages: 280,
            downloads: 1789,
            rating: 4.7,
            isFeatured: false,
            publishedYear: 2023
        },
        {
            id: 11,
            title: 'Reações Químicas - Apostila',
            author: 'Prof. Ricardo Sousa',
            subject: 'Química',
            grade: 11,
            category: 'handouts',
            cover: 'https://via.placeholder.com/200x280/f59e0b/ffffff?text=Reac+Ap',
            pages: 75,
            downloads: 654,
            rating: 4.3,
            isFeatured: false,
            publishedYear: 2022
        },
        
        // História
        {
            id: 12,
            title: 'História de Moçambique - 12ª Classe',
            author: 'Ministério da Educação',
            subject: 'História',
            grade: 12,
            category: 'books',
            cover: 'https://via.placeholder.com/200x280/ef4444/ffffff?text=Hist+12',
            pages: 320,
            downloads: 1923,
            rating: 4.8,
            isFeatured: false,
            publishedYear: 2023
        },
        {
            id: 13,
            title: 'Segunda Guerra Mundial - Resumo',
            author: 'Prof. Alberto Costa',
            subject: 'História',
            grade: 11,
            category: 'handouts',
            cover: 'https://via.placeholder.com/200x280/ef4444/ffffff?text=2GM+Res',
            pages: 60,
            downloads: 1134,
            rating: 4.6,
            isFeatured: false,
            publishedYear: 2023
        },
        
        // Geografia
        {
            id: 14,
            title: 'Geografia de Moçambique - 12ª Classe',
            author: 'Ministério da Educação',
            subject: 'Geografia',
            grade: 12,
            category: 'books',
            cover: 'https://via.placeholder.com/200x280/06b6d4/ffffff?text=Geo+12',
            pages: 290,
            downloads: 1678,
            rating: 4.7,
            isFeatured: false,
            publishedYear: 2023
        },
        {
            id: 15,
            title: 'Climatologia - Exercícios',
            author: 'Prof. Paula Fernandes',
            subject: 'Geografia',
            grade: 11,
            category: 'exercises',
            cover: 'https://via.placeholder.com/200x280/06b6d4/ffffff?text=Clim+Ex',
            pages: 85,
            downloads: 743,
            rating: 4.4,
            isFeatured: false,
            publishedYear: 2022
        },
        
        // Biologia
        {
            id: 16,
            title: 'Genética - 12ª Classe',
            author: 'Ministério da Educação',
            subject: 'Biologia',
            grade: 12,
            category: 'books',
            cover: 'https://via.placeholder.com/200x280/10b981/ffffff?text=Gen+12',
            pages: 260,
            downloads: 1456,
            rating: 4.8,
            isFeatured: false,
            publishedYear: 2023
        },
        {
            id: 17,
            title: 'Ecologia e Meio Ambiente - Apostila',
            author: 'Prof. Luísa Martins',
            subject: 'Biologia',
            grade: 11,
            category: 'handouts',
            cover: 'https://via.placeholder.com/200x280/10b981/ffffff?text=Eco+Ap',
            pages: 95,
            downloads: 1089,
            rating: 4.7,
            isFeatured: false,
            publishedYear: 2023
        },
        
        // Inglês
        {
            id: 18,
            title: 'English Grammar - 12ª Classe',
            author: 'Ministério da Educação',
            subject: 'Inglês',
            grade: 12,
            category: 'books',
            cover: 'https://via.placeholder.com/200x280/6366f1/ffffff?text=Eng+12',
            pages: 240,
            downloads: 1876,
            rating: 4.6,
            isFeatured: false,
            publishedYear: 2023
        },
        {
            id: 19,
            title: 'English Vocabulary - Exercícios',
            author: 'Prof. Michael Brown',
            subject: 'Inglês',
            grade: 11,
            category: 'exercises',
            cover: 'https://via.placeholder.com/200x280/6366f1/ffffff?text=Voc+Ex',
            pages: 100,
            downloads: 1234,
            rating: 4.5,
            isFeatured: false,
            publishedYear: 2023
        }
    ],

    // Subject colors mapping
    subjectColors: {
        'Matemática': '#3b82f6',
        'Português': '#8b5cf6',
        'Física': '#10b981',
        'Química': '#f59e0b',
        'Biologia': '#10b981',
        'História': '#ef4444',
        'Geografia': '#06b6d4',
        'Inglês': '#6366f1'
    },

    // Get all books
    getAllBooks() {
        return [...this.featured, ...this.books];
    },

    // Get books by category
    getBooksByCategory(category) {
        const allBooks = this.getAllBooks();
        if (category === 'all') return allBooks;
        return allBooks.filter(book => book.category === category);
    },

    // Get books by subject
    getBooksBySubject(subject) {
        return this.getAllBooks().filter(book => book.subject === subject);
    },

    // Get books by grade
    getBooksByGrade(grade) {
        return this.getAllBooks().filter(book => book.grade === parseInt(grade));
    },

    // Search books
    searchBooks(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.getAllBooks().filter(book => 
            book.title.toLowerCase().includes(lowercaseQuery) ||
            book.author.toLowerCase().includes(lowercaseQuery) ||
            book.subject.toLowerCase().includes(lowercaseQuery)
        );
    },

    // Get book by ID
    getBookById(id) {
        return this.getAllBooks().find(book => book.id === parseInt(id));
    }
};

// Make it globally available
if (typeof window !== 'undefined') {
    window.VClassLibrary = VClassLibrary;
}
