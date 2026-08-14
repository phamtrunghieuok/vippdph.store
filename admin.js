// ── State ───────────────────────────────────────
let apps = [];
let editingId = null;
let logoUrl = null;
let fileUrl = null;
let screenshotUrls = [null, null, null, null, null];
let uploading = false;

// ── Toast ───────────────────────────────────────
function toast(msg, type = '') {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function setLoading(btn, loading, text = 'Publish App') {
  btn.disabled = loading;
  btn.textContent = loading ? 'Đang xử lý...' : text;
}

// ── Screenshot slots ────────────────────────────
function renderSlots() {
  const row = document.getElementById('screenshot-slots');
  row.innerHTML = screenshotUrls.map((url, i) => `
    <div class="screenshot-slot" id="slot-${i}">
      <input type="file" accept="image/*" onchange="handleScreenshot(this, ${i})" />
      ${url
        ? `<img src="${url}" alt="ss${i}" /><button class="slot-remove" onclick="removeScreenshot(event,${i})">✕</button>`
        : `<span>＋</span>`
      }
    </div>
  `).join('');
}

function removeScreenshot(e, i) {
  e.stopPropagation();
  screenshotUrls[i] = null;
  renderSlots();
}

// ── File handlers ───────────────────────────────
function handleLogoSelect(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('logo-preview').textContent = '⏳ ' + file.name;
  uploadFile(file, 'logo').then(url => {
    logoUrl = url;
    document.getElementById('logo-preview').textContent = '✅ ' + file.name;
  }).catch(() => {
    document.getElementById('logo-preview').textContent = '❌ Upload thất bại';
  });
}

function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('file-preview').textContent = '⏳ ' + file.name;
  uploadFile(file, 'file').then(url => {
    fileUrl = url;
    document.getElementById('file-preview').textContent = '✅ ' + file.name;
  }).catch(() => {
    document.getElementById('file-preview').textContent = '❌ Upload thất bại';
  });
}

async function handleScreenshot(input, index) {
  const file = input.files[0];
  if (!file) return;
  const slot = document.getElementById(`slot-${index}`);
  slot.style.opacity = '0.5';
  try {
    const url = await uploadFile(file, 'screenshot');
    screenshotUrls[index] = url;
    renderSlots();
  } catch {
    toast('Upload ảnh thất bại', 'error');
    slot.style.opacity = '1';
  }
}

// ── Upload to R2 via Worker ─────────────────────
async function uploadFile(file, type) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

// ── Form open/close ─────────────────────────────
function openForm(app) {
  editingId = app ? app.id : null;
  logoUrl = app ? app.logoUrl : null;
  fileUrl = app ? app.fileUrl : null;
  screenshotUrls = app && app.screenshots
    ? [...app.screenshots, ...Array(5)].slice(0, 5)
    : [null, null, null, null, null];

  document.getElementById('form-title').textContent = app ? 'Chỉnh sửa app' : 'Thêm app mới';
  document.getElementById('f-name').value     = app ? app.name        : '';
  document.getElementById('f-version').value  = app ? app.version     : '';
  document.getElementById('f-platform').value = app ? app.platform    : 'android';
  document.getElementById('f-size').value     = app ? app.fileSize    : '';
  document.getElementById('f-desc').value     = app ? app.description : '';
  document.getElementById('f-msg').value      = app ? app.adminMessage: '';
  document.getElementById('f-file-url').value = app ? (app.fileUrl || '') : '';
  document.getElementById('logo-preview').textContent = app && app.logoUrl ? '✅ Logo đã có' : '';

  renderSlots();
  document.getElementById('form-area').style.display = 'block';
  document.getElementById('form-area').scrollIntoView({ behavior: 'smooth' });
}

function cancelForm() {
  editingId = null;
  logoUrl = null; fileUrl = null;
  screenshotUrls = [null,null,null,null,null];
  document.getElementById('form-area').style.display = 'none';
}

// ── Save & Download JSON ────────────────────────
function downloadUpdatedJson() {
  const blob = new Blob([JSON.stringify(apps, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'apps.json';
  a.click();
  toast('Đã tải file apps.json mới! Hãy thay thế vào thư mục public trên GitHub.', 'success');
}

// ── Submit ──────────────────────────────────────
async function submitApp() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { toast('Nhập tên app nhé!', 'error'); return; }

  const btn = document.getElementById('submit-btn');
  setLoading(btn, true);

  const payload = {
    id: editingId || ('app-' + Date.now()),
    name,
    version:      document.getElementById('f-version').value.trim(),
    platform:     document.getElementById('f-platform').value,
    fileSize:     document.getElementById('f-size').value.trim(),
    description:  document.getElementById('f-desc').value.trim(),
    adminMessage: document.getElementById('f-msg').value.trim(),
    logoUrl:      logoUrl || '',
    fileUrl:      document.getElementById('f-file-url').value.trim(),
    screenshots:  screenshotUrls.filter(Boolean),
  };

  if (editingId) {
    const idx = apps.findIndex(a => a.id === editingId);
    if (idx !== -1) apps[idx] = payload;
  } else {
    apps.unshift(payload);
  }

  cancelForm();
  loadApps();
  setLoading(btn, false);
  downloadUpdatedJson();
}

// ── Delete ──────────────────────────────────────
async function deleteApp(id, name) {
  if (!confirm(`Xóa "${name}" không?`)) return;
  apps = apps.filter(a => a.id !== id);
  loadApps();
  downloadUpdatedJson();
}

// ── Load app list ───────────────────────────────
function platformLabel(p) {
  return { android: 'Android', ios: 'iOS', windows: 'Windows', all: 'All' }[p] || p || '';
}

async function loadApps() {
  const list = document.getElementById('admin-list');
  list.innerHTML = '<div class="admin-empty">Đang tải...</div>';
  try {
    const res = await fetch('/apps.json?v=' + Date.now());
    apps = await res.json();
    if (!apps.length) {
      list.innerHTML = '<div class="admin-empty">Chưa có app nào.</div>';
      return;
    }
    list.innerHTML = apps.map(app => `
      <div class="admin-list-item">
        ${app.logoUrl
          ? `<img class="admin-list-icon" src="${app.logoUrl}" alt="${app.name}" />`
          : `<div class="admin-list-icon" style="display:flex;align-items:center;justify-content:center;font-size:18px">📦</div>`
        }
        <div>
          <div class="admin-list-name">${app.name}</div>
          <div class="admin-list-meta">${app.version ? 'v' + app.version : ''} ${app.platform ? '· ' + platformLabel(app.platform) : ''}</div>
        </div>
        <div class="admin-list-actions">
          <button class="btn btn-outline btn-sm" onclick='openForm(${JSON.stringify(app)})'>Sửa</button>
          <button class="btn btn-danger btn-sm" onclick="deleteApp('${app.id}','${app.name}')">Xóa</button>
        </div>
      </div>
    `).join('');
  } catch {
    list.innerHTML = '<div class="admin-empty">Không tải được danh sách.</div>';
  }
}

// ── Init ────────────────────────────────────────
loadApps();
