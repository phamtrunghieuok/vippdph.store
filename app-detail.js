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
  return { android: 'Android', ios: 'iOS', windows: 'Windows', all: 'All' }[p] || p || '';
}

function downloadApp(fileUrl) {
  if (!fileUrl) { toast('Chưa có link tải về.', 'error'); return; }
  window.open(fileUrl, '_blank');
}

// ── Render ─────────────────────────────────────
function render(app) {
  document.title = `${app.name} — vippdph.store`;

  const iconHtml = app.logoUrl
    ? `<img class="detail-icon" src="${app.logoUrl}" alt="${app.name}" />`
    : `<div class="detail-icon-placeholder">📦</div>`;

  const screenshotsHtml = (app.screenshots && app.screenshots.length)
    ? `<div class="screenshots-wrap">
        ${app.screenshots.map(url =>
          `<img class="screenshot-img" src="${url}" alt="screenshot" loading="lazy" />`
        ).join('')}
       </div>`
    : `<p style="color:var(--dim);font-size:13px">Không có ảnh demo.</p>`;

  const adminMsgHtml = app.adminMessage
    ? `<div class="detail-panel" style="margin-top:0">
        <span class="panel-label">Lời từ admin</span>
        <p class="admin-msg">${app.adminMessage}</p>
       </div>`
    : '';

  document.getElementById('content').innerHTML = `
    <button class="back-btn" onclick="history.back()">← Quay lại</button>

    <div class="detail-hero">
      ${iconHtml}
      <div class="detail-info">
        <div class="detail-name">${app.name}</div>
        <div class="detail-tags">
          ${app.version ? `<span class="tag">v${app.version}</span>` : ''}
          ${app.platform ? `<span class="tag">${platformLabel(app.platform)}</span>` : ''}
          ${app.fileSize ? `<span class="tag">${app.fileSize}</span>` : ''}
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${app.fileUrl
            ? `<button class="btn btn-primary" onclick="downloadApp('${app.fileUrl}','${app.name}')">Download</button>`
            : `<button class="btn btn-outline" disabled>Chưa có file</button>`
          }
        </div>
      </div>
    </div>

    <div class="detail-body">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="detail-panel">
          <span class="panel-label">Mô tả</span>
          <p class="panel-text">${app.description || 'Chưa có mô tả.'}</p>
        </div>
        ${adminMsgHtml}
      </div>
      <div class="detail-panel">
        <span class="panel-label">Ảnh demo</span>
        ${screenshotsHtml}
      </div>
    </div>
  `;
}

// ── Fetch & init ───────────────────────────────
async function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('content').innerHTML =
      `<div class="state-box">Không tìm thấy app. <a href="/" style="color:var(--muted);text-decoration:underline">← Về trang chủ</a></div>`;
    return;
  }

  try {
    const res = await fetch('/apps.json?v=' + Date.now());
    if (!res.ok) throw new Error('Lỗi tải file');
    const apps = await res.json();
    const app = apps.find(a => a.id === id);
    if (!app) throw new Error('Không tìm thấy app');
    render(app);
  } catch (e) {
    document.getElementById('content').innerHTML =
      `<div class="state-box">Không tìm thấy app. <a href="/" style="color:var(--muted);text-decoration:underline">← Về trang chủ</a></div>`;
  }
}

init();
