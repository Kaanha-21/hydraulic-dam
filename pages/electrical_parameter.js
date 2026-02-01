document.getElementById("theme-toggle").onclick = () =>
  document.body.classList.toggle("light");

const rows = document.getElementById("rows");
const kV = document.getElementById("kpi-voltage");
const kI = document.getElementById("kpi-current");
const kP = document.getElementById("kpi-power");
const kPF = document.getElementById("kpi-pf");
const kF = document.getElementById("kpi-freq");
const btnToggle = document.getElementById("toggle-run");
const selInterval = document.getElementById("interval-ms");
const btnClear = document.getElementById("clear-table");

let recordId = 0;
function sample() {
  const V = Math.round(11000 + (Math.random() * 0.1 - 0.05) * 11000);
  const I = +(300 + Math.random() * 400).toFixed(1);
  const PF = +(0.88 + Math.random() * 0.11).toFixed(3);
  const F = +(50 + (Math.random() * 0.4 - 0.2)).toFixed(2);
  const P = +((1.732 * V * I * PF) / 1000).toFixed(1);
  return {
    record_id: ++recordId,
    generator_voltage_v: V,
    generator_current_a: I,
    power_output_kw: P,
    power_factor: PF,
    frequency_hz: F,
    timestamp: new Date().toLocaleTimeString(),
  };
}

// CHART (compact height handled by CSS)
const ctx = document.getElementById("liveElecChart").getContext("2d");
const labels = [],
  powerData = [],
  currentData = [];
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Power (kW)",
        data: powerData,
        yAxisID: "yP",
        borderColor: "#3ce18f",
        borderWidth: 1.5,
        tension: 0.45,
        pointRadius: 0,
      },
      {
        label: "Current (A)",
        data: currentData,
        yAxisID: "yI",
        borderColor: "#2baaff",
        borderWidth: 1.5,
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
      yP: {
        position: "left",
        ticks: { color: "#9bb0d1" },
        grid: { color: "rgba(255,255,255,.05)" },
        title: { display: true, text: "kW", color: "#9bb0d1" },
      },
      yI: {
        position: "right",
        ticks: { color: "#9bb0d1" },
        grid: { drawOnChartArea: false, color: "rgba(255,255,255,.05)" },
        title: { display: true, text: "A", color: "#9bb0d1" },
      },
    },
  },
});

function pushRow() {
  const s = sample();
  kV.textContent = s.generator_voltage_v.toLocaleString();
  kI.textContent = s.generator_current_a;
  kP.textContent = s.power_output_kw.toLocaleString();
  kPF.textContent = s.power_factor;
  kF.textContent = s.frequency_hz;

  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${s.record_id}</td><td>${s.generator_voltage_v}</td><td>${s.generator_current_a}</td><td>${s.power_output_kw}</td><td>${s.power_factor}</td><td>${s.frequency_hz}</td><td>${s.timestamp}</td>`;
  rows.prepend(tr);
  while (rows.children.length > 20) rows.lastChild.remove();

  labels.push(s.timestamp);
  powerData.push(s.power_output_kw);
  currentData.push(s.generator_current_a);
  const N = 24;
  if (labels.length > N) {
    labels.shift();
    powerData.shift();
    currentData.shift();
  }
  chart.update();
}

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
btnToggle.onclick = () => {
  if (timer) {
    stopLoop();
    btnToggle.textContent = "▶️ Resume";
  } else {
    startLoop();
    btnToggle.textContent = "⏸ Pause";
  }
};
selInterval.onchange = () => {
  if (timer) startLoop(+selInterval.value);
};
btnClear.onclick = () => {
  rows.innerHTML = "";
  labels.length = powerData.length = currentData.length = 0;
  chart.update();
};
