// ===== Theme toggle (optional) =====
const themeBtn = document.getElementById("theme-toggle");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeBtn.textContent = themeBtn.textContent.trim() === "🌙" ? "☀️" : "🌙";
  });
}

// ===== Elements =====
const rows = document.getElementById("rows");
const kLevel = document.getElementById("kpi-level");
const kIn = document.getElementById("kpi-inflow");
const kOut = document.getElementById("kpi-outflow");
const kStor = document.getElementById("kpi-storage");
const kTemp = document.getElementById("kpi-temp");
const btnToggle = document.getElementById("toggle-run");
const selInterval = document.getElementById("interval-ms");
const btnClear = document.getElementById("clear-table");

// ===== Simple reservoir dynamics =====
let resId = 0;
let storage = 2.5e7; // m³
let level = 78; // m
let tempC = 18.5; // °C
const levelPerM3 = 1 / 500000; // simple scale factor

function sample() {
  // Inflow/outflow with smooth variation + noise
  const inflow = +(
    250 +
    Math.sin(Date.now() / 7000) * 60 +
    (Math.random() * 40 - 20)
  ).toFixed(2); // m³/s
  const outflow = +(
    230 +
    Math.sin(Date.now() / 8000 + 0.8) * 55 +
    (Math.random() * 30 - 15)
  ).toFixed(2); // m³/s

  // Integrate storage using actual tick duration
  const stepSec = +selInterval.value / 1000;
  storage = Math.max(0, storage + (inflow - outflow) * stepSec);

  // Level follows storage (first-order response)
  const targetLevel = storage * levelPerM3;
  level = +(level + (targetLevel - level) * 0.05).toFixed(2);

  // Temperature slow random walk
  tempC = +(tempC + (Math.random() * 0.06 - 0.03)).toFixed(2);

  return {
    res_id: ++resId,
    timestamp: new Date().toLocaleTimeString(),
    water_level_m: +level.toFixed(2),
    inflow_rate_m3s: inflow,
    outflow_rate_m3s: outflow,
    storage_volume_m3: Math.round(storage),
    water_temp_c: tempC,
  };
}

// ===== Charts (1500x500 canvas, CSS controls size) =====
const levelCtx = document.getElementById("chartLevelStorage").getContext("2d");
const flowCtx = document.getElementById("chartFlow").getContext("2d");

const timeLabels = [];
const levelSeries = [];
const storageSeries = [];
const inflowSeries = [];
const outflowSeries = [];

const levelStorageChart = new Chart(levelCtx, {
  type: "line",
  data: {
    labels: timeLabels,
    datasets: [
      {
        label: "Water Level (m)",
        data: levelSeries,
        borderColor: "#6dd6ff",
        borderWidth: 2,
        tension: 0.45,
        pointRadius: 0,
        yAxisID: "yLevel",
      },
      {
        label: "Storage (m³)",
        data: storageSeries,
        borderColor: "#3ce18f",
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0,
        yAxisID: "yStorage",
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: { legend: { labels: { color: "#cfe2ff" } } },
    scales: {
      x: {
        ticks: { color: "#9bb0d1" },
        grid: { color: "rgba(255,255,255,.05)" },
      },
      yLevel: {
        position: "left",
        ticks: { color: "#9bb0d1" },
        grid: { color: "rgba(255,255,255,.05)" },
        title: { display: true, text: "m", color: "#9bb0d1" },
      },
      yStorage: {
        position: "right",
        ticks: { color: "#9bb0d1", callback: (v) => v / 1e6 + "M" },
        grid: { drawOnChartArea: false },
        title: { display: true, text: "m³", color: "#9bb0d1" },
      },
    },
  },
});

const flowChart = new Chart(flowCtx, {
  type: "line",
  data: {
    labels: timeLabels,
    datasets: [
      {
        label: "Inflow (m³/s)",
        data: inflowSeries,
        borderColor: "#2baaff",
        borderWidth: 2,
        tension: 0.45,
        pointRadius: 0,
      },
      {
        label: "Outflow (m³/s)",
        data: outflowSeries,
        borderColor: "#ffb84d",
        borderWidth: 2,
        tension: 0.45,
        pointRadius: 0,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: { legend: { labels: { color: "#cfe2ff" } } },
    scales: {
      x: {
        ticks: { color: "#9bb0d1" },
        grid: { color: "rgba(255,255,255,.05)" },
      },
      y: {
        ticks: { color: "#9bb0d1" },
        grid: { color: "rgba(255,255,255,.05)" },
      },
    },
  },
});

// ===== UI update & table append =====
function pushRow() {
  const s = sample();

  // KPIs
  kLevel.textContent = s.water_level_m;
  kIn.textContent = s.inflow_rate_m3s;
  kOut.textContent = s.outflow_rate_m3s;
  kStor.textContent = s.storage_volume_m3.toLocaleString();
  kTemp.textContent = s.water_temp_c;

  // Table (keep latest 20)
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${s.res_id}</td>
    <td>${s.timestamp}</td>
    <td>${s.water_level_m}</td>
    <td>${s.inflow_rate_m3s}</td>
    <td>${s.outflow_rate_m3s}</td>
    <td>${s.storage_volume_m3}</td>
    <td>${s.water_temp_c}</td>
  `;
  rows.prepend(tr);
  while (rows.children.length > 20) rows.lastChild.remove();

  // Charts (shared time axis)
  timeLabels.push(s.timestamp);
  levelSeries.push(s.water_level_m);
  storageSeries.push(s.storage_volume_m3);
  inflowSeries.push(s.inflow_rate_m3s);
  outflowSeries.push(s.outflow_rate_m3s);

  const MAX = 30;
  if (timeLabels.length > MAX) {
    timeLabels.shift();
    levelSeries.shift();
    storageSeries.shift();
    inflowSeries.shift();
    outflowSeries.shift();
  }

  levelStorageChart.update();
  flowChart.update();
}

// ===== Loop controls (fixed) =====
let timer = null;

function startLoop(delay = +selInterval.value) {
  stopLoop();
  timer = setInterval(pushRow, delay);
}
function stopLoop() {
  if (timer) clearInterval(timer);
  timer = null;
}

// Initial run
pushRow();
startLoop();

// Single, correct toggle handler
btnToggle.addEventListener("click", () => {
  if (timer) {
    stopLoop();
    btnToggle.textContent = "▶️ Resume";
  } else {
    startLoop();
    btnToggle.textContent = "⏸ Pause";
  }
});

// Speed change applies immediately if running
selInterval.addEventListener("change", () => {
  if (timer) startLoop(+selInterval.value);
});

// Clear table & charts
btnClear.addEventListener("click", () => {
  rows.innerHTML = "";
  timeLabels.length =
    levelSeries.length =
    storageSeries.length =
    inflowSeries.length =
    outflowSeries.length =
      0;
  levelStorageChart.update();
  flowChart.update();
});
