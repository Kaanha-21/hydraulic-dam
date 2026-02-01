// Theme toggle (optional)
const themeBtn = document.getElementById("theme-toggle");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeBtn.textContent = themeBtn.textContent.trim() === "🌙" ? "☀️" : "🌙";
  });
}

// Elements
const rows = document.getElementById("rows");
const kSpeed = document.getElementById("kpi-speed");
const kTorque = document.getElementById("kpi-torque");
const kVib = document.getElementById("kpi-vib");
const kTemp = document.getElementById("kpi-temp");
const kEff = document.getElementById("kpi-eff");
const btnToggle = document.getElementById("toggle-run");
const selInterval = document.getElementById("interval-ms");
const btnClear = document.getElementById("clear-table");

// ---------- Random but coherent mechanical model ----------
let baseSpeed = 600; // rpm nominal
let bearingT = 62; // °C start
let vib = 0.9; // mm/s start

function sample() {
  // speed oscillates around base with small noise
  const speed = +(
    baseSpeed +
    Math.sin(Date.now() / 6000) * 60 +
    (Math.random() * 20 - 10)
  ).toFixed(1);

  // torque correlates with speed (roughly) + noise
  const torque = +(
    22000 +
    (speed - 600) * 80 +
    (Math.random() * 2000 - 1000)
  ).toFixed(0); // N·m

  // vibration grows slightly with torque/speed + random
  vib = +Math.max(
    0.4,
    0.6 + (torque - 22000) / 30000 + Math.random() * 0.6,
  ).toFixed(2); // mm/s

  // temperature slow drift with torque load
  bearingT = +(
    bearingT +
    (torque - 23000) / 80000 +
    (Math.random() * 0.15 - 0.07)
  ).toFixed(2);
  bearingT = Math.min(95, Math.max(40, bearingT));

  // efficiency peaks near nominal speed
  const effPeak = 92.5;
  const eff = +(
    effPeak -
    0.0008 * Math.pow(speed - 600, 2) +
    (Math.random() * 0.6 - 0.3)
  ).toFixed(2);

  return {
    timestamp: new Date().toLocaleTimeString(),
    rotational_speed: speed,
    torque: torque,
    vibration: vib,
    bearing_temperature: bearingT,
    efficiency: Math.max(80, Math.min(97, eff)),
  };
}

// ---------- Chart (Speed & Torque dual-axis + Temp) ----------
const ctx = document.getElementById("mechChart").getContext("2d");
const labels = [],
  speedData = [],
  torqueData = [],
  tempData = [];

const mechChart = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Speed (rpm)",
        data: speedData,
        yAxisID: "yS",
        borderColor: "#6dd6ff",
        borderWidth: 1.5,
        tension: 0.45,
        pointRadius: 0,
      },
      {
        label: "Torque (N·m)",
        data: torqueData,
        yAxisID: "yT",
        borderColor: "#2baaff",
        borderWidth: 1.5,
        tension: 0.45,
        pointRadius: 0,
      },
      {
        label: "Bearing Temp (°C)",
        data: tempData,
        yAxisID: "yTemp",
        borderColor: "#ffb84d",
        borderWidth: 1.5,
        tension: 0.35,
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
      yS: {
        position: "left",
        ticks: { color: "#9bb0d1" },
        title: { display: true, text: "rpm", color: "#9bb0d1" },
        grid: { color: "rgba(255,255,255,.05)" },
      },
      yT: {
        position: "right",
        ticks: { color: "#9bb0d1" },
        title: { display: true, text: "N·m", color: "#9bb0d1" },
        grid: { drawOnChartArea: false },
      },
      yTemp: { position: "right", display: false }, // hidden overlay scale for temp
    },
  },
});

// ---------- UI update ----------
function pushRow() {
  const s = sample();

  // KPIs
  kSpeed.textContent = s.rotational_speed;
  kTorque.textContent = s.torque.toLocaleString();
  kVib.textContent = s.vibration;
  kTemp.textContent = s.bearing_temperature;
  kEff.textContent = s.efficiency;

  // Table (keep 20)
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${s.timestamp}</td>
    <td>${s.rotational_speed}</td>
    <td>${s.torque}</td>
    <td>${s.vibration}</td>
    <td>${s.bearing_temperature}</td>
    <td>${s.efficiency}</td>`;
  rows.prepend(tr);
  while (rows.children.length > 20) rows.lastChild.remove();

  // Chart rolling window
  labels.push(s.timestamp);
  speedData.push(s.rotational_speed);
  torqueData.push(s.torque);
  tempData.push(s.bearing_temperature);

  const MAX = 24;
  if (labels.length > MAX) {
    labels.shift();
    speedData.shift();
    torqueData.shift();
    tempData.shift();
  }
  mechChart.update();
}

// ---------- Loop controls ----------
let timer = null;
function startLoop(d = +selInterval.value) {
  stopLoop();
  timer = setInterval(pushRow, d);
}
function stopLoop() {
  if (timer) clearInterval(timer);
  timer = null;
}

pushRow();
startLoop();

btnToggle.addEventListener("click", () => {
  if (timer) {
    stopLoop();
    btnToggle.textContent = "▶️ Resume";
  } else {
    startLoop();
    btnToggle.textContent = "⏸ Pause";
  }
});
selInterval.addEventListener("change", () => {
  if (timer) startLoop(+selInterval.value);
});
document.getElementById("clear-table").addEventListener("click", () => {
  rows.innerHTML = "";
  labels.length = speedData.length = torqueData.length = tempData.length = 0;
  mechChart.update();
});
