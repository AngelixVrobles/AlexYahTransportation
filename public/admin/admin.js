// ================================================
// ADMIN DASHBOARD – AlexYah Transportation
// ================================================

const TOKEN_KEY = 'adminToken';

// ---- Auth Guard ----
const token = sessionStorage.getItem(TOKEN_KEY);
if (!token) {
    window.location.href = 'login.html';
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem(TOKEN_KEY)}`
    };
}

function handleAuthError(res) {
    if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem(TOKEN_KEY);
        window.location.href = 'login.html';
        return true;
    }
    return false;
}

// ---- Toast ----
let toastTimer;
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast-msg' + (isError ? ' error' : '');
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ---- Sidebar navigation ----
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
const sections = document.querySelectorAll('.dash-section');
const dashTitle = document.getElementById('dashTitle');

const sectionTitles = {
    stats: 'Statistics',
    cities: 'Cities &amp; States',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use'
};

sidebarLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const sec = this.dataset.section;

        sidebarLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        sections.forEach(s => s.classList.remove('active'));
        document.getElementById('section-' + sec).classList.add('active');

        dashTitle.innerHTML = sectionTitles[sec] || sec;

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

// Mobile sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem(TOKEN_KEY);
    window.location.href = 'login.html';
});

// ================================================
// CITIES MANAGEMENT  –  dark card + tabs
// ================================================

let citiesData = {};       // { StateName: ['City1', ...] }
let activeStateTab = null; // currently selected state name

async function loadCities() {
    try {
        const res = await fetch('/api/cities');
        if (!res.ok) throw new Error('Failed to load cities');
        citiesData = await res.json();
        renderCities();
    } catch (err) {
        document.getElementById('cmTabs').innerHTML =
            `<span style="color:#f87171;font-size:.85rem;"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</span>`;
    }
}

function renderCities() {
    const states = Object.keys(citiesData).sort();
    renderTabs(states);
    renderPanels(states);
}

/* ---- TABS ---- */
function renderTabs(states) {
    const tabsEl = document.getElementById('cmTabs');
    tabsEl.innerHTML = '';

    if (states.length === 0) {
        tabsEl.innerHTML = `<span style="color:rgba(255,255,255,.28);font-size:.82rem;font-weight:500;">No states yet — add one above.</span>`;
        activeStateTab = null;
        return;
    }

    // Preserve active tab if still valid
    if (!activeStateTab || !states.includes(activeStateTab)) {
        activeStateTab = states[0];
    }

    states.forEach(state => {
        const tab = document.createElement('button');
        tab.className = 'cm-tab' + (state === activeStateTab ? ' active' : '');
        tab.dataset.state = state;
        tab.innerHTML = `
            ${escapeHtmlUI(state)}
            <span class="cm-tab-count">${citiesData[state].length}</span>
            <button class="cm-tab-del" data-del="${escapeHtmlUI(state)}" title="Delete state"><i class="fas fa-times"></i></button>`;

        // Select tab
        tab.addEventListener('click', (e) => {
            if (e.target.closest('.cm-tab-del')) return;
            activeStateTab = state;
            renderCities();
        });

        // Delete state via × button
        tab.querySelector('.cm-tab-del').addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDeleteState(state);
        });

        tabsEl.appendChild(tab);
    });
}

/* ---- PANELS ---- */
function renderPanels(states) {
    const panelsEl = document.getElementById('cmPanels');
    panelsEl.innerHTML = '';

    if (states.length === 0) return;

    states.forEach(state => {
        const panel = buildPanel(state, citiesData[state]);
        panelsEl.appendChild(panel);
    });
}

function buildPanel(state, cities) {
    const panel = document.createElement('div');
    panel.className = 'cm-panel' + (state === activeStateTab ? ' active' : '');
    panel.dataset.state = state;

    // Panel header
    const header = document.createElement('div');
    header.className = 'cm-panel-header';
    header.innerHTML = `
        <span class="cm-panel-title">Cities in ${escapeHtmlUI(state)}</span>
        <span class="cm-panel-count">${cities.length} cities</span>`;
    panel.appendChild(header);

    // Add city row
    const addRow = document.createElement('div');
    addRow.className = 'cm-add-city-row';
    addRow.innerHTML = `
        <input type="text" placeholder="New city name…" class="cm-new-city-input">
        <button class="btn-primary cm-add-city-btn"><i class="fas fa-plus"></i> Add</button>`;
    const cityInput = addRow.querySelector('.cm-new-city-input');
    addRow.querySelector('.cm-add-city-btn').addEventListener('click', () => addCity(state, cityInput));
    cityInput.addEventListener('keydown', e => { if (e.key === 'Enter') addCity(state, cityInput); });
    panel.appendChild(addRow);

    // City list
    const list = document.createElement('div');
    list.className = 'cm-city-list';

    if (cities.length === 0) {
        list.innerHTML = `<div class="cm-empty"><i class="fas fa-city"></i>No cities yet. Add one above.</div>`;
    } else {
        cities.forEach(city => list.appendChild(buildCityItem(state, city)));
    }
    panel.appendChild(list);

    return panel;
}

function buildCityItem(state, city) {
    const item = document.createElement('div');
    item.className = 'cm-city-item';
    item.dataset.city = city;
    item.innerHTML = `
        <span class="cm-city-name">${escapeHtmlUI(city)}</span>
        <div class="cm-city-actions">
            <button class="btn-icon-dark" title="Edit city"><i class="fas fa-pen"></i></button>
            <button class="btn-icon-dark del" title="Delete city"><i class="fas fa-trash"></i></button>
        </div>`;
    const [editBtn, delBtn] = item.querySelectorAll('.btn-icon-dark');
    editBtn.addEventListener('click', () => startEditCity(item, state, city));
    delBtn.addEventListener('click', () => confirmDeleteCity(state, city));
    return item;
}

function startEditCity(item, state, oldCity) {
    const nameEl = item.querySelector('.cm-city-name');
    nameEl.innerHTML = `<input type="text" value="${escapeHtmlUI(oldCity)}">`;
    const input = nameEl.querySelector('input');
    input.focus(); input.select();

    function save() {
        const newCity = input.value.trim();
        if (!newCity) { renderCities(); return; }
        const idx = citiesData[state].indexOf(oldCity);
        if (idx !== -1) citiesData[state][idx] = newCity;
        citiesData[state].sort((a, b) => a.localeCompare(b));
        renderCities();
        autoSaveCities();
    }
    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); save(); }
        if (e.key === 'Escape') renderCities();
    });
}

// Auto-save cities to backend
async function autoSaveCities() {
    try {
        const res = await fetch('/api/admin/cities', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(citiesData)
        });
        if (handleAuthError(res)) return;
        const data = await res.json();
        if (!data.success) {
            showToast(data.error || 'Auto-save failed.', true);
        }
    } catch (err) {
        showToast('Auto-save failed. Check connection.', true);
    }
}

function addCity(state, input) {
    const city = input.value.trim();
    if (!city) return;
    if (!citiesData[state]) citiesData[state] = [];
    if (citiesData[state].includes(city)) { showToast('City already exists.', true); return; }
    citiesData[state].push(city);
    citiesData[state].sort((a, b) => a.localeCompare(b));
    input.value = '';
    renderCities();
    showToast(`"${city}" added to ${state}.`);
    autoSaveCities();
}

function confirmDeleteState(state) {
    showConfirmModal(
        'Delete State',
        `Are you sure you want to delete <strong>${escapeHtmlUI(state)}</strong> and all its cities? This cannot be undone.`,
        () => {
            if (activeStateTab === state) activeStateTab = null;
            delete citiesData[state];
            renderCities();
            showToast(`State "${state}" deleted.`);
            autoSaveCities();
        }
    );
}

function confirmDeleteCity(state, city) {
    showConfirmModal(
        'Delete City',
        `Are you sure you want to delete <strong>${escapeHtmlUI(city)}</strong> from ${escapeHtmlUI(state)}?`,
        () => {
            citiesData[state] = citiesData[state].filter(c => c !== city);
            renderCities();
            showToast(`City "${city}" deleted.`);
            autoSaveCities();
        }
    );
}

// Cities are now auto-saved on every add/edit/delete action

// Add State
document.getElementById('confirmAddState').addEventListener('click', () => {
    const name = document.getElementById('newStateName').value.trim();
    if (!name) { showToast('Enter a state name.', true); return; }
    if (citiesData[name]) { showToast('State already exists.', true); return; }
    citiesData[name] = [];
    activeStateTab = name;
    renderCities();
    document.getElementById('newStateName').value = '';
    showToast(`State "${name}" added.`);
    autoSaveCities();
});
document.getElementById('newStateName').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('confirmAddState').click();
});

// ================================================
// CONFIRM MODAL
// ================================================
let confirmOkCallback = null;

function showConfirmModal(title, msg, onOk) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMsg').innerHTML = msg;
    confirmOkCallback = onOk;
    document.getElementById('confirmModal').style.display = 'flex';
}
document.getElementById('confirmCancel').addEventListener('click', () => {
    document.getElementById('confirmModal').style.display = 'none';
    confirmOkCallback = null;
});
document.getElementById('confirmOk').addEventListener('click', () => {
    document.getElementById('confirmModal').style.display = 'none';
    if (confirmOkCallback) confirmOkCallback();
    confirmOkCallback = null;
});

// ================================================
// EDITOR TOOLBAR HELPERS
// ================================================
function insertTag(editorId, tag) {
    const ta = document.getElementById(editorId);
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end) || 'texto aquí';
    const insertion = `<${tag}>${selected}</${tag}>`;
    ta.value = ta.value.substring(0, start) + insertion + ta.value.substring(end);
    ta.focus();
    ta.selectionStart = start + tag.length + 2;
    ta.selectionEnd = start + tag.length + 2 + selected.length;
    updateCharCount(editorId, editorId === 'privacyEditor' ? 'privacyCount' : 'termsCount');
}

function insertListTag(editorId) {
    const ta = document.getElementById(editorId);
    const start = ta.selectionStart;
    const insertion = `\n<ul>\n  <li>Elemento 1</li>\n  <li>Elemento 2</li>\n</ul>\n`;
    ta.value = ta.value.substring(0, start) + insertion + ta.value.substring(start);
    ta.focus();
    updateCharCount(editorId, editorId === 'privacyEditor' ? 'privacyCount' : 'termsCount');
}

function insertLinkTag(editorId) {
    const ta = document.getElementById(editorId);
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end) || 'texto del enlace';
    const insertion = `<a href="https://example.com">${selected}</a>`;
    ta.value = ta.value.substring(0, start) + insertion + ta.value.substring(end);
    ta.focus();
    updateCharCount(editorId, editorId === 'privacyEditor' ? 'privacyCount' : 'termsCount');
}

function updateCharCount(editorId, countId) {
    const ta = document.getElementById(editorId);
    const countEl = document.getElementById(countId);
    if (ta && countEl) {
        const len = ta.value.length;
        countEl.textContent = `${len.toLocaleString()} caracter${len !== 1 ? 'es' : ''}`;
    }
}

// ================================================
// POLICY EDITORS
// ================================================
let policyData = { privacy: '', terms: '' };

async function loadPolicy() {
    try {
        const res = await fetch('/api/policy');
        if (!res.ok) throw new Error('Failed to load policy');
        policyData = await res.json();
        document.getElementById('privacyEditor').value = policyData.privacy || '';
        document.getElementById('termsEditor').value = policyData.terms || '';
        updateCharCount('privacyEditor', 'privacyCount');
        updateCharCount('termsEditor', 'termsCount');
    } catch (err) {
        showToast('Error loading policy: ' + err.message, true);
    }
}

// Preview toggle – Privacy
document.getElementById('previewPrivacyBtn').addEventListener('click', function () {
    const preview = document.getElementById('privacyPreview');
    const editor = document.getElementById('privacyEditor');
    if (preview.style.display === 'none') {
        preview.innerHTML = editor.value;
        preview.style.display = 'block';
        this.innerHTML = '<i class="fas fa-edit"></i> Edit';
    } else {
        preview.style.display = 'none';
        this.innerHTML = '<i class="fas fa-eye"></i> Preview';
    }
});

// Preview toggle – Terms
document.getElementById('previewTermsBtn').addEventListener('click', function () {
    const preview = document.getElementById('termsPreview');
    const editor = document.getElementById('termsEditor');
    if (preview.style.display === 'none') {
        preview.innerHTML = editor.value;
        preview.style.display = 'block';
        this.innerHTML = '<i class="fas fa-edit"></i> Edit';
    } else {
        preview.style.display = 'none';
        this.innerHTML = '<i class="fas fa-eye"></i> Preview';
    }
});

async function savePolicy(type) {
    const privacyContent = document.getElementById('privacyEditor').value;
    const termsContent = document.getElementById('termsEditor').value;
    const btnId = type === 'privacy' ? 'savePrivacyBtn' : 'saveTermsBtn';
    const btn = document.getElementById(btnId);

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const res = await fetch('/api/admin/policy', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                privacy: privacyContent,
                terms: termsContent
            })
        });
        if (handleAuthError(res)) return;
        const data = await res.json();
        if (data.success) {
            showToast(`${type === 'privacy' ? 'Privacy Policy' : 'Terms of Use'} saved!`);
        } else {
            showToast(data.error || 'Failed to save.', true);
        }
    } catch (err) {
        showToast('Connection error. Please try again.', true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-save"></i> Save ${type === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}`;
    }
}

document.getElementById('savePrivacyBtn').addEventListener('click', () => savePolicy('privacy'));
document.getElementById('saveTermsBtn').addEventListener('click', () => savePolicy('terms'));

// ================================================
// STATISTICS
// ================================================
function animateCount(el, target) {
    let start = 0;
    const duration = 900;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
        start = Math.min(start + step, target);
        el.textContent = start.toLocaleString();
        if (start >= target) clearInterval(timer);
    }, 16);
}

async function loadStats() {
    try {
        const res = await fetch('/api/admin/stats', { headers: authHeaders() });
        if (handleAuthError(res)) return;
        const data = await res.json();
        if (data.success) {
            animateCount(document.getElementById('statVisits'), data.stats.pageVisits || 0);
            animateCount(document.getElementById('statEmails'), data.stats.emailsSent || 0);
            animateCount(document.getElementById('statDrivers'), data.stats.driverApplications || 0);
        }
    } catch (err) {
        showToast('Could not load stats.', true);
    }
}

document.getElementById('refreshStatsBtn').addEventListener('click', () => {
    document.getElementById('statVisits').textContent = '–';
    document.getElementById('statEmails').textContent = '–';
    document.getElementById('statDrivers').textContent = '–';
    loadStats();
    showToast('Stats refreshed.');
});

// ================================================
// UTILITIES
// ================================================
function escapeHtmlUI(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ================================================
// INIT
// ================================================
loadCities();
loadPolicy();
loadStats();