const RADAR_AXES = [
  { key: 'execution', label: 'Execucao' },
  { key: 'collaboration', label: 'Colaboracao' },
  { key: 'resilience', label: 'Resiliencia' },
  { key: 'innovation', label: 'Inovacao' }
];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (typeof text === 'string') node.textContent = text;
  return node;
}

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => {
    node.setAttribute(key, String(value));
  });
  return node;
}

function resolveRadarValues(report, backendRadar = null) {
  if (backendRadar?.values && Object.values(backendRadar.values).some((value) => Number.isFinite(Number(value)))) {
    return {
      source: backendRadar.source || 'backend:/api/events',
      values: {
        execution: Number(backendRadar.values.execution || 0),
        collaboration: Number(backendRadar.values.collaboration || 0),
        resilience: Number(backendRadar.values.resilience || 0),
        innovation: Number(backendRadar.values.innovation || 0)
      }
    };
  }

  const debugPoints = report?.debug?.profileCalculation?.points || null;
  if (debugPoints && Object.values(debugPoints).some((value) => Number.isFinite(Number(value)))) {
    return {
      source: 'debug.profileCalculation.points',
      values: {
        execution: Number(debugPoints.execution || 0),
        collaboration: Number(debugPoints.collaboration || 0),
        resilience: Number(debugPoints.resilience || 0),
        innovation: Number(debugPoints.innovation || 0)
      }
    };
  }

  const gpi = report?.sections?.profile?.gpi || null;
  if (gpi && Object.values(gpi).some((value) => Number.isFinite(Number(value)))) {
    return {
      source: 'sections.profile.gpi',
      values: {
        execution: Number(gpi.execution || 0),
        collaboration: Number(gpi.collaboration || 0),
        resilience: Number(gpi.resilience || 0),
        innovation: Number(gpi.innovation || 0)
      }
    };
  }

  return {
    source: 'no-data',
    values: {
      execution: 0,
      collaboration: 0,
      resilience: 0,
      innovation: 0
    }
  };
}

function parseAxisFromEventPayload(payload, totals) {
  if (!payload || typeof payload !== 'object') return;

  if (payload.gpiImpact && typeof payload.gpiImpact === 'object') {
    RADAR_AXES.forEach((axis) => {
      const raw = Number(payload.gpiImpact[axis.key]);
      if (Number.isFinite(raw)) totals[axis.key] += raw;
    });
  }

  const axisName = payload.axis;
  if (typeof axisName === 'string' && totals[axisName] !== undefined) {
    const rawPoints = Number(payload.points ?? payload.value ?? payload.score ?? 1);
    totals[axisName] += Number.isFinite(rawPoints) ? rawPoints : 1;
  }

  RADAR_AXES.forEach((axis) => {
    const statKey = `axis_points_${axis.key}`;
    const raw = Number(payload[statKey]);
    if (Number.isFinite(raw)) {
      totals[axis.key] += raw;
    }
  });
}

function pickSessionId(events, report) {
  const hinted =
    report?.debug?.rawSignals?.stats?.session_id ||
    report?.debug?.choicesTrace?.sessionTiming?.sessionId ||
    null;

  if (hinted) return hinted;

  const lastEvent = [...events]
    .filter((evt) => evt && typeof evt === 'object')
    .sort((a, b) => new Date(b?.insertedAt || 0).getTime() - new Date(a?.insertedAt || 0).getTime())[0];

  return lastEvent?.session_id || null;
}

export async function loadRadarValuesFromBackend(report) {
  try {
    const base = import.meta.env.BASE_URL || '/';
    const apiUrl = new URL('api/events', `${window.location.origin}${base}`);
    const res = await fetch(apiUrl.toString(), { credentials: 'same-origin' });
    if (!res.ok) return null;

    const events = await res.json();
    if (!Array.isArray(events) || events.length === 0) return null;

    const sessionId = pickSessionId(events, report);
    const scoped = sessionId
      ? events.filter((evt) => evt?.session_id === sessionId)
      : events;

    if (scoped.length === 0) return null;

    const totals = {
      execution: 0,
      collaboration: 0,
      resilience: 0,
      innovation: 0
    };

    scoped.forEach((evt) => {
      parseAxisFromEventPayload(evt?.payload, totals);
    });

    const hasSignal = Object.values(totals).some((value) => Number.isFinite(value) && value !== 0);
    if (!hasSignal) return null;

    return {
      source: `backend:/api/events${sessionId ? ` (session ${sessionId})` : ''}`,
      values: totals
    };
  } catch {
    return null;
  }
}

function getRadarRange(values) {
  const numericValues = Object.values(values)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  const minObserved = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const maxObserved = numericValues.length > 0 ? Math.max(...numericValues) : 100;

  const min = Math.min(-20, Math.floor(minObserved / 10) * 10);
  const max = Math.max(100, Math.ceil(maxObserved / 10) * 10);

  return { min, max };
}

function valueToRadius(value, min, max, radius) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  const span = max - min;
  if (span <= 0) return 0;
  return ((numeric - min) / span) * radius;
}

export function renderGpiRadar(container, report, backendRadar = null) {
  const radar = resolveRadarValues(report, backendRadar);
  const values = radar.values;
  const { min, max } = getRadarRange(values);

  const wrap = el('div', 'radar-wrap');
  const title = el('h3', null, 'Grafico de Radar GPI');
  const subtitle = el('p', 'muted', `Escala ${min} a ${max} | Fonte: ${radar.source}`);

  const cx = 190;
  const cy = 180;
  const maxRadius = 120;
  const levels = 5;

  const svg = svgEl('svg', {
    viewBox: '0 0 420 360',
    class: 'radar-svg',
    role: 'img',
    'aria-label': 'Grafico de radar dos eixos GPI'
  });

  const angles = RADAR_AXES.map((_, index) => (-Math.PI / 2) + ((Math.PI * 2 * index) / RADAR_AXES.length));

  for (let level = 1; level <= levels; level += 1) {
    const ratio = level / levels;
    const points = angles
      .map((angle) => {
        const x = cx + Math.cos(angle) * (maxRadius * ratio);
        const y = cy + Math.sin(angle) * (maxRadius * ratio);
        return `${x},${y}`;
      })
      .join(' ');

    svg.appendChild(svgEl('polygon', {
      points,
      fill: 'none',
      stroke: '#d8e2ef',
      'stroke-width': level === levels ? 1.2 : 1
    }));

    const tickValue = min + ((max - min) * ratio);
    const tick = svgEl('text', {
      x: cx + 6,
      y: cy - (maxRadius * ratio) + 4,
      fill: '#6b7280',
      'font-size': '10'
    });
    tick.textContent = `${Math.round(tickValue)}`;
    svg.appendChild(tick);
  }

  angles.forEach((angle, index) => {
    const x = cx + Math.cos(angle) * maxRadius;
    const y = cy + Math.sin(angle) * maxRadius;

    svg.appendChild(svgEl('line', {
      x1: cx,
      y1: cy,
      x2: x,
      y2: y,
      stroke: '#9fb3c8',
      'stroke-width': 1.1
    }));

    const labelX = cx + Math.cos(angle) * (maxRadius + 20);
    const labelY = cy + Math.sin(angle) * (maxRadius + 20);
    const axis = RADAR_AXES[index];
    const value = Number(values[axis.key] || 0);

    const label = svgEl('text', {
      x: labelX,
      y: labelY,
      fill: '#1f2a37',
      'font-size': '12',
      'font-weight': '600',
      'text-anchor': 'middle'
    });
    label.textContent = `${axis.label} (${value})`;
    svg.appendChild(label);
  });

  const dataPoints = angles
    .map((angle, index) => {
      const axis = RADAR_AXES[index];
      const rawValue = Number(values[axis.key] || 0);
      const r = valueToRadius(rawValue, min, max, maxRadius);
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r
      };
    });

  svg.appendChild(svgEl('polygon', {
    points: dataPoints.map((point) => `${point.x},${point.y}`).join(' '),
    fill: 'rgba(13, 110, 253, 0.25)',
    stroke: '#0d6efd',
    'stroke-width': 2.2
  }));

  dataPoints.forEach((point) => {
    svg.appendChild(svgEl('circle', {
      cx: point.x,
      cy: point.y,
      r: 4,
      fill: '#0d6efd',
      stroke: '#ffffff',
      'stroke-width': 1.4
    }));
  });

  wrap.appendChild(title);
  wrap.appendChild(subtitle);
  wrap.appendChild(svg);

  const gpiGrid = el('div', 'gpi-grid');
  const orderedItems = [
    { key: 'execution', label: 'exec' },
    { key: 'resilience', label: 'res' },
    { key: 'collaboration', label: 'colab' },
    { key: 'innovation', label: 'innov' }
  ];

  orderedItems.forEach((item) => {
    const row = el('div', 'gpi-item');
    row.appendChild(el('span', 'gpi-label', item.label));
    row.appendChild(el('span', 'gpi-value', String(Number(values[item.key] || 0))));
    gpiGrid.appendChild(row);
  });

  wrap.appendChild(gpiGrid);

  container.appendChild(wrap);
}
