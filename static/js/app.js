const input = document.querySelector('#searchInput');
if (input) {
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    if (e.key === 'Escape') input.blur();
  });
}
