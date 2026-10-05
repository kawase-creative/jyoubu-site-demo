const API = '';
const state = { works: [], instagram: [], selectedImageKey: '', selectedImageUrl: '' };
const byId = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { credentials: 'same-origin', ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || '保存できませんでした。もう一度お試しください。');
  return body;
}

function text(tag, value, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value || '';
  return element;
}

function imageUrl(key) {
  return key ? `/media/${encodeURIComponent(key)}` : '';
}

function renderWorks() {
  const list = byId('works-list');
  list.replaceChildren();
  if (!state.works.length) {
    list.append(text('p', '施工事例はまだありません。「＋ 事例を追加」から登録してください。', 'empty'));
    return;
  }
  for (const work of state.works) {
    const row = document.createElement('article');
    row.className = 'entry';
    const image = document.createElement('img'); image.src = work.imageKey ? imageUrl(work.imageKey) : work.imageUrl ? new URL(work.imageUrl, 'https://kawase-creative.github.io/jyoubu-site-demo/').href : ''; image.alt = work.imageAlt || '';
    const details = document.createElement('div'); details.append(text('h3', work.title), text('p', work.description));
    const actions = document.createElement('div'); actions.className = 'entry-actions';
    const edit = text('button', '編集'); edit.type = 'button'; edit.addEventListener('click', () => openWorkEditor(work));
    const remove = text('button', '削除', 'delete'); remove.type = 'button';
    remove.addEventListener('click', async () => {
      if (!confirm(`「${work.title}」を削除しますか？`)) return;
      try { await api(`/api/admin/works/${encodeURIComponent(work.id)}`, { method: 'DELETE' }); await refresh(); }
      catch (error) { byId('global-status').textContent = error.message; }
    });
    actions.append(edit, remove); row.append(image, details, actions); list.append(row);
  }
}

function renderInstagram() {
  const list = byId('instagram-list');
  list.replaceChildren();
  if (!state.instagram.length) {
    list.append(text('p', 'Instagram投稿はまだ登録されていません。', 'empty'));
    return;
  }
  for (const post of state.instagram) {
    const row = document.createElement('article'); row.className = 'entry';
    const icon = document.createElement('img'); icon.src = 'https://kawase-creative.github.io/jyoubu-site-demo/assets/instagram-icon.png'; icon.alt = 'Instagram';
    const details = document.createElement('div'); details.append(text('h3', post.caption || 'Instagram投稿'));
    const link = document.createElement('a'); link.href = post.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = post.url;
    details.append(link);
    const actions = document.createElement('div'); actions.className = 'entry-actions';
    const remove = text('button', '削除', 'delete'); remove.type = 'button';
    remove.addEventListener('click', async () => {
      if (!confirm('このInstagram投稿を一覧から削除しますか？')) return;
      try { await api(`/api/admin/instagram/${encodeURIComponent(post.id)}`, { method: 'DELETE' }); await refresh(); }
      catch (error) { byId('global-status').textContent = error.message; }
    });
    actions.append(remove); row.append(icon, details, actions); list.append(row);
  }
}

async function refresh() {
  byId('global-status').textContent = '';
  try {
    const content = await api('/api/admin/content');
    state.works = content.works || [];
    state.instagram = content.instagram || [];
    renderWorks(); renderInstagram();
  } catch (error) {
    byId('global-status').textContent = error.message;
  }
}

function closeWorkEditor() {
  byId('work-editor').hidden = true;
  byId('work-form').reset();
  byId('image-preview').hidden = true;
  byId('image-preview').removeAttribute('src');
  state.selectedImageKey = '';
  state.selectedImageUrl = '';
}

function openWorkEditor(work = null) {
  const form = byId('work-form');
  form.reset();
  state.selectedImageKey = work?.imageKey || '';
  state.selectedImageUrl = work?.imageUrl || '';
  form.elements.id.value = work?.id || '';
  form.elements.title.value = work?.title || '';
  form.elements.description.value = work?.description || '';
  form.elements.imageAlt.value = work?.imageAlt || '';
  form.elements.instagramUrl.value = work?.instagramUrl || '';
  byId('work-editor-title').textContent = work ? '施工事例を編集' : '新しい施工事例';
  const preview = byId('image-preview');
  if (work?.imageKey || work?.imageUrl) { preview.src = work.imageKey ? imageUrl(work.imageKey) : new URL(work.imageUrl, 'https://kawase-creative.github.io/jyoubu-site-demo/').href; preview.hidden = false; }
  else { preview.hidden = true; preview.removeAttribute('src'); }
  byId('work-status').textContent = work ? '写真を変更しない場合は、そのまま保存できます。' : '';
  byId('work-editor').hidden = false;
  byId('work-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

byId('new-work').addEventListener('click', () => openWorkEditor());
byId('work-form').elements.image.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const preview = byId('image-preview'); preview.src = URL.createObjectURL(file); preview.hidden = false;
});
byId('work-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = byId('work-status'); status.textContent = '保存しています…';
  try {
    let imageKey = state.selectedImageKey;
    const file = form.elements.image.files?.[0];
    if (file) {
      const data = new FormData(); data.set('image', file);
      const uploaded = await api('/api/admin/media', { method: 'POST', body: data });
      imageKey = uploaded.imageKey;
    }
    const data = {
      title: form.elements.title.value,
      description: form.elements.description.value,
      imageAlt: form.elements.imageAlt.value,
      imageKey,
      imageUrl: state.selectedImageUrl,
      instagramUrl: form.elements.instagramUrl.value
    };
    const id = form.elements.id.value;
    await api(id ? `/api/admin/works/${encodeURIComponent(id)}` : '/api/admin/works', {
      method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    closeWorkEditor(); await refresh();
    byId('global-status').textContent = '施工事例を公開しました。';
  } catch (error) { status.textContent = error.message; }
});
document.querySelector('[data-cancel="work"]').addEventListener('click', closeWorkEditor);

byId('instagram-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget; const status = byId('instagram-status');
  status.textContent = '保存しています…';
  try {
    await api('/api/admin/instagram', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: form.elements.url.value, caption: form.elements.caption.value })
    });
    form.reset(); status.textContent = 'Instagram投稿を追加しました。'; await refresh();
  } catch (error) { status.textContent = error.message; }
});

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === tab));
  byId('works-panel').hidden = tab.dataset.tab !== 'works';
  byId('instagram-panel').hidden = tab.dataset.tab !== 'instagram';
}));

refresh();
