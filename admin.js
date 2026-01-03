// Check Auth
const params = new URLSearchParams(window.location.search);
const currentUser = AuthService.checkAuth('admin');
document.getElementById('admin-name-display').textContent = currentUser.name;

// Navigation Logic
function showSection(id) {
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.querySelector(`a[href="#${id}"]`).classList.add('active');
    renderSection(id);
}

function renderSection(id) {
    if (id === 'dashboard') renderDashboard();
    if (id === 'students') renderUsers('student');
    if (id === 'masters') renderUsers('master');
    if (id === 'courses') renderCourses();
    if (id === 'certificates') renderCertificates();
    if (id === 'feedbacks') renderFeedback();
    if (id === 'results') renderResults();
    if (id === 'scanner-section') { /* Scanner UI handled by buttons */ }

    // Stop scanner if leaving section
    if (id !== 'scanner-section' && adminScanner) {
        stopAdminScanner();
    }
}

// ... 

function renderCertificates() {
    // Populate Selects
    const students = DataService.getUsers().filter(u => u.role === 'student');
    const courses = DataService.getCourses();

    const selStudent = document.getElementById('cert-student');
    // const selCourse = document.getElementById('cert-course'); // REMOVED

    // Refresh options
    if (selStudent.options.length === 1) {
        students.forEach(u => {
            selStudent.innerHTML += `<option value="${u.id}">${u.name} (${u.regNo})</option>`;
        });
    }

    // Render Table
    const certs = DataService.getCertificates();
    const tbody = document.getElementById('table-certs');
    tbody.innerHTML = '';

    // Sort Newest first
    [...certs].reverse().forEach(crt => {
        const sName = students.find(s => s.id === crt.studentId)?.name || 'Unknown';

        let cNames = 'Unknown';
        if (Array.isArray(crt.courseIds)) {
            // Multi course
            cNames = crt.courseIds.map(cid => {
                const c = courses.find(co => co.id === cid);
                return c ? c.code : '?';
            }).join(', ');
        } else {
            // Legacy single course
            const c = courses.find(co => co.id === crt.courseId);
            cNames = c ? c.code : 'Unknown';
        }

        tbody.innerHTML += `<tr><td>${crt.id}</td><td>${sName}</td><td>${cNames}</td><td>${new Date(crt.issueDate).toLocaleDateString()}</td><td>${crt.expiryDate || '-'}</td></tr>`;
    });
}

function renderFeedback() {
    const list = DataService.getFeedback();
    const tbody = document.getElementById('table-feedback');
    tbody.innerHTML = '';

    // Newest first
    [...list].reverse().forEach(f => {
        tbody.innerHTML += `
            <tr>
                <td>${new Date(f.date).toLocaleString()}</td>
                <td>${f.userName}</td>
                <td><span class="badge badge-warning">${f.userRole}</span></td>
                <td>${f.message}</td>
            </tr>
        `;
    });
}

// --- Action Functions ---

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
    if (id === 'modal-course') {
        // Pop Master Select
        const masters = DataService.getUsers().filter(u => u.role === 'master');
        const sel = document.getElementById('course-master');
        sel.innerHTML = '';
        masters.forEach(m => sel.innerHTML += `<option value="${m.id}">${m.name}</option>`);
    }
}
function closeModal() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }

function addUser() {
    const name = document.getElementById('add-name').value;
    const email = document.getElementById('add-email').value;
    const dob = document.getElementById('add-dob').value;
    const role = document.getElementById('add-role').value; // logic needs fixing in HTML to choose which modal or use one general modal. 
    // Wait, I used specific Modals in HTML but `modal-student` has a role select. I'll rely on that.

    if (!name || !email) return alert('Fill all fields');

    const newUser = {
        id: 'u' + Date.now(),
        name, email, dob,
        password: '123',
        role,
        regNo: role === 'student' ? 'REG' + Date.now() : undefined
    };
    DataService.add('vg_users', newUser);
    closeModal();
    renderUsers(role); // Refresh
    renderDashboard();
}

function deleteUser(id, role) {
    if (confirm('Are you sure?')) {
        DataService.remove('vg_users', id);
        renderUsers(role);
        renderDashboard();
    }
}

function addCourse() {
    const name = document.getElementById('course-name').value;
    const code = document.getElementById('course-code').value;
    const credits = document.getElementById('course-credits').value;
    const masterId = document.getElementById('course-master').value;

    if (!name || !code) return alert('Fill all fields');

    DataService.add('vg_courses', {
        id: 'c' + Date.now(),
        name, code, credits, masterId
    });
    closeModal();
    renderCourses();
}

// Initial Render
showSection('dashboard');

// --- Render Functions ---

function renderDashboard() {
    const users = DataService.getUsers();
    const students = users.filter(u => u.role === 'student').length;
    const courses = DataService.getCourses().length;
    const certs = DataService.getCertificates().length;

    document.getElementById('stat-students').innerText = students;
    document.getElementById('stat-courses').innerText = courses;
    document.getElementById('stat-certs').innerText = certs;
}

function renderUsers(role) {
    const list = DataService.getUsers().filter(u => u.role === role);
    const tbody = document.getElementById(role === 'student' ? 'table-students' : 'table-masters');
    tbody.innerHTML = ''; // Clear

    list.forEach(u => {
        const enrollments = role === 'student' ? DataService.getEnrollments().filter(e => e.studentId === u.id).length : '-';
        const coursesTaught = role === 'master' ? DataService.getCourses().filter(c => c.masterId === u.id).length : '-';

        const row = `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${role === 'student' ? (u.regNo || 'N/A') : (u.title || 'Instructor')}</td>
                <td>${role === 'student' ? enrollments : coursesTaught}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}', '${role}')">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderCourses() {
    const courses = DataService.getCourses();
    const users = DataService.getUsers();
    const tbody = document.getElementById('table-courses');
    tbody.innerHTML = '';

    courses.forEach(c => {
        const master = users.find(u => u.id === c.masterId)?.name || 'Unassigned';
        const count = DataService.getEnrollments().filter(e => e.courseId === c.id).length;
        const row = `
            <tr>
                <td>${c.code}</td>
                <td>${c.name}</td>
                <td>${c.credits}</td>
                <td>${master}</td>
                <td>${count}</td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteCourse('${c.id}')">Delete</button></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// --- Results & Grading ---

function renderResults() {
    const enrollments = DataService.getEnrollments().filter(e => e.marks !== null || e.grade !== null); // Only show graded ones
    const users = DataService.getUsers();
    const courses = DataService.getCourses();
    const tbody = document.getElementById('table-results');
    tbody.innerHTML = '';

    if (enrollments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No grades submitted yet.</td></tr>';
        return;
    }

    enrollments.forEach(e => {
        const student = users.find(u => u.id === e.studentId);
        const course = courses.find(c => c.id === e.courseId);
        const statusBadge = e.published
            ? '<span class="badge badge-success">Published</span>'
            : '<span class="badge badge-warning">Pending</span>';

        const actionBtn = e.published
            ? '<button class="btn btn-sm btn-secondary" disabled>Published</button>'
            : `<button class="btn btn-sm btn-primary" onclick="publishResult('${e.id}')">Publish</button>`;

        tbody.innerHTML += `
            <tr>
                <td>${student ? student.name : 'Unknown'}</td>
                <td>${course ? course.code : 'Unknown'}</td>
                <td>${e.marks || '-'}</td>
                <td>${e.grade || '-'}</td>
                <td>${statusBadge}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });
}

function publishResult(id) {
    if (confirm('Publish this result to the student?')) {
        DataService.updateEnrollment(id, { published: true });
        renderResults();
    }
}


// --- Certificates & QR ---

function loadStudentCoursesForCert() {
    const studentId = document.getElementById('cert-student').value;
    const container = document.getElementById('cert-courses-checkboxes');
    container.innerHTML = '';

    if (studentId === 'Select Student...') {
        container.innerHTML = '<p class="text-muted" style="font-size:0.9rem">Select a student first.</p>';
        return;
    }

    // Get finished/enrolled courses? Assuming any enrolled course is eligible or maybe only passed ones?
    // For flexibility, listing all active enrollments.
    const enrollments = DataService.getEnrollments().filter(e => e.studentId === studentId);
    const courses = DataService.getCourses();

    if (enrollments.length === 0) {
        container.innerHTML = '<p class="text-muted" style="font-size:0.9rem">No courses found for this student.</p>';
        return;
    }

    enrollments.forEach(e => {
        const c = courses.find(co => co.id === e.courseId);
        if (c) {
            container.innerHTML += `
                <div style="margin-bottom:5px;">
                    <input type="checkbox" name="cert-course-select" value="${c.id}" id="chk-${c.id}">
                    <label for="chk-${c.id}">${c.code} - ${c.name}</label>
                </div>
             `;
        }
    });
}

function generateCertificate() {
    const studentId = document.getElementById('cert-student').value;
    const expiryDate = document.getElementById('cert-expiry').value;

    if (!studentId || studentId === 'Select Student...') return alert('Please select a valid student');

    // Get selected courses
    const checkboxes = document.querySelectorAll('input[name="cert-course-select"]:checked');
    if (checkboxes.length === 0) return alert('Select at least one course.');

    const courseIds = Array.from(checkboxes).map(cb => cb.value);

    // Get Student
    const student = DataService.getUsers().find(u => u.id === studentId);

    // Generate ID
    const certId = 'CERT-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const issueDate = new Date().toISOString();

    const newCert = {
        id: certId,
        studentId,
        courseIds, // Array now
        candidateName: student.name,
        dob: student.dob || 'N/A',
        issueDate: issueDate,
        expiryDate: expiryDate || 'N/A'
    };

    DataService.issueCertificate(newCert);

    // Show Preview
    document.getElementById('cert-preview').style.display = 'block';

    // Create Verification URL
    // Dynamic path handling to support local file system or hosted
    const verifyPath = window.location.pathname.replace('admin.html', 'verify.html');
    const verifyUrl = `${window.location.origin}${verifyPath}?id=${certId}`;

    document.getElementById('cert-id-display').innerHTML = `
        ${certId}<br>
        <span style="font-size:0.8rem; font-weight:normal">Issued to: ${newCert.candidateName}</span><br>
        <span style="font-size:0.8rem; font-weight:normal">Courses: ${courseIds.length} included</span>
    `;

    const qrContainer = document.getElementById('qr-container');
    qrContainer.innerHTML = ''; // Clear previous
    new QRCode(qrContainer, {
        text: verifyUrl,
        width: 128,
        height: 128
    });

    renderCertificates();
    renderDashboard();
}

function postAnnouncement() {
    const title = document.getElementById('announce-title').value;
    const content = document.getElementById('announce-content').value;
    const type = document.getElementById('announce-type').value;

    if (!title || !content) return;

    DataService.addPost({
        id: 'p' + Date.now(),
        title, content, type,
        authorId: currentUser.id,
        authorRole: 'admin',
        courseId: 'GLOBAL', // System wide
        date: new Date().toISOString(),
        comments: []
    });

    alert('Announcement Posted System-Wide');
    document.getElementById('announce-title').value = '';
    document.getElementById('announce-content').value = '';
}

