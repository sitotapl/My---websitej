document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        showDashboard();
    } else {
        showAuthPage();
    }
    updateDateTime();
    setInterval(updateDateTime, 60000);
});

// --- CORE APP LOGIC ---
function showDashboard() {
    document.getElementById('auth-page').classList.add('hidden');
    document.getElementById('dashboard-page').classList.remove('hidden');
    renderBalanceChart();
    loadWithdrawalSettings();
    updateGreeting();
    renderTransactions();
}

function showAuthPage() {
    document.getElementById('dashboard-page').classList.add('hidden');
    document.getElementById('auth-page').classList.remove('hidden');
    generateCaptcha('login-captcha-text');
    generateCaptcha('reg-captcha-text');
}

function showPage(pageId, element) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    element.classList.add('active');
    if (pageId === 'withdraw') loadWithdrawalInfo();
    if (pageId === 'transactions') renderTransactions();
}

// --- AUTHENTICATION & CAPTCHA ---
function generateCaptcha(elementId) {
    const chars = 'AbCDEfGHjKLMnPQRStUVWXYz123456789';
    let captcha = '';
    for (let i = 0; i < 5; i++) captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    document.getElementById(elementId).textContent = captcha;
}

function login() {
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;
    const captchaInput = document.getElementById('login-captcha-input').value;
    const captchaText = document.getElementById('login-captcha-text').textContent;

    if (phone.length < 10 || password.length < 6) { return displayMessage('login-error', 'Invalid credentials.'); }
    if (captchaInput.toLowerCase() !== captchaText.toLowerCase()) {
        generateCaptcha('login-captcha-text');
        return displayMessage('login-error', 'Verification code is incorrect.');
    }
    localStorage.setItem('isLoggedIn', 'true');
    // Name is not available at login, will be set at registration
    showDashboard();
}

function register() {
    const fullName = document.getElementById('reg-fullname').value.trim();
    if (!fullName) return displayMessage('register-error', 'Full name is required.');
    // Add other validations as needed...
    localStorage.setItem('userName', fullName);
    alert('Registration successful! Please log in.');
    showForm('login');
}

function logout() {
    localStorage.clear();
    showAuthPage();
}

function showForm(formName) {
    document.getElementById('login-form').classList.toggle('hidden', formName !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', formName !== 'register');
}

// --- SETTINGS & WITHDRAWAL ---
function saveWithdrawalSettings() {
    const bank = document.getElementById('setting-bank').value;
    const accountName = document.getElementById('setting-account-name').value.trim();
    const accountNumber = document.getElementById('setting-account-number').value.trim();
    if (!bank || !accountName || !accountNumber) return displayMessage('settings-error', 'All fields are required.');
    localStorage.setItem('withdrawalSettings', JSON.stringify({ bank, accountName, accountNumber }));
    displayMessage('settings-success', 'Withdrawal settings saved successfully!');
}

function loadWithdrawalSettings() {
    const settings = JSON.parse(localStorage.getItem('withdrawalSettings'));
    if (settings) {
        document.getElementById('setting-bank').value = settings.bank;
        document.getElementById('setting-account-name').value = settings.accountName;
        document.getElementById('setting-account-number').value = settings.accountNumber;
    }
}

function loadWithdrawalInfo() {
    const container = document.getElementById('withdrawal-info');
    const settings = JSON.parse(localStorage.getItem('withdrawalSettings'));
    if (settings) {
        container.innerHTML = `<h4>Your Saved Withdrawal Method</h4><p><strong>Bank:</strong> ${settings.bank}</p><p><strong>Account:</strong> ${settings.accountNumber}</p><hr style="border-color: var(--border-color); margin: 20px 0;"><div class="input-group"><input type="number" placeholder="Amount to Withdraw (ETB)"><i class="fa-solid fa-money-bill-wave"></i></div><button class="auth-button" onclick="alert('Withdrawal request submitted!')">Submit Request</button>`;
    } else {
        container.innerHTML = `<div class="no-settings"><h4>No Withdrawal Method Set</h4><p>Please go to <b>Settings</b> to add your bank account.</p><button class="auth-button" onclick="showPage('settings', document.querySelector('.nav-link[onclick*=\\'settings\\']'))">Go to Settings</button></div>`;
    }
}

// --- UI HELPERS ---
function displayMessage(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    const isSuccess = el.classList.contains('success-message');
    document.getElementById(isSuccess ? 'settings-error' : 'settings-success').classList.remove('show');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4000);
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-date-time').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function updateGreeting() {
    const hour = new Date().getHours();
    const userName = localStorage.getItem('userName') || 'User';
    let greeting = 'Good Morning';
    if (hour >= 12) greeting = 'Good Afternoon';
    if (hour >= 18) greeting = 'Good Evening';
    document.getElementById('greeting').textContent = `${greeting}, ${userName.split(' ')[0]}!`;
}

function copyToClipboard(elementId, button) {
    navigator.clipboard.writeText(document.getElementById(elementId).innerText).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = 'Copied!';
        button.disabled = true;
        setTimeout(() => { button.innerHTML = originalHTML; button.disabled = false; }, 1500);
    });
}

function showInvestModal(planName, amount) {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.innerHTML = `<div class="modal-content"><h3>Confirm Investment</h3><p>Invest <b>${amount} ETB</b> in the <b>${planName}</b> plan?</p><div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;"><button class="auth-button" style="background:var(--bg-lighter)" onclick="closeModal()">Cancel</button><button class="auth-button" onclick="alert('Investment Successful!'); closeModal();">Confirm</button></div></div>`;
    modalOverlay.classList.remove('hidden');
}

function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }

// --- TRANSACTIONS & CHART ---
function renderTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = ''; // Clear existing
    if (transactions.length === 0) {
        tbody.innerHTML = `<tr class="no-transactions-row"><td colspan="4">No transactions yet.</td></tr>`;
    } else {
        // Loop through transactions and append rows (omitted for brevity)
    }
}

function renderBalanceChart() {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    if(window.myBalanceChart) window.myBalanceChart.destroy();
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(138, 43, 226, 0.5)');
    gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
    window.myBalanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{ label: 'Balance', data: [0, 0, 0, 0, 0, 0, 0], backgroundColor: gradient, borderColor: '#8a2be2', borderWidth: 2, fill: true, tension: 0.4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#a0a0b8' }, grid: { color: 'rgba(74, 74, 104, 0.5)' } }, x: { ticks: { color: '#a0a0b8' }, grid: { display: false } } } }
    });
}


