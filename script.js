const demoDialog = document.getElementById('demo-dialog');
const contactDialog = document.getElementById('contact-dialog');
const mobileNav = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('.menu-toggle');

function closeMobileNav() {
  mobileNav.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'メニューを開く');
}

document.addEventListener('click', (event) => {
  if (event.target.closest('.demo-trigger')) {
    closeMobileNav();
    demoDialog.showModal();
  }
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


// Cloudflare-backed content for client-managed work and Instagram publishing.
const SITE_CONFIG = window.JYOUBU_SITE_CONFIG || {};
const CONTENT_API = String(SITE_CONFIG.contentApi || '').replace(/\/$/, '');
const adminLink = document.getElementById('admin-link');
if (adminLink && SITE_CONFIG.adminUrl) {
  adminLink.href = SITE_CONFIG.adminUrl;
  adminLink.target = '_blank';
  adminLink.rel = 'noopener noreferrer';
  adminLink.hidden = false;
}

function validInstagramLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['www.instagram.com', 'instagram.com'].includes(url.hostname)
      && /^\/(p|reel|tv|stories)\//.test(url.pathname);
  } catch {
    return false;
  }
}

function createWorkCard(work) {
  const article = document.createElement('article');
  article.className = 'work-item';
  article.dataset.workId = work.id || '';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'work-preview demo-trigger';
  const image = document.createElement('img');
  image.src = work.imageKey ? `${CONTENT_API}/media/${encodeURIComponent(work.imageKey)}` : work.imageUrl || '';
  image.alt = work.imageAlt || work.title || '施工事例';
  const title = document.createElement('strong');
  title.className = 'work-title';
  title.textContent = work.title || '';
  const description = document.createElement('span');
  description.className = 'work-description';
  description.textContent = work.description || '';
  button.append(image, title, description);
  article.append(button);
  if (validInstagramLink(work.instagramUrl || '')) {
    const link = document.createElement('a');
    link.className = 'work-instagram-link';
    link.href = work.instagramUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Instagramでこの事例を見る →';
    article.append(link);
  }
  return article;
}

function renderDynamicWorks(works) {
  const grid = document.querySelector('.works-grid');
  if (!grid || !Array.isArray(works)) return;
  grid.replaceChildren(...works.map(createWorkCard));
}

function renderDynamicInstagram(posts) {
  const grid = document.querySelector('.instagram-grid');
  if (!grid || !Array.isArray(posts)) return;
  grid.replaceChildren();
  for (const post of posts) {
    if (!validInstagramLink(post.url || '')) continue;
    const article = document.createElement('article');
    article.className = 'instagram-slot';
    const host = document.createElement('div');
    host.className = 'instagram-embed-host';
    if (/^https:\/\/(www\.)?instagram\.com\/stories\//i.test(post.url)) {
      const link = document.createElement('a');
      link.className = 'instagram-story-link';
      link.href = post.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const placeholder = document.createElement('div');
      placeholder.className = 'instagram-placeholder';
      const icon = document.createElement('img'); icon.src = 'assets/instagram-icon.png'; icon.alt = '';
      const label = document.createElement('strong'); label.textContent = 'Instagram STORY';
      const caption = document.createElement('span'); caption.textContent = post.caption || 'タップしてストーリーズを見る';
      placeholder.append(icon, label, caption); link.append(placeholder); host.append(link);
    } else {
      const quote = document.createElement('blockquote');
      quote.className = 'instagram-media';
      quote.dataset.instgrmPermalink = post.url;
      quote.dataset.instgrmVersion = '14';
      const link = document.createElement('a');
      link.href = post.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = post.caption || 'Instagramで投稿を見る';
      quote.append(link); host.append(quote);
    }
    article.append(host); grid.append(article);
  }
  if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
  else setTimeout(() => window.instgrm?.Embeds?.process?.(), 1200);
}

async function loadManagedContent() {
  if (!CONTENT_API) {
    await loadBundledInstagram();
    return;
  }
  try {
    const response = await fetch(`${CONTENT_API}/api/content`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Content API unavailable');
    const content = await response.json();
    renderDynamicWorks(content.works || []);
    renderDynamicInstagram(content.instagram || []);
  } catch (error) {
    // Retain the static sample content until the Cloudflare API is connected.
    console.info('Using the bundled sample content until the managed site is connected.', error);
    await loadBundledInstagram();
  }
}

async function loadBundledInstagram() {
  try {
    const response = await fetch(`data/instagram.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    renderDynamicInstagram(data.posts || []);
  } catch {
    // Keep the visible placeholders if the bundled sample data cannot be read.
  }
}

loadManagedContent();
