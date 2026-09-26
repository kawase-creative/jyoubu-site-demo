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

function compressWorkImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

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
  const mainImage = card.querySelector('.work-preview img');
  const editorPreview = card.querySelector('.work-editor-preview');
  const imageUrlInput = card.querySelector('.work-input-image-url');
  const titleInput = card.querySelector('.work-input-title');
  const descriptionInput = card.querySelector('.work-input-description');
  const instagramInput = card.querySelector('.work-input-instagram');

  if (typeof data.image === 'string' && data.image) {
    mainImage.src = data.image;
    editorPreview.src = data.image;
    imageUrlInput.value = data.image.startsWith('data:') ? '' : data.image;
  } else {
    editorPreview.src = mainImage.src;
  }
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
  const imageFileInput = card.querySelector('.work-input-image-file');
  const imageUrlInput = card.querySelector('.work-input-image-url');
  const editorPreview = card.querySelector('.work-editor-preview');
  let pendingImage = '';

  applyWorkData(card, worksData[id]);
  if (!editorPreview.src) editorPreview.src = card.querySelector('.work-preview img').src;

  imageFileInput.addEventListener('change', async () => {
    const file = imageFileInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      status.textContent = '画像ファイルを選択してください。';
      return;
    }
    try {
      pendingImage = await compressWorkImage(file);
      editorPreview.src = pendingImage;
      imageUrlInput.value = '';
      status.textContent = '写真を読み込みました。保存すると反映されます。';
    } catch {
      status.textContent = '写真の読み込みに失敗しました。';
    }
  });

  imageUrlInput.addEventListener('input', () => {
    const url = imageUrlInput.value.trim();
    if (/^https?:\/\//i.test(url)) {
      pendingImage = url;
      editorPreview.src = url;
      status.textContent = '画像URLをプレビューしています。';
    }
  });

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
      instagram: card.querySelector('.work-instagram-link').hidden ? '' : card.querySelector('.work-instagram-link').href,
      image: card.querySelector('.work-preview img').src
    });
    pendingImage = '';
    imageFileInput.value = '';
    setEditor(false);
  });

  save.addEventListener('click', () => {
    const instagram = card.querySelector('.work-input-instagram').value.trim();
    if (instagram && !/^https:\/\/(www\.)?instagram\.com\//i.test(instagram)) {
      status.textContent = 'InstagramのURL（https://www.instagram.com/...）を入力してください。';
      return;
    }
    const typedImageUrl = imageUrlInput.value.trim();
    if (typedImageUrl && !/^https?:\/\//i.test(typedImageUrl)) {
      status.textContent = '画像URLは https:// から入力してください。';
      return;
    }
    const currentImage = card.querySelector('.work-preview img').src;
    worksData[id] = {
      title: card.querySelector('.work-input-title').value.trim(),
      description: card.querySelector('.work-input-description').value.trim(),
      instagram,
      image: pendingImage || typedImageUrl || worksData[id]?.image || currentImage
    };
    saveWorksData(worksData);
    applyWorkData(card, worksData[id]);
    status.textContent = '写真を含め、この端末に保存しました。';
    pendingImage = '';
    imageFileInput.value = '';
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
