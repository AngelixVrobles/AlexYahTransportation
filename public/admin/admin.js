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
// CITIES MANAGEMENT
// ================================================

let citiesData = {}; // { StateName: ['City1', 'City2', ...] }

async function loadCities() {
    try {
        const res = await fetch('/api/cities');
        if (!res.ok) throw new Error('Failed to load cities');
        citiesData = await res.json();
        renderCities();
    } catch (err) {
        document.getElementById('citiesManager').innerHTML =
            `<p style="color:#dc3545;"><i class="fas fa-exclamation-circle"></i> Error loading cities: ${err.message}</p>`;
    }
}

function renderCities() {
    const container = document.getElementById('citiesManager');
    container.innerHTML = '';

    const states = Object.keys(citiesData).sort();
    if (states.length === 0) {
        container.innerHTML = '<p class="loading-text">No states found. Add one above.</p>';
        return;
    }

    states.forEach(state => {
        const block = createStateBlock(state, citiesData[state]);
        container.appendChild(block);
    });
}

function createStateBlock(state, cities) {
    const block = document.createElement('div');
    block.className = 'state-block';
    block.dataset.state = state;

    // Header
    const header = document.createElement('div');
    header.className = 'state-header';
    header.innerHTML = `
        <div class="state-name-display">
            <i class="fas fa-map-marker-alt"></i>
            <span class="state-label">${escapeHtmlUI(state)}</span>
            <span class="state-badge">${cities.length} cities</span>
        </div>
        <div class="state-actions">
            <button class="btn-icon btn-icon-edit" title="Rename state" data-action="rename-state">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-icon-delete" title="Delete state" data-action="delete-state">
                <i class="fas fa-trash"></i>
            </button>
        </div>`;
    header.querySelector('[data-action="rename-state"]').addEventListener('click', () => startRenameState(block, state));
    header.querySelector('[data-action="delete-state"]').addEventListener('click', () => confirmDeleteState(state));
    block.appendChild(header);

    // Cities list
    const listDiv = document.createElement('div');
    listDiv.className = 'cities-list';
    cities.forEach((city, idx) => {
        listDiv.appendChild(createCityItem(state, city, idx));
    });
    block.appendChild(listDiv);

    // Add city row
    const addRow = document.createElement('div');
    addRow.className = 'add-city-row';
    addRow.innerHTML = `
        <input type="text" placeholder="New city name..." class="new-city-input">
        <button class="btn-icon btn-icon-add" title="Add city"><i class="fas fa-plus"></i></button>`;
    addRow.querySelector('.btn-icon-add').addEventListener('click', () => {
        addCity(state, addRow.querySelector('.new-city-input'));
    });
    addRow.querySelector('.new-city-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addCity(state, addRow.querySelector('.new-city-input'));
    });
    block.appendChild(addRow);

    return block;
}

function createCityItem(state, city, idx) {
    const item = document.createElement('div');
    item.className = 'city-item';
    item.dataset.city = city;

    item.innerHTML = `
        <span class="city-item-name">${escapeHtmlUI(city)}</span>
        <div class="city-actions">
            <button class="btn-icon btn-icon-edit" title="Edit city"><i class="fas fa-edit"></i></button>
            <button class="btn-icon btn-icon-delete" title="Delete city"><i class="fas fa-trash"></i></button>
        </div>`;

    item.querySelector('.btn-icon-edit').addEventListener('click', () => startEditCity(item, state, city));
    item.querySelector('.btn-icon-delete').addEventListener('click', () => confirmDeleteCity(state, city));

    return item;
}

function startEditCity(item, state, oldCity) {
    const nameSpan = item.querySelector('.city-item-name');
    const originalText = oldCity;
    nameSpan.innerHTML = `<input type="text" value="${escapeHtmlUI(oldCity)}" style="width:180px;padding:4px 9px;border:1.5px solid #0d6efd;border-radius:6px;font-size:.87rem;">`;
    const input = nameSpan.querySelector('input');
    input.focus();
    input.select();

    function save() {
        const newCity = input.value.trim();
        if (!newCity) { item.dataset.city = originalText; renderCities(); return; }
        const cities = citiesData[state];
        const idx = cities.indexOf(oldCity);
        if (idx !== -1) cities[idx] = newCity;
        renderCities();
    }
    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); save(); }
        if (e.key === 'Escape') { renderCities(); }
    });
}

function addCity(state, input) {
    const city = input.value.trim();
    if (!city) return;
    if (!citiesData[state]) citiesData[state] = [];
    if (citiesData[state].includes(city)) { showToast('City already exists.', true); return; }
    citiesData[state].push(city);
    citiesData[state].sort();
    renderCities();
    showToast(`"${city}" added to ${state}.`);
}

function startRenameState(block, oldState) {
    const header = block.querySelector('.state-header');
    const nameDisplay = header.querySelector('.state-name-display');
    const leftHtml = nameDisplay.innerHTML;

    nameDisplay.innerHTML = `
        <div class="state-name-edit-wrap">
            <i class="fas fa-map-marker-alt" style="color:#0d6efd;"></i>
            <input type="text" value="${escapeHtmlUI(oldState)}" style="width:180px;padding:6px 10px;border:1.5px solid #0d6efd;border-radius:7px;font-size:.9rem;">
            <button class="btn-icon btn-icon-edit" title="Confirm rename" style="color:#198754;"><i class="fas fa-check"></i></button>
            <button class="btn-icon" title="Cancel" style="color:#6b7280;"><i class="fas fa-times"></i></button>
        </div>`;

    const input = nameDisplay.querySelector('input');
    input.focus(); input.select();

    function doRename() {
        const newState = input.value.trim();
        if (!newState || newState === oldState) { renderCities(); return; }
        if (citiesData[newState]) { showToast('State already exists.', true); return; }
        citiesData[newState] = citiesData[oldState];
        delete citiesData[oldState];
        renderCities();
    }
    nameDisplay.querySelectorAll('.btn-icon')[0].addEventListener('click', doRename);
    nameDisplay.querySelectorAll('.btn-icon')[1].addEventListener('click', () => renderCities());
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') renderCities(); });
}

// Confirm delete: state
function confirmDeleteState(state) {
    showConfirmModal(
        'Delete State',
        `Are you sure you want to delete <strong>${escapeHtmlUI(state)}</strong> and all its cities? This cannot be undone.`,
        () => {
            delete citiesData[state];
            renderCities();
            showToast(`State "${state}" deleted.`);
        }
    );
}

// Confirm delete: city
function confirmDeleteCity(state, city) {
    showConfirmModal(
        'Delete City',
        `Are you sure you want to delete <strong>${escapeHtmlUI(city)}</strong> from ${escapeHtmlUI(state)}?`,
        () => {
            citiesData[state] = citiesData[state].filter(c => c !== city);
            renderCities();
            showToast(`City "${city}" deleted.`);
        }
    );
}

// Save cities
document.getElementById('saveCitiesBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveCitiesBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
        const res = await fetch('/api/admin/cities', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(citiesData)
        });
        if (handleAuthError(res)) return;
        const data = await res.json();
        if (data.success) {
            showToast('Cities saved successfully!');
        } else {
            showToast(data.error || 'Failed to save cities.', true);
        }
    } catch (err) {
        showToast('Connection error. Please try again.', true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save All Changes';
    }
});

// Add State button
document.getElementById('addStateBtn').addEventListener('click', () => {
    const modal = document.getElementById('addStateModal');
    modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
    if (modal.style.display === 'block') document.getElementById('newStateName').focus();
});
document.getElementById('cancelAddState').addEventListener('click', () => {
    document.getElementById('addStateModal').style.display = 'none';
    document.getElementById('newStateName').value = '';
});
document.getElementById('confirmAddState').addEventListener('click', () => {
    const name = document.getElementById('newStateName').value.trim();
    if (!name) { showToast('Enter a state name.', true); return; }
    if (citiesData[name]) { showToast('State already exists.', true); return; }
    citiesData[name] = [];
    renderCities();
    document.getElementById('addStateModal').style.display = 'none';
    document.getElementById('newStateName').value = '';
    showToast(`State "${name}" added.`);
});
document.getElementById('newStateName').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('confirmAddState').click();
    if (e.key === 'Escape') document.getElementById('cancelAddState').click();
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
