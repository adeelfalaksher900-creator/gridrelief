import {
  VERSION,
  defaults,
  validate,
  plan,
  WEATHER_URL,
  weatherFromResponse,
  toCsv,
} from "./engine.js";
const $ = (id) => document.getElementById(id);
const e = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const number = (value, digits = 0) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
const pct = (value) => `${number(value * 100)}%`;
const keys = [
  "hours",
  "startHour",
  "packs",
  "packKwh",
  "packKw",
  "soc",
  "reserve",
  "efficiency",
  "solarFactor",
  "demandFactor",
  "floor",
];
const state = {
  scenario: defaults(),
  result: null,
  dirty: true,
  pending: false,
  view: "planner",
  editing: null,
  job: 0,
  saved: [],
  weatherPending: false,
};
let worker = null,
  toastTimer;
try {
  worker = new Worker("./worker.js", { type: "module" });
} catch {
  /* Same deterministic solver works on browsers without module workers. */
}
const labels = {
  planner: "Power planner",
  stress: "Test plan",
  saved: "Saved plans",
  method: "How it works",
};
for (let h = 0; h < 24; h++)
  $("startHour").add(new Option(`${String(h).padStart(2, "0")}:00`, h));
function toast(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => ($("toast").hidden = true), 5500);
}
function showError(id, message) {
  $(id).textContent = message;
  $(id).hidden = !message;
}
function switchView(view) {
  if (!labels[view]) return;
  state.view = view;
  for (const key of Object.keys(labels)) $(`view-${key}`).hidden = key !== view;
  document.querySelectorAll(".nav-item").forEach((b) => {
    const active = b.dataset.view === view;
    b.classList.toggle("active", active);
    if (active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  $("view-label").textContent = labels[view];
  if (view === "saved") renderSaved();
  if (view === "stress") renderStress();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function syncForm() {
  const c = state.scenario;
  for (const key of keys) $(key).value = c[key];
  $("robust").checked = c.robust;
  $("packs-output").textContent = c.packs;
  updateWeatherLabel();
}
function readForm() {
  const c = { ...state.scenario };
  for (const key of keys) c[key] = Number($(key).value);
  c.robust = $("robust").checked;
  return validate(c);
}
function dirty() {
  state.job++;
  state.dirty = true;
  state.pending = false;
  $("export-button").disabled = true;
  $("optimize-button").disabled = false;
  $("optimize-button").innerHTML = "<span>Update plan</span><span>→</span>";
  $("plan-status").className = "plan-status dirty";
  $("plan-status").textContent = state.result
    ? "Inputs changed. The previous plan is shown until you recalculate."
    : "Choose your settings, then calculate a plan.";
  $("packs-output").textContent = $("packs").value;
  showError("form-error", "");
}
function commitResult(id, result, error) {
  if (id !== state.job) return;
  state.pending = false;
  $("optimize-button").disabled = false;
  $("optimize-button").innerHTML = "<span>Calculate plan</span><span>→</span>";
  if (error) {
    showError("form-error", error);
    $("plan-status").className = "plan-status dirty";
    $("plan-status").textContent = state.result
      ? "This setup cannot meet the minimum. The previous plan is shown."
      : "These batteries cannot meet the minimum at every hub.";
    state.dirty = true;
    $("export-button").disabled = true;
    return;
  }
  state.result = result;
  state.scenario = result.scenario;
  state.dirty = false;
  showError("form-error", "");
  $("export-button").disabled = false;
  render();
}
if (worker) {
  worker.onmessage = ({ data }) =>
    commitResult(data.id, data.result, data.error);
  worker.onerror = () => {
    worker?.terminate();
    worker = null;
    if (state.pending) {
      try {
        commitResult(state.job, plan(state.scenario));
      } catch (error) {
        commitResult(state.job, null, error.message);
      }
    }
  };
}
function calculate(scenario) {
  if (!scenario && !$("scenario-form").reportValidity()) return;
  let c;
  try {
    c = scenario ? validate(scenario) : readForm();
  } catch (error) {
    showError("form-error", error.message);
    return;
  }
  state.scenario = c;
  state.pending = true;
  state.dirty = true;
  const id = ++state.job;
  $("export-button").disabled = true;
  $("optimize-button").disabled = true;
  $("optimize-button").innerHTML =
    '<span>Calculating your plan…</span><span class="spinner" aria-hidden="true"></span>';
  $("plan-status").className = "plan-status";
  $("plan-status").textContent = "Checking battery choices for every hub…";
  if (worker) worker.postMessage({ id, scenario: c });
  else
    requestAnimationFrame(() => {
      try {
        commitResult(id, plan(c));
      } catch (error) {
        commitResult(id, null, error.message);
      }
    });
}
function applyScenario(c) {
  state.scenario = validate(c);
  syncForm();
  $("preset").value = "custom";
  calculate(state.scenario);
}
function renderNetwork() {
  const r = state.result,
    c = r.scenario;
  $("network-heading").textContent =
    `${c.packs} batteries. ${c.hubs.length} community hubs.`;
  $("network-subtitle").textContent =
    `${c.packs} battery packs · ${number(c.packs * c.packKwh)} kWh total storage · ${c.hours}h outage`;
  const positions =
    c.hubs.length <= 6
      ? [
          [102, 63],
          [318, 41],
          [535, 63],
          [102, 171],
          [318, 192],
          [535, 171],
        ]
      : c.hubs.map((h, i) => [75 + (i % 4) * 165, i < 4 ? 57 : 188]);
  const cx = 318,
    cy = 119;
  let paths = "",
    nodes = "";
  c.hubs.forEach((h, i) => {
    const [x, y] = positions[i] || [318, 119];
    const s = r.optimal.sites[i];
    const short = h.name
      .replace(
        /community hub|neighborhood center|resource hub|library hub|food pantry|gathering space/,
        "",
      )
      .trim()
      .slice(0, 18);
    const solid = s.packs > 0;
    paths += `<path d="M${cx} ${cy} Q${x} ${cy} ${x} ${y}" stroke="${solid ? "#8cbd84" : "#416652"}" stroke-width="${solid ? 1.5 : 1}" ${solid ? "" : 'stroke-dasharray="3 4"'} fill="none"/>`;
    nodes += `<g><rect x="${x - 67}" y="${y - 22}" width="134" height="44" rx="9" fill="#244b3a" stroke="${solid ? "#7a9e63" : "#3c624b"}"/><rect x="${x - 54}" y="${y - 8}" width="19" height="16" rx="4" fill="${solid ? "#d7eeb5" : "#395f48"}"/><text x="${x - 44.5}" y="${y + 3}" text-anchor="middle" fill="${solid ? "#34502d" : "#a9c09f"}" font-size="10" font-weight="600">${s.packs}</text><text x="${x - 25}" y="${y - 2}" fill="#dcebd3" font-size="11">${e(short)}</text><text x="${x - 25}" y="${y + 10}" fill="#c0d5bd" font-size="9">${pct(s.coverage)} supplied</text></g>`;
  });
  $("network-diagram").innerHTML =
    `<svg viewBox="0 0 636 245" role="img" aria-label="Schematic battery allocation across ${c.hubs.length} illustrative hubs. Full results are in the allocation table."><defs><pattern id="network-grid" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#668567" opacity=".28"/></pattern></defs><rect width="636" height="245" fill="url(#network-grid)"/>${paths}<circle cx="${cx}" cy="${cy}" r="23" fill="#d9edb7"/><path d="M306 107h7v8h10v-8h7v24h-7v-9h-10v9h-7z" fill="#33542e"/>${nodes}</svg><div class="network-mobile-grid">${c.hubs.map((h, i) => `<button type="button" data-edit="${e(h.id)}" aria-label="Edit ${e(h.name)}"><span class="network-mobile-count">${r.optimal.sites[i].packs}<small>packs</small></span><span><strong>${e(h.name)}</strong><small>${pct(r.optimal.sites[i].coverage)} of power needs supplied</small></span><span aria-hidden="true">↗</span></button>`).join("")}</div>`;
}
function renderMetrics() {
  const r = state.result,
    t = r.optimal.totals,
    delta = (r.score / r.baselineScore - 1) * 100;
  const improvement =
    r.baselineScore > 0
      ? `${delta >= 0 ? "+" : ""}${number(delta, 1)}%`
      : "No baseline service";
  $("metrics").innerHTML =
    `<article class="metric"><div class="metric-label">Essential energy supplied <span aria-hidden="true">↗</span></div><div class="metric-value">${pct(t.coverage)}</div><div class="metric-foot">${number(t.served, 1)} of ${number(t.demand, 1)} kWh demand</div></article><article class="metric"><div class="metric-label">Priority score gain <span aria-hidden="true">◈</span></div><div class="metric-value">${improvement}</div><div class="metric-foot positive">${number(r.score)} points · vs round-robin sharing</div></article><article class="metric"><div class="metric-label">Lowest hub coverage <span aria-hidden="true">◎</span></div><div class="metric-value">${pct(t.minimumCoverage)}</div><div class="metric-foot">Planned outage · ${number(t.unserved, 1)} kWh unmet total</div></article>`;
}
function renderChart() {
  const rows = state.result.optimal.series;
  const width = 700,
    height = 225,
    left = 42,
    right = 16,
    top = 21,
    bottom = 35;
  const chartW = width - left - right,
    chartH = height - top - bottom;
  const max =
    Math.ceil(Math.max(...rows.map((r) => Math.max(r.demand, r.pv))) / 5) * 5 ||
    5;
  const x = (i) => left + (i / Math.max(1, rows.length - 1)) * chartW;
  const y = (v) => top + chartH - (v / max) * chartH;
  const line = (key) =>
    rows
      .map(
        (r, i) => `${i ? "L" : "M"}${x(i).toFixed(2)} ${y(r[key]).toFixed(2)}`,
      )
      .join(" ");
  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const v = (max * i) / 4;
    grid += `<line x1="${left}" x2="${width - right}" y1="${y(v)}" y2="${y(v)}" stroke="#eaf0e5" stroke-dasharray="2 4"/><text x="${left - 8}" y="${y(v) + 3}" text-anchor="end" fill="#61745f" font-size="11">${number(v, 1)}</text>`;
  }
  for (
    let i = 0;
    i < rows.length;
    i += Math.max(1, Math.floor(rows.length / 6))
  )
    grid += `<text x="${x(i)}" y="${height - 13}" text-anchor="middle" fill="#61745f" font-size="11">${String(rows[i].hour).padStart(2, "0")}:00${i >= 24 ? " +1d" : ""}</text>`;
  const circles = rows
    .map(
      (r, i) =>
        `<circle cx="${x(i)}" cy="${y(r.served)}" r="6" fill="transparent" tabindex="0" role="img" aria-label="Hour ${i + 1}, ${r.hour}:00. Demand ${number(r.demand, 1)} kilowatts; served ${number(r.served, 1)}; solar ${number(r.pv, 1)}."><title>Hour ${i + 1} · ${String(r.hour).padStart(2, "0")}:00\nDemand ${number(r.demand, 1)} kW\nServed ${number(r.served, 1)} kW\nSolar ${number(r.pv, 1)} kW\nStored ${number(r.stored, 1)} kWh</title></circle>`,
    )
    .join("");
  $("energy-chart").innerHTML =
    `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Hourly demand, served electrical load, and solar output in kilowatts. An accessible data table follows."><text x="${left}" y="10" font-size="10" fill="#61745f">kW</text>${grid}<path d="${line("served")} L${x(rows.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z" fill="#e9f1df" opacity=".65"/><path d="${line("demand")}" stroke="#9daa96" stroke-width="1.5" stroke-dasharray="4 4" fill="none"/><path d="${line("pv")}" stroke="#b89955" stroke-width="1.6" fill="none"/><path d="${line("served")}" stroke="#427248" stroke-width="2.5" fill="none" stroke-linejoin="round"/>${circles}</svg>`;
  $("hourly-table").innerHTML =
    `<table><caption class="tiny">All readings are simulated hourly averages</caption><thead><tr><th>Outage hour</th><th>Local hour</th><th>Demand kW</th><th>Served kW</th><th>Solar kW</th><th>Stored kWh</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.t + 1}</td><td>${String(r.hour).padStart(2, "0")}:00</td><td>${number(r.demand, 2)}</td><td>${number(r.served, 2)}</td><td>${number(r.pv, 2)}</td><td>${number(r.stored, 2)}</td></tr>`).join("")}</tbody></table>`;
}
function renderHubs() {
  const r = state.result;
  $("hub-table").innerHTML =
    `<table><thead><tr><th scope="col">Community hub</th><th scope="col">Batteries</th><th scope="col">Power supplied</th><th scope="col">Unmet kWh</th><th scope="col"><span class="muted">Edit</span></th></tr></thead><tbody>${r.scenario.hubs
      .map((h, i) => {
        const s = r.optimal.sites[i];
        return `<tr><td><div class="hub-name"><span class="hub-avatar" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><button class="edit-hub" data-edit="${e(h.id)}" aria-label="Edit ${e(h.name)}"><strong>${e(h.name)}</strong><small>${e(h.area)} · priority ${number(h.priority, 1)}</small></button></div></td><td><span class="pack-pill"><span aria-hidden="true">▰</span> ${s.packs}</span></td><td><div class="coverage ${s.coverage < 0.3 ? "low" : ""}"><span class="coverage-track" aria-hidden="true"><i class="coverage-fill" style="width:${Math.max(0, Math.min(100, s.coverage * 100))}%"></i></span>${pct(s.coverage)}</div></td><td>${number(s.unserved, 1)}</td><td><button class="edit-icon" data-edit="${e(h.id)}" aria-label="Edit inputs for ${e(h.name)}">↗</button></td></tr>`;
      })
      .join("")}</tbody></table>`;
  $("allocation-why-content").innerHTML = r.explanations
    .map(
      (x, i) =>
        `<article><strong>${e(r.scenario.hubs[i].name)} · ${x.packs} pack${x.packs === 1 ? "" : "s"}</strong><p>${x.packs === 0 ? `Modeled solar alone supplies ${pct(x.nominalCoverage)} of planned energy demand; its lowest stress coverage is ${pct(x.stressMinimumCoverage)}.` : `The floor needs at least ${x.minimumPacks} pack${x.minimumPacks === 1 ? "" : "s"}. Removing one assigned pack, with every other allocation unchanged, loses ${number(x.removeOneScoreLoss)} priority score points${x.removalViolatesFloor ? " and violates the selected floor" : ""}.`}</p></article>`,
    )
    .join("");
  $("allocation-summary").textContent =
    `${r.optimal.allocation.reduce((a, b) => a + b, 0)} of ${r.scenario.packs} packs allocated · nameplate capacity ${number(r.scenario.packs * r.scenario.packKwh)} kWh`;
}
function renderStress() {
  const r = state.result;
  if (!r) {
    $("stress-warning").textContent =
      "Calculate a plan first, then test it here.";
    $("stress-cards").innerHTML = "";
    return;
  }
  $("stress-warning").textContent = state.dirty
    ? "Inputs changed. These stress results describe the previous calculated scenario. Recalculate in the planner."
    : "The same battery plan is tested in three conditions. These are modeled cases, not predictions.";
  $("stress-cards").innerHTML = r.stress
    .map(
      (s, i) =>
        `<article class="panel stress-card ${i === 0 ? "current" : ""}"><div class="eyebrow">SCENARIO 0${i + 1} · ${s.hours} HOURS</div><h2>${e(s.name)}</h2><div class="stress-value">${pct(s.result.totals.coverage)}</div><p>Essential energy supplied</p><div class="stress-baseline"><span>Round-robin: ${pct(s.baseline.totals.coverage)}</span><span>${number(s.result.totals.unserved, 1)} kWh unmet</span></div></article>`,
    )
    .join("");
  $("stress-table").innerHTML =
    `<table><thead><tr><th>Community hub</th>${r.stress.map((s) => `<th>${e(s.name)}</th>`).join("")}</tr></thead><tbody>${r.scenario.hubs.map((h, i) => `<tr><td><strong>${e(h.name)}</strong></td>${r.stress.map((s) => `<td class="stress-cell">${pct(s.result.sites[i].coverage)}<span>${number(s.result.sites[i].serviceHours, 1)} equivalent service-hours</span></td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function render() {
  renderNetwork();
  renderMetrics();
  renderChart();
  renderHubs();
  renderStress();
  updateWeatherLabel();
  $("plan-status").className = "plan-status";
  $("plan-status").innerHTML =
    `<strong>✓ Plan calculated</strong> · ${state.scenario.robust ? "Tougher conditions checked" : "Planned outage only"} · All ${state.scenario.packs} packs assigned`;
}
function updateWeatherLabel() {
  const w = state.scenario.weather;
  $("weather-reset").hidden = !w;
  $("weather-label").textContent = w
    ? "Forecast snapshot loaded"
    : "Sample weather";
  $("weather-detail").textContent = w
    ? `Day one ${w.time[0].slice(0, 10)} · retrieved ${new Date(w.fetchedAt).toLocaleString()} · saved model output`
    : "Built-in data · no internet needed";
  $("weather-button").textContent = w
    ? "Refresh Charlotte forecast ↗"
    : "Use Charlotte forecast ↗";
}
function readSaved() {
  try {
    const raw = JSON.parse(
      localStorage.getItem("gridrelief.scenarios.v1") || "[]",
    );
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, 30).flatMap((s) => {
      try {
        if (typeof s.id !== "string" || typeof s.date !== "string") return [];
        return [{ id: s.id, date: s.date, scenario: validate(s.scenario) }];
      } catch {
        return [];
      }
    });
  } catch {
    toast("Local storage is unavailable. Export JSON to keep your scenarios.");
    return [];
  }
}
function persistSaved(next) {
  localStorage.setItem("gridrelief.scenarios.v1", JSON.stringify(next));
  state.saved = next;
  $("saved-count").textContent = next.length;
}
function renderSaved() {
  const items = state.saved;
  if (!items.length) {
    $("saved-list").innerHTML =
      '<div class="empty-state"><div class="eyebrow">Your workspace</div><h2>No saved plans yet.</h2><p>Set up an outage, calculate a plan, then save it here. Plans stay in this browser.</p><button class="button primary" data-view="planner">Create a plan →</button></div>';
    return;
  }
  $("saved-list").innerHTML = items
    .map(
      (s) =>
        `<article class="panel saved-card"><div><h2>${e(s.scenario.name)}</h2><p>${s.scenario.hours}h outage · ${s.scenario.packs} packs · ${s.scenario.hubs.length} hubs · ${s.scenario.robust ? "stress-aware" : "nominal"} planning</p><p class="tiny">Saved ${e(new Date(s.date).toLocaleString())} · ${s.scenario.weather ? "forecast snapshot" : "sample weather"}</p></div><div class="saved-actions"><button class="button secondary" data-download-saved="${e(s.id)}">Export JSON ↓</button><button class="button primary" data-restore="${e(s.id)}">Open →</button><button class="icon-button delete-saved" data-remove="${e(s.id)}" aria-label="Remove saved scenario ${e(s.scenario.name)}">×</button></div></article>`,
    )
    .join("");
}
function download(filename, body, type) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportScenario(scenario, result) {
  download(
    "hubmorrow-plan.json",
    JSON.stringify(
      {
        format: "hubmorrow-plan",
        version: VERSION,
        scenario,
        ...(result ? { results: result } : {}),
        disclaimer: "Planning model. Review before real use.",
      },
      null,
      2,
    ),
    "application/json",
  );
}
document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) {
    switchView(nav.dataset.view);
    return;
  }
  const edit = event.target.closest("[data-edit]");
  if (edit) {
    state.editing = edit.dataset.edit;
    const h = state.scenario.hubs.find((h) => h.id === state.editing);
    if (!h) return;
    for (const key of [
      "name",
      "area",
      "seats",
      "priority",
      "solar",
      "communications",
      "refrigeration",
      "cooling",
      "lighting",
    ])
      $(`hub-${key}`).value = h[key];
    $("hub-dialog-title").textContent = "Edit hub power needs";
    showError("hub-error", "");
    $("hub-dialog").showModal();
    return;
  }
  const close = event.target.closest(".close-dialog");
  if (close) {
    close.closest("dialog").close();
    return;
  }
  const restore = event.target.closest("[data-restore]");
  if (restore) {
    const s = state.saved.find((s) => s.id === restore.dataset.restore);
    if (s) {
      applyScenario(structuredClone(s.scenario));
      switchView("planner");
      toast("Saved plan opened and recalculated.");
    }
    return;
  }
  const saveExport = event.target.closest("[data-download-saved]");
  if (saveExport) {
    const s = state.saved.find(
      (s) => s.id === saveExport.dataset.downloadSaved,
    );
    if (s) exportScenario(s.scenario);
    return;
  }
  const remove = event.target.closest("[data-remove]");
  if (remove) {
    try {
      persistSaved(state.saved.filter((s) => s.id !== remove.dataset.remove));
      renderSaved();
      toast("Saved copy removed from this device. Current plan is retained.");
    } catch {
      toast("Could not update local storage.");
    }
  }
});
$("sidebar-method").addEventListener("click", (event) => {
  event.preventDefault();
  switchView("method");
});
$("scenario-form").addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});
for (const key of [...keys, "robust"])
  $(key).addEventListener("input", () => {
    dirty();
    $("preset").value = "custom";
  });
$("preset").addEventListener("change", () => {
  const value = $("preset").value;
  if (value === "custom") return;
  let c;
  try {
    c = readForm();
  } catch {
    c = structuredClone(state.scenario);
  }
  if (value === "storm")
    Object.assign(c, {
      name: "Charlotte storm plan",
      hours: 24,
      startHour: 16,
      solarFactor: 55,
      demandFactor: 100,
    });
  if (value === "night")
    Object.assign(c, {
      name: "Overnight outage plan",
      hours: 12,
      startHour: 20,
      solarFactor: 70,
      demandFactor: 85,
    });
  if (value === "cloud")
    Object.assign(c, {
      name: "Extended cloud cover plan",
      hours: 36,
      startHour: 8,
      solarFactor: 20,
      demandFactor: 110,
    });
  state.scenario = c;
  syncForm();
  calculate(c);
});
$("hub-form").addEventListener("submit", (event) => {
  event.preventDefault();
  let c;
  try {
    c = readForm();
    c.hubs = c.hubs.map((h) =>
      h.id === state.editing
        ? {
            ...h,
            ...Object.fromEntries(
              [
                "name",
                "area",
                "seats",
                "priority",
                "solar",
                "communications",
                "refrigeration",
                "cooling",
                "lighting",
              ].map((key) => [
                key,
                ["name", "area"].includes(key)
                  ? $(`hub-${key}`).value
                  : Number($(`hub-${key}`).value),
              ]),
            ),
          }
        : h,
    );
    c = validate(c);
  } catch (error) {
    showError("hub-error", error.message);
    return;
  }
  $("hub-dialog").close();
  applyScenario(c);
});
$("save-button").addEventListener("click", () => {
  try {
    readForm();
  } catch (error) {
    showError("form-error", error.message);
    return;
  }
  $("scenario-name").value = state.scenario.name;
  showError("save-error", "");
  $("save-dialog").showModal();
});
$("save-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const c = readForm();
    c.name = $("scenario-name").value.trim();
    const clean = validate(c);
    if (state.saved.length >= 30)
      throw new Error(
        "This device already has 30 scenarios. Export or remove a saved copy before adding another.",
      );
    const next = [
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        scenario: clean,
      },
      ...state.saved,
    ];
    persistSaved(next);
    $("save-dialog").close();
    toast("Plan saved in this browser.");
  } catch (error) {
    showError("save-error", error.message);
  }
});
$("export-button").addEventListener("click", () => {
  if (!state.dirty && state.result) {
    $("export-preview").value = JSON.stringify(
      {
        format: "hubmorrow-plan",
        version: VERSION,
        scenario: state.result.scenario,
      },
      null,
      2,
    );
    $("export-dialog").showModal();
  }
});
$("export-json").addEventListener("click", () => {
  if (state.dirty) return;
  exportScenario(state.result.scenario, state.result);
  toast("JSON download requested. Copy the scenario if downloads are blocked.");
});
$("export-csv").addEventListener("click", () => {
  if (state.dirty) return;
  download(
    "hubmorrow-allocation.csv",
    toCsv(state.result),
    "text/csv;charset=utf-8",
  );
  toast("CSV download requested. Your browser handles saving the file.");
});
$("export-print").addEventListener("click", () => {
  $("export-dialog").close();
  switchView("planner");
  window.print();
});
$("export-copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("export-preview").value);
    toast("Plan data copied. Paste it into Import to reopen this plan.");
  } catch {
    toast(
      "Clipboard access was unavailable. Open Inspect scenario JSON to copy it manually.",
    );
  }
});
$("import-button").addEventListener("click", () => {
  showError("import-error", "");
  $("import-json").value = "";
  $("import-dialog").showModal();
});
$("choose-import-file").addEventListener("click", () =>
  $("import-file").click(),
);
$("import-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const content = $("import-json").value;
    if (content.length > 1_000_000)
      throw new Error("Use a scenario smaller than 1 MB.");
    const raw = JSON.parse(content);
    const clean = validate(raw.scenario ?? raw);
    $("import-dialog").close();
    applyScenario(clean);
    switchView("planner");
    toast("Imported inputs validated and recalculated.");
  } catch (error) {
    showError("import-error", `Import failed: ${error.message}`);
  }
});
$("import-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 1_000_000)
      throw new Error("Choose a JSON scenario smaller than 1 MB.");
    const raw = JSON.parse(await file.text());
    const clean = validate(raw.scenario ?? raw);
    $("import-dialog").close();
    applyScenario(clean);
    switchView("planner");
    toast("Scenario imported. Results are recalculated from its inputs.");
  } catch (error) {
    toast(`Import failed: ${error.message}`);
  } finally {
    event.target.value = "";
  }
});
$("weather-button").addEventListener("click", async () => {
  if (state.weatherPending) return;
  state.weatherPending = true;
  $("weather-button").disabled = true;
  $("weather-button").textContent = "Loading forecast…";
  showError("weather-error", "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(WEATHER_URL, {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok)
      throw new Error(`Weather provider returned HTTP ${response.status}.`);
    const weather = weatherFromResponse(await response.json());
    const c = readForm();
    c.weather = weather;
    applyScenario(c);
    toast("Forecast snapshot loaded. Hub values are still sample data.");
  } catch (error) {
    showError(
      "weather-error",
      error.name === "AbortError"
        ? "Weather request timed out. Retry when the connection is available. Your previous weather is retained."
        : `Forecast unavailable. Your previous weather is retained. ${error.message}`,
    );
  } finally {
    clearTimeout(timeout);
    state.weatherPending = false;
    $("weather-button").disabled = false;
    updateWeatherLabel();
  }
});
$("weather-reset").addEventListener("click", () => {
  try {
    const c = readForm();
    c.weather = null;
    applyScenario(c);
    showError("weather-error", "");
    toast("Reproducible sample weather restored.");
  } catch (error) {
    showError("form-error", error.message);
  }
});
window.addEventListener("error", () => {
  if (!state.result)
    showError(
      "form-error",
      "The planner could not initialize. Refresh the page to retry.",
    );
});
state.saved = readSaved();
$("saved-count").textContent = state.saved.length;
syncForm();
calculate(state.scenario);
