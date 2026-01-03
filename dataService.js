/**
 * DataService - Manages all localStorage operations
 */

const STORAGE_KEYS = {
    USERS: 'vg_users',
    COURSES: 'vg_courses',
    ENROLLMENTS: 'vg_enrollments',
    CERTIFICATES: 'vg_certificates',
    POSTS: 'vg_posts',
    FEEDBACK: 'vg_feedback'
};

const DataService = {
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            this.seedData();
        }
    },

    seedData() {
        // Default Admin
        const users = [
            { id: 'u1', name: 'Admin User', email: 'admin@test.com', password: '123', role: 'admin' },
            { id: 'u2', name: 'John Prof', email: 'prof@test.com', password: '123', role: 'master', title: 'Senior Professor' },
            { id: 'u3', name: 'Alice Student', email: 'alice@test.com', password: '123', role: 'student', regNo: 'REG2024001', balance: 500, dob: '2000-01-01' }
        ];

        // Sample Courses
        const courses = [
            { id: 'c1', code: 'CS101', name: 'Intro to Computer Science', masterId: 'u2', credits: 4, description: 'Basics of CS' },
            { id: 'c2', code: 'MATH202', name: 'Advanced Calculus', masterId: 'u2', credits: 3, description: 'Derivatives and Integrals' }
        ];

        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
        localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify([]));
        console.log("Veri-Grade Data Seeded");
    },

    // Generic Getters
    getAll(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    },

    getById(key, id) {
        const items = this.getAll(key);
        return items.find(i => i.id === id);
    },

    // Generic Setters
    add(key, item) {
        const items = this.getAll(key);
        items.push(item);
        localStorage.setItem(key, JSON.stringify(items));
    },

    update(key, id, updates) {
        let items = this.getAll(key);
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            localStorage.setItem(key, JSON.stringify(items));
            return true;
        }
        return false;
    },

    remove(key, id) {
        let items = this.getAll(key);
        items = items.filter(i => i.id !== id);
        localStorage.setItem(key, JSON.stringify(items));
    },

    // Users
    getUsers() { return this.getAll(STORAGE_KEYS.USERS); },
    getUserByEmail(email) { return this.getUsers().find(u => u.email === email); },

    // Courses
    getCourses() { return this.getAll(STORAGE_KEYS.COURSES); },

    // Enrollments
    getEnrollments() { return this.getAll(STORAGE_KEYS.ENROLLMENTS); },
    enrollStudent(studentId, courseId) {
        const enrollments = this.getEnrollments();
        if (enrollments.some(e => e.studentId === studentId && e.courseId === courseId)) return false;

        const newEnrollment = {
            id: 'e' + Date.now() + Math.random().toString(36).substr(2, 5),
            studentId,
            courseId,
            date: new Date().toISOString(),
            status: 'Active',
            marks: null,
            grade: null,
            published: false
        };
        this.add(STORAGE_KEYS.ENROLLMENTS, newEnrollment);
        return true;
    },
    updateEnrollment(id, updates) {
        return this.update(STORAGE_KEYS.ENROLLMENTS, id, updates);
    },

    // Certificates
    getCertificates() { return this.getAll(STORAGE_KEYS.CERTIFICATES); },
    issueCertificate(certData) {
        // certData expected keys: id, studentId, courseIds (Array), candidateName, dob, issueDate, expiryDate
        this.add(STORAGE_KEYS.CERTIFICATES, certData);
    },

    // Posts (Notices)
    getPosts() { return this.getAll(STORAGE_KEYS.POSTS); },
    addPost(post) { this.add(STORAGE_KEYS.POSTS, post); },

    // Feedback
    getFeedback() { return this.getAll(STORAGE_KEYS.FEEDBACK); },
    addFeedback(fb) { this.add(STORAGE_KEYS.FEEDBACK, fb); },

    // Helpers
    generateId(prefix) { return prefix + Math.random().toString(36).substr(2, 9).toUpperCase(); }
};

DataService.init();

// Simple Auth Helper
const AuthService = {
    login(email, password) {
        const user = DataService.getUserByEmail(email);
        if (user && user.password === password) {
            sessionStorage.setItem('vg_session', JSON.stringify(user));
            return user;
        }
        return null;
    },
    logout() {
        sessionStorage.removeItem('vg_session');
        window.location.href = 'index.html';
    },
    getCurrentUser() {
        return JSON.parse(sessionStorage.getItem('vg_session'));
    },
    checkAuth(role) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        if (role && user.role !== role && user.role !== 'admin') { // Admin can access all usually, but strict here
            if (role === 'master' && user.role !== 'master') window.location.href = 'index.html';
            if (role === 'student' && user.role !== 'student') window.location.href = 'index.html';
        }
        return user;
    }
};
