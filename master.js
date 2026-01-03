// Auth
const currentUser = AuthService.checkAuth('master');
document.getElementById('master-name').innerText = currentUser.name;

let activeCourseId = null;

function renderDashboard() {
    const courses = DataService.getCourses().filter(c => c.masterId === currentUser.id);
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = '';

    courses.forEach(c => {
        const studentCount = DataService.getEnrollments().filter(e => e.courseId === c.id).length;
        grid.innerHTML += `
            <div class="card">
                <h3>${c.code}</h3>
                <p>${c.name}</p>
                <div class="flex justify-between align-center mt-1">
                    <span class="badge badge-success">${studentCount} Students</span>
                    <button class="btn btn-primary btn-sm" onclick="openCourse('${c.id}')">Manage</button>
                </div>
            </div>
        `;
    });
}

function openCourse(id) {
    activeCourseId = id;
    const course = DataService.getCourses().find(c => c.id === id);
    document.getElementById('view-course-name').innerText = `${course.code}: ${course.name}`;

    document.getElementById('courses-grid').style.display = 'none'; // Hide grid
    document.getElementById('course-view').style.display = 'block'; // Show detail

    loadPosts();
    loadStudents();
}

function backToDashboard() {
    activeCourseId = null;
    document.getElementById('courses-grid').style.display = 'grid';
    document.getElementById('course-view').style.display = 'none';
}

function switchTab(tab) {
    document.getElementById('tab-board').style.display = tab === 'board' ? 'block' : 'none';
    document.getElementById('tab-students').style.display = tab === 'students' ? 'block' : 'none';
}

function loadPosts() {
    const posts = DataService.getPosts().filter(p => p.courseId === activeCourseId);
    const list = document.getElementById('posts-list');
    list.innerHTML = '';

    if (posts.length === 0) list.innerHTML = '<p class="text-muted">No posts yet.</p>';

    // Reverse sort
    [...posts].reverse().forEach(p => {
        list.innerHTML += `
            <div class="post-item">
                <h4 style="margin-bottom:0.2rem">${p.title}</h4>
                <p style="font-size:0.8rem; color:#888;">${new Date(p.date).toLocaleString()}</p>
                <p class="mt-1">${p.content}</p>
            </div>
        `;
    });
}

function postToBoard() {
    const title = document.getElementById('new-post-title').value;
    const content = document.getElementById('new-post-content').value;

    if (!title || !content) return alert('Empty post');

    DataService.addPost({
        id: 'post' + Date.now(),
        courseId: activeCourseId,
        authorId: currentUser.id,
        authorRole: 'master',
        title, content,
        date: new Date().toISOString(),
        comments: []
    });

    document.getElementById('new-post-title').value = '';
    document.getElementById('new-post-content').value = '';
    loadPosts();
}

function loadStudents() {
    const enrollments = DataService.getEnrollments().filter(e => e.courseId === activeCourseId);
    const users = DataService.getUsers();
    const tbody = document.getElementById('student-list-body');
    tbody.innerHTML = '';

    enrollments.forEach(e => {
        const student = users.find(u => u.id === e.studentId);
        if (student) {
            tbody.innerHTML += `
                <tr>
                    <td>${student.name}</td>
                    <td>${student.email}</td>
                    <td>
                        <input type="number" id="marks-${e.id}" value="${e.marks || ''}" placeholder="Marks" style="width: 60px; padding: 4px;">
                        <input type="text" id="grade-${e.id}" value="${e.grade || ''}" placeholder="Grade" style="width: 50px; padding: 4px;">
                        <button class="btn btn-sm btn-primary" onclick="saveGrade('${e.id}')">Save</button>
                        ${e.published ? '<span class="badge badge-success">Published</span>' : '<span class="badge badge-warning">Draft</span>'}
                    </td>
                </tr>
            `;
        }
    });
}

function saveGrade(enrollmentId) {
    const marks = document.getElementById(`marks-${enrollmentId}`).value;
    const grade = document.getElementById(`grade-${enrollmentId}`).value;

    DataService.updateEnrollment(enrollmentId, {
        marks: marks,
        grade: grade
    });
    alert('Grade Saved!');
    loadStudents(); // Refresh to show status or updated values
}

function showSection(sec) {
    if (sec === 'dashboard') {
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('feedback').style.display = 'none';

        // Reset view
        if (activeCourseId) backToDashboard();
    } else {
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('feedback').style.display = 'block';
    }
}

// Init
renderDashboard();

function submitMasterFeedback() {
    const msg = document.getElementById('master-feedback-msg').value;
    if (!msg) return alert('Please enter a message');

    DataService.addFeedback({
        id: 'fb' + Date.now(),
        userId: currentUser.id,
        userRole: 'master',
        userName: currentUser.name,
        message: msg,
        date: new Date().toISOString()
    });

    alert('Feedback Sent!');
    document.getElementById('master-feedback-msg').value = '';
}
