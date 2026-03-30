export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (typeof text === 'string') node.textContent = text;
  return node;
}

function tier(coverage) {
  if (coverage >= 75) return 'high';
  if (coverage >= 45) return 'medium';
  return 'low';
}

export function formatDurationFromMs(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value) || value < 0) return 'n/d';

  const totalSeconds = Math.floor(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function renderJsonBlock(container, obj) {
  const pre = el('pre', 'json');
  pre.textContent = JSON.stringify(obj, null, 2);
  container.appendChild(pre);
}

export function renderSection(container, title, coverageValue, bodyRenderer) {
  const card = el('section', 'card');
  const header = el('div', 'card-header');
  const titleNode = el('h2', null, title);
  const tag = el('span', `tier ${tier(coverageValue)}`, `coverage ${coverageValue}%`);

  header.appendChild(titleNode);
  header.appendChild(tag);
  card.appendChild(header);

  const body = el('div', 'card-body');
  bodyRenderer(body);
  card.appendChild(body);
  container.appendChild(card);
}
