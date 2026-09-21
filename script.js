const dialog = document.getElementById('demo-dialog');
document.querySelectorAll('.demo-trigger').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.mobile-nav').hidden = true;
    const toggle = document.querySelector('.menu-toggle');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    dialog.showModal();
  });
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
document.querySelector('.menu-toggle').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const nav = document.querySelector('.mobile-nav');
  nav.hidden = !nav.hidden;
  button.setAttribute('aria-expanded', String(!nav.hidden));
  button.setAttribute('aria-label', nav.hidden ? 'メニューを開く' : 'メニューを閉じる');
});
