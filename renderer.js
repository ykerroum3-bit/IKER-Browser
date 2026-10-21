const $ = id => document.getElementById(id);
let tabs = [];
let current = null;
let homeVisible = true;

function renderTabs() {
  const container = $('tabs');
  container.innerHTML = '';
  tabs.forEach(tab => {
    const el = document.createElement('div');
    el.className = 'tab' + (tab.active ? ' active' : '');
    el.title = tab.url || tab.title;
    const mark = document.createElement('span');
    mark.textContent = tab.private ? '◉' : '◈';
    mark.style.color = tab.private ? '#c1a3ff' : '#8291b7';
    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title || 'Nouvel onglet';
    const close = document.createElement('button');
    close.className = 'tab-close';
    close.textContent = '×';
    close.title = 'Fermer l’onglet';
    close.addEventListener('click', e => { e.stopPropagation(); window.iker.closeTab(tab.id); });
    el.append(mark, title, close);
    el.addEventListener('click', () => window.iker.activateTab(tab.id));
    container.appendChild(el);
  });
}
window.iker.onTabs(updated => { tabs = updated; renderTabs(); });
window.iker.onNavState(state => {
  if (!state) return;
  current = state;
  $('address').value = state.url || '';
  $('back').disabled = !state.canGoBack;
  $('forward').disabled = !state.canGoForward;
  $('privateToggle').style.borderColor = state.private ? '#8b5cf6' : '';
  $('privacyStatus').textContent = state.private ? 'SESSION PRIVÉE' : 'PROTECTION ACTIVE';
  $('status').textContent = state.loading ? 'Chargement…' : 'Navigation prête';
  homeVisible = false;
  $('homePanel').classList.add('hidden');
});
function go(input) { window.iker.navigate(input); $('address').blur(); }
$('addressForm').addEventListener('submit', e => { e.preventDefault(); go($('address').value); });
$('heroForm').addEventListener('submit', e => { e.preventDefault(); go($('heroInput').value); });
$('back').addEventListener('click', () => window.iker.back());
$('forward').addEventListener('click', () => window.iker.forward());
$('reload').addEventListener('click', () => window.iker.reload());
$('home').addEventListener('click', () => { $('homePanel').classList.remove('hidden'); window.iker.home(); });
$('newTab').addEventListener('click', () => window.iker.newTab('https://www.google.com', false));
$('privateToggle').addEventListener('click', () => window.iker.newTab('https://www.google.com', true));
$('openPrivate').addEventListener('click', () => window.iker.newTab('https://www.google.com', true));
document.querySelectorAll('[data-url]').forEach(b => b.addEventListener('click', () => go(b.dataset.url)));
$('assistantToggle').addEventListener('click', () => { $('assistant').classList.toggle('hidden'); $('settings').classList.add('hidden'); });
$('closeAssistant').addEventListener('click', () => $('assistant').classList.add('hidden'));
$('settingsToggle').addEventListener('click', () => { $('settings').classList.toggle('hidden'); $('assistant').classList.add('hidden'); });
$('closeSettings').addEventListener('click', () => $('settings').classList.add('hidden'));
$('adblock').addEventListener('change', async e => {
  await window.iker.toggleAdblock(e.target.checked);
  $('status').textContent = e.target.checked ? 'Filtrage publicitaire activé' : 'Filtrage publicitaire désactivé';
});
$('readPage').addEventListener('click', async () => {
  $('pageText').value = await window.iker.getPageText();
  $('status').textContent = 'Texte de la page récupéré';
});
$('copyText').addEventListener('click', () => {
  $('pageText').focus(); $('pageText').select();
  $('status').textContent = 'Texte sélectionné : Ctrl+C pour copier';
});
window.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') { e.preventDefault(); $('address').focus(); $('address').select(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') { e.preventDefault(); window.iker.newTab('https://www.google.com', false); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') { e.preventDefault(); if (current) window.iker.closeTab(current.id); }
  if (e.key === 'Escape') { $('assistant').classList.add('hidden'); $('settings').classList.add('hidden'); }
});
window.iker.getAdblock().then(v => $('adblock').checked = v);
