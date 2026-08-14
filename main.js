// ── Helpers ────────────────────────────────────
function toast(msg, type = '') {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function platformLabel(p) {
  return { android: 'Android', ios: 'iOS', windows: 'Windows', all: 'All' }[p] || p;
}

function iconEl(app) {
  if (app.logoUrl) {
    return `<img class="app-icon" src="${app.logoUrl}" alt="${app.name}" loading="lazy" onerror="this.replaceWith(placeholderIcon())" />`;
  }
  return `<div class="app-icon-placeholder">📦</div>`;
}

// ── Render grid ────────────────────────────────
function renderGrid(apps) {
  const grid = document.getElementById('app-grid');

  if (!apps || apps.length === 0) {
    grid.innerHTML = '';
    grid.insertAdjacentHTML('afterend', `<div class="state-box">Chưa có app nào được đăng.</div>`);
    document.getElementById('sub-text').textContent = '0 ứng dụng';
    return;
  }

  document.getElementById('sub-text').textContent = `${apps.length} ứng dụng`;
  document.getElementById('app-count').textContent = apps.length + ' apps';

  grid.innerHTML = apps.map(app => `
    <div class="app-card">
      <div class="card-top">
        ${iconEl(app)}
        <div class="card-meta">
          <div class="card-name" title="${app.name}">${app.name}</div>
          <div class="card-tags">
            ${app.version ? `<span class="tag">v${app.version}</span>` : ''}
            ${app.platform ? `<span class="tag">${platformLabel(app.platform)}</span>` : ''}
          </div>
        </div>
      </div>
      ${app.description ? `<div class="card-desc">${app.description}</div>` : ''}
      <div class="card-actions">
        <button class="btn btn-get" onclick="downloadApp('${app.id}', '${app.fileUrl || ''}')">Get</button>
        <button class="btn btn-info" onclick="openInfo('${app.id}')">Info</button>
      </div>
    </div>
  `).join('');
}

// ── Actions ────────────────────────────────────
function downloadApp(id, fileUrl) {
  if (!fileUrl) { toast('Chưa có link tải về.', 'error'); return; }
  window.open(fileUrl, '_blank');
}

function openInfo(id) {
  window.location.href = `/app/?id=${id}`;
}

// ── Fetch & init ───────────────────────────────
async function init() {
  try {
    const res = await fetch('/apps.json?v=' + Date.now());
    if (!res.ok) throw new Error('Lỗi ' + res.status);
    const apps = await res.json();
    renderGrid(apps);
  } catch (e) {
    document.getElementById('app-grid').innerHTML =
      `<div class="state-box">Không thể tải danh sách app. Thử lại sau.</div>`;
    document.getElementById('sub-text').textContent = '';
    console.error(e);
  }
}

init();
