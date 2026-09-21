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
