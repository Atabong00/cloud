// Auth
const currentUser = AuthService.checkAuth('student');
document.getElementById('student-name').innerText = currentUser.name;

// --- Navigation ---
function showSection(id) {
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    document.getElementById(id).style.display = 'block';

    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    // approximate active link check
    renderSection(id);
}

showSection('dashboard');

function renderSection(id) {
    if (id === 'dashboard') loadDashboard();
    if (id === 'registration') loadAvailableCourses();
    if (id === 'my-courses') loadMyCourses();
    if (id === 'certificates') loadCertificates();
}

// --- Logic ---

function loadDashboard() {
    const enrollments = DataService.getEnrollments().filter(e => e.studentId === currentUser.id);
    const certs = DataService.getCertificates().filter(c => c.studentId === currentUser.id);

    document.getElementById('stat-enrolled').innerText = enrollments.length;
    document.getElementById('stat-certs').innerText = certs.length;
    // Mock GPA
    document.getElementById('stat-gpa').innerText = '3.8';

    // Recent Feed (System wide or my courses)
    const myCourseIds = enrollments.map(e => e.courseId);
    const posts = DataService.getPosts().filter(p => myCourseIds.includes(p.courseId) || p.courseId === 'GLOBAL');
    const feed = document.getElementById('feed-recent');
    feed.innerHTML = '';

    posts.slice(0, 3).forEach(p => {
        feed.innerHTML += `
            <div class="card mb-1" style="padding:1rem;">
                <h4>${p.title} <span class="badge badge-warning" style="font-size:0.6rem">${p.type}</span></h4>
                <p>${p.content}</p>
                <small class="text-muted">${new Date(p.date).toLocaleString()}</small>
            </div>
        `;
    });
}

function loadAvailableCourses() {
    const courses = DataService.getCourses();
    const myEnrollments = DataService.getEnrollments().filter(e => e.studentId === currentUser.id);
    const myCourseIds = myEnrollments.map(e => e.courseId);

    const container = document.getElementById('available-courses-list');
    container.innerHTML = '';

    courses.forEach(c => {
        const isEnrolled = myCourseIds.includes(c.id);
        const btn = isEnrolled
            ? `<button class="btn btn-secondary btn-sm" disabled>Enrolled</button>`
            : `<button class="btn btn-primary btn-sm" onclick="enroll('${c.id}')">Enroll</button>`;

        container.innerHTML += `
            <div class="course-card mb-1">
                <div>
                    <h3>${c.code}</h3>
                    <p>${c.name} (${c.credits} Credits)</p>
                </div>
                ${btn}
            </div>
        `;
    });
}

function enroll(courseId) {
    if (DataService.enrollStudent(currentUser.id, courseId)) {
        alert('Enrolled Successfully!');
        loadAvailableCourses();
    }
}

function loadMyCourses() {
    const enrollments = DataService.getEnrollments().filter(e => e.studentId === currentUser.id);
    const courses = DataService.getCourses();
    const list = document.getElementById('active-courses-list');
    list.innerHTML = '';

    enrollments.forEach(e => {
        const c = courses.find(co => co.id === e.courseId);
        if (c) {
            list.innerHTML += `
                <div class="course-card mb-1">
                    <div>
                        <h3>${c.code}: ${c.name}</h3>
                        <span class="badge badge-success">Active</span>
                        ${e.published && e.grade ? `<span class="badge badge-warning" style="margin-left:5px;">Grade: ${e.grade} (${e.marks}%)</span>` : ''}
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="viewBoard('${c.id}')">View Board / Notices</button>
                </div>
            `;
        }
    });
}

function viewBoard(courseId) {
    const posts = DataService.getPosts().filter(p => p.courseId === courseId);
    document.getElementById('course-board-view').style.display = 'block';
    const container = document.getElementById('board-posts');
    container.innerHTML = '';

    if (posts.length === 0) container.innerHTML = '<p>No notices.</p>';
    posts.forEach(p => {
        container.innerHTML += `<div style="border-bottom:1px solid #eee; padding:10px 0;"><strong>${p.title}</strong><br>${p.content}</div>`;
    });
}
function closeBoard() { document.getElementById('course-board-view').style.display = 'none'; }

function printRegistration() {
    // Populate Print Area
    const enrollments = DataService.getEnrollments().filter(e => e.studentId === currentUser.id);
    const courses = DataService.getCourses();

    document.getElementById('print-name').innerText = currentUser.name;
    document.getElementById('print-reg').innerText = currentUser.regNo || 'N/A';
    document.getElementById('print-date').innerText = new Date().toLocaleDateString();

    const tbody = document.getElementById('print-courses-body');
    tbody.innerHTML = '';

    enrollments.forEach(e => {
        const c = courses.find(co => co.id === e.courseId);
        if (c) {
            tbody.innerHTML += `<tr><td>${c.code}</td><td>${c.name}</td><td>${c.credits}</td></tr>`;
        }
    });

    window.print();
}

function simulatePayment() {
    const amount = document.getElementById('pay-amount').value;
    if (!amount) return;
    alert(`Payment of $${amount} Successful!`);
    document.getElementById('wallet-balance').innerText = '$' + (500 - parseFloat(amount)).toFixed(2);
    document.getElementById('pay-amount').value = '';
}

function loadCertificates() {
    const certs = DataService.getCertificates().filter(c => c.studentId === currentUser.id);
    const courses = DataService.getCourses();
    const container = document.getElementById('certs-list');
    container.innerHTML = '';

    certs.forEach(cert => {
        const course = courses.find(c => c.id === cert.courseId);
        const divId = `qr-${cert.id}`;

        // Create Verification URL
        const verifyPath = window.location.pathname.replace('student.html', 'verify.html');
        const verifyUrl = `${window.location.origin}${verifyPath}?id=${cert.id}`;

        container.innerHTML += `
            <div class="card text-center">
                <h3>${course ? course.name : 'Certificate'}</h3>
                <p class="text-muted">Issued: ${new Date(cert.issueDate).toLocaleDateString()}</p>
                <p class="text-muted" style="font-size:0.9rem">Expires: ${cert.expiryDate || 'Never'}</p>
                <div id="${divId}" style="margin:1rem auto; display:inline-block;"></div>
                <p style="font-weight:bold; font-family:monospace;">${cert.id}</p>
            </div>
        `;

        // Wait for DOM
        setTimeout(() => {
            new QRCode(document.getElementById(divId), {
                text: verifyUrl,
                width: 100, height: 100
            });
        }, 100);
    });
}

function submitFeedback() {
    const msg = document.getElementById('feedback-msg').value;
    if (!msg) return alert('Please enter a message');

    DataService.addFeedback({
        id: 'fb' + Date.now(),
        userId: currentUser.id,
        userRole: 'student',
        userName: currentUser.name,
        message: msg,
        date: new Date().toISOString()
    });

    alert('Feedback Sent!');
    document.getElementById('feedback-msg').value = '';
}
