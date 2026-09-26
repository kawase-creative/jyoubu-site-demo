const demoDialog = document.getElementById('demo-dialog');
const contactDialog = document.getElementById('contact-dialog');
const mobileNav = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('.menu-toggle');

function closeMobileNav() {
  mobileNav.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'メニューを開く');
}

document.querySelectorAll('.demo-trigger').forEach((button) => {
  button.addEventListener('click', () => {
    closeMobileNav();
    demoDialog.showModal();
  });
});

document.querySelectorAll('.contact-trigger').forEach((button) => {
  button.addEventListener('click', () => {
    closeMobileNav();
    document.getElementById('contact-status').textContent = '';
    contactDialog.showModal();
    document.getElementById('contact-name').focus();
  });
});

document.querySelector('.dialog-close').addEventListener('click', () => demoDialog.close());
document.querySelector('.contact-close').addEventListener('click', () => contactDialog.close());
for (const dialog of [demoDialog, contactDialog]) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

document.getElementById('contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  document.getElementById('contact-status').textContent = 'デモ画面のため、送信は行われません。';
});

menuToggle.addEventListener('click', () => {
  mobileNav.hidden = !mobileNav.hidden;
  menuToggle.setAttribute('aria-expanded', String(!mobileNav.hidden));
  menuToggle.setAttribute('aria-label', mobileNav.hidden ? 'メニューを開く' : 'メニューを閉じる');
});


// WORKS mini editor prototype (browser-local demo)

const WORKS_STORAGE_KEY = 'jyoubu-works-demo-v1';

function loadWorksData() {
  try {
    return JSON.parse(localStorage.getItem(WORKS_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveWorksData(data) {
  localStorage.setItem(WORKS_STORAGE_KEY, JSON.stringify(data));
}

function applyWorkData(card, data) {
  if (!data) return;
  const title = card.querySelector('.work-title');
  const description = card.querySelector('.work-description');
  const instagramLink = card.querySelector('.work-instagram-link');
  const titleInput = card.querySelector('.work-input-title');
  const descriptionInput = card.querySelector('.work-input-description');
  const instagramInput = card.querySelector('.work-input-instagram');

  if (typeof data.title === 'string') {
    title.textContent = data.title;
    titleInput.value = data.title;
  }
  if (typeof data.description === 'string') {
    description.textContent = data.description;
    descriptionInput.value = data.description;
  }
  if (typeof data.instagram === 'string') {
    instagramInput.value = data.instagram;
    if (/^https:\/\/(www\.)?instagram\.com\//i.test(data.instagram)) {
      instagramLink.href = data.instagram;
      instagramLink.hidden = false;
    } else {
      instagramLink.hidden = true;
      instagramLink.removeAttribute('href');
    }
  }
}

const worksData = loadWorksData();

document.querySelectorAll('.work-item[data-work-id]').forEach((card) => {
  const id = card.dataset.workId;
  const editor = card.querySelector('.work-editor');
  const toggle = card.querySelector('.work-edit-toggle');
  const cancel = card.querySelector('.work-cancel');
  const save = card.querySelector('.work-save');
  const status = card.querySelector('.work-save-status');

  applyWorkData(card, worksData[id]);

  function setEditor(open) {
    editor.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '× 編集を閉じる' : '✎ この事例を編集';
    status.textContent = '';
  }

  toggle.addEventListener('click', () => setEditor(editor.hidden));
  cancel.addEventListener('click', () => {
    applyWorkData(card, worksData[id] || {
      title: card.querySelector('.work-title').textContent,
      description: card.querySelector('.work-description').textContent,
      instagram: card.querySelector('.work-instagram-link').hidden ? '' : card.querySelector('.work-instagram-link').href
    });
    setEditor(false);
  });

  save.addEventListener('click', () => {
    const instagram = card.querySelector('.work-input-instagram').value.trim();
    if (instagram && !/^https:\/\/(www\.)?instagram\.com\//i.test(instagram)) {
      status.textContent = 'InstagramのURL（https://www.instagram.com/...）を入力してください。';
      return;
    }
    worksData[id] = {
      title: card.querySelector('.work-input-title').value.trim(),
      description: card.querySelector('.work-input-description').value.trim(),
      instagram
    };
    saveWorksData(worksData);
    applyWorkData(card, worksData[id]);
    status.textContent = 'この端末に保存しました。';
    setTimeout(() => setEditor(false), 650);
  });
});


// Admin edit mode prototype
const adminDialog = document.getElementById('admin-dialog');
const adminTrigger = document.querySelector('.admin-trigger');
const adminClose = document.querySelector('.admin-close');
const adminLoginForm = document.getElementById('admin-login-form');
const adminPassword = document.getElementById('admin-password');
const adminLoginStatus = document.getElementById('admin-login-status');
const adminModeBar = document.getElementById('admin-mode-bar');
const adminLogout = document.getElementById('admin-logout');

function setAdminMode(enabled) {
  document.body.classList.toggle('admin-mode', enabled);
  adminModeBar.hidden = !enabled;
  document.querySelectorAll('.work-editor').forEach((editor) => {
    if (!enabled) editor.hidden = true;
  });
  document.querySelectorAll('.work-edit-toggle').forEach((toggle) => {
    if (!enabled) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '✎ この事例を編集';
    }
  });
  document.querySelectorAll('.instagram-editor').forEach((editor) => {
    if (!enabled) editor.hidden = true;
  });
  document.querySelectorAll('.instagram-edit-toggle').forEach((toggle) => {
    if (!enabled) toggle.textContent = '✎ 投稿URLを編集';
  });
}

adminTrigger?.addEventListener('click', () => {
  if (document.body.classList.contains('admin-mode')) {
    document.querySelector('.works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  adminLoginStatus.textContent = '';
  adminPassword.value = '';
  adminDialog.showModal();
  setTimeout(() => adminPassword.focus(), 50);
});

adminClose?.addEventListener('click', () => adminDialog.close());

adminDialog?.addEventListener('click', (event) => {
  if (event.target === adminDialog) adminDialog.close();
});

adminLoginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (adminPassword.value === '0000') {
    setAdminMode(true);
    adminDialog.close();
    document.querySelector('.works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    adminLoginStatus.textContent = 'パスワードが違います。';
    adminPassword.select();
  }
});

adminLogout?.addEventListener('click', () => {
  setAdminMode(false);
  document.querySelector('.footer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});


// Instagram embed section (shared JSON on GitHub Pages)
const INSTAGRAM_JSON_PATH = 'data/instagram.json';

async function loadInstagramData() {
  try {
    const response = await fetch(`${INSTAGRAM_JSON_PATH}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to load Instagram JSON');
    const json = await response.json();
    const data = {};
    for (const post of json.posts || []) {
      data[String(post.id)] = post.url || '';
    }
    return data;
  } catch {
    return {};
  }
}

function renderInstagramSlot(slot, url) {
  const host = slot.querySelector('.instagram-embed-host');
  const slotNo = slot.dataset.instagramSlot;
  if (!url) {
    host.innerHTML = `
      <div class="instagram-placeholder">
        <img src="assets/instagram-icon.png" alt="">
        <strong>Instagram POST 0${slotNo}</strong>
        <span>管理者モードから投稿URLを設定できます。</span>
      </div>`;
    return;
  }

  host.innerHTML = `
    <blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14">
      <a href="${url}" target="_blank" rel="noopener">Instagramで投稿を見る</a>
    </blockquote>`;

  if (window.instgrm?.Embeds?.process) {
    window.instgrm.Embeds.process();
  } else {
    setTimeout(() => window.instgrm?.Embeds?.process?.(), 1200);
  }
}

async function initInstagramSlots() {
  const instagramData = await loadInstagramData();

  document.querySelectorAll('.instagram-slot[data-instagram-slot]').forEach((slot) => {
    const id = slot.dataset.instagramSlot;
    const toggle = slot.querySelector('.instagram-edit-toggle');
    const editor = slot.querySelector('.instagram-editor');
    const input = slot.querySelector('.instagram-url-input');
    const save = slot.querySelector('.instagram-save');
    const cancel = slot.querySelector('.instagram-cancel');
    const status = slot.querySelector('.instagram-save-status');

    input.value = instagramData[id] || '';
    renderInstagramSlot(slot, instagramData[id] || '');

    function setInstagramEditor(open) {
      editor.hidden = !open;
      toggle.textContent = open ? '× 編集を閉じる' : '✎ 投稿URLを編集';
      status.textContent = '';
    }

    toggle.addEventListener('click', () => setInstagramEditor(editor.hidden));
    cancel.addEventListener('click', () => {
      input.value = instagramData[id] || '';
      setInstagramEditor(false);
    });

    save.addEventListener('click', () => {
      const url = input.value.trim();
      if (url && !/^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\//i.test(url)) {
        status.textContent = 'Instagramの投稿URLを入力してください。';
        return;
      }
      instagramData[id] = url;
      renderInstagramSlot(slot, url);
      status.textContent = 'プレビューしました。公開反映にはGitHub JSONの更新が必要です。';
    });
  });
}

initInstagramSlots();
