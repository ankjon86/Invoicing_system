// Temporary authentication - always authenticated for now
function isAuthenticated() {
    return true; // Always return true to bypass login
}

function login(email) {
    localStorage.setItem('userEmail', email || 'demo@example.com');
    return true;
}

function logout() {
    localStorage.clear();
    // Optional: Redirect if you want
    // window.location.href = 'index.html';
}
