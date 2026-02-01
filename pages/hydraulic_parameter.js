// Theme (optional)
document.getElementById("theme-toggle").onclick = () => {
  document.body.classList.toggle("light");
};

// Elements
const rows = document.getElementById("rows");
const kHead = document.getElementById("kpi-head");
const kFlow = document.getElementById("kpi-flow");
const kEff = document.getElementById("kpi-eff");
const kPress = document.getElementById("kpi-press");
const btnToggle = document.getElementById("toggle-run");
const selInterval = document.getElementById("interval-ms");
const btnClear = document.getElementById("clear-table");

// Random sample
function sample() {
  return {
    head: +(12 + Math.random() * 3).toFixed(2),
    flow: +(2 + Math.random() * 1.6).toFixed(2),
    pressure: Math.round(100000 + Math.random() * 9000),
    vel: +(3 + Math.random() * 1.2).toFixed(2),
    loss: +(0.2 + Math.random() * 0.2).toFixed(2),
    eff: +(85 + Math.random() * 12).toFixed(2),
  };
}

// Chart
const ctx = document.getElementById("liveChart").getContext("2d");
const labels = [],
  headData = [],
  flowData = [],
  effData = [];
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Head (m)",
        data: headData,
        tension: 0.45,
        borderWidth: 1.5,
        borderColor: "#6dd6ff",
      },
      {
        label: "Flow (m³/s)",
        data: flowData,
        tension: 0.45,
        borderWidth: 1.5,
        borderColor: "#2baaff",
      },
      {
        label: "Efficiency (%)",
        data: effData,
        tension: 0.45,
        borderWidth: 1.5,
        borderColor: "#3ce18f",
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    elements: { point: { radius: 0 } },
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

function pushRow() {
  const t = new Date().toLocaleTimeString(),
    s = sample();
  // KPIs
  kHead.textContent = s.head;
  kFlow.textContent = s.flow;
  kEff.textContent = s.eff;
  kPress.textContent = s.pressure;
  // Table
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${t}</td><td>${s.head}</td><td>${s.flow}</td><td>${s.pressure}</td><td>${s.vel}</td><td>${s.loss}</td><td>${s.eff}</td>`;
  rows.prepend(tr);
  while (rows.children.length > 20) rows.lastChild.remove();
  // Chart
  labels.push(t);
  headData.push(s.head);
  flowData.push(s.flow);
  effData.push(s.eff);
  const N = 24;
  if (labels.length > N) {
    labels.shift();
    headData.shift();
    flowData.shift();
    effData.shift();
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
  labels.length = headData.length = flowData.length = effData.length = 0;
  chart.update();
};
