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
const kTotal = document.getElementById("kpi-total");
const kOK = document.getElementById("kpi-ok");
const kUP = document.getElementById("kpi-up");
const kDUE = document.getElementById("kpi-due");
const kHrs = document.getElementById("kpi-hours");
const btnToggle = document.getElementById("toggle-run");
const selInterval = document.getElementById("interval-ms");
const btnClear = document.getElementById("clear-table");

// Seed turbines
const plants = ["Plant A", "Plant B", "Plant C"];
const turbines = Array.from({ length: 8 }).map((_, i) => ({
  record_id: i + 1,
  turbine_name: `TURB-${(i + 1).toString().padStart(2, "0")}`,
  plant_name: plants[i % plants.length],
  // next maintenance within 2–30 days randomly
  upcoming_maintenance_date: new Date(
    Date.now() + (2 + Math.floor(Math.random() * 29)) * 24 * 3600 * 1000,
  ),
  operating_hours: 1000 + Math.floor(Math.random() * 4000),
  maintenance_status: "OK",
}));

// Status calc
function statusOf(daysLeft) {
  if (daysLeft <= 3) return "DUE";
  if (daysLeft < 10) return "UPCOMING";
  return "OK";
}
function badge(status) {
  if (status === "DUE") return '<span class="badge due">Due</span>';
  if (status === "UPCOMING") return '<span class="badge warn">Upcoming</span>';
  return '<span class="badge ok">OK</span>';
}

// Update one tick: add hours and maybe bring dates closer
function tick() {
  const now = new Date();
  for (const t of turbines) {
    // increment operating hours slightly each tick
    t.operating_hours += +(Math.random() * 0.08 + 0.02).toFixed(2); // ~0.02–0.10 h per tick
    const daysLeft = Math.ceil(
      (t.upcoming_maintenance_date - now) / (24 * 3600 * 1000),
    );
    t.maintenance_status = statusOf(daysLeft);
  }
}

// Render table (latest state)
function renderTable() {
  rows.innerHTML = "";
  const now = new Date();
  const sorted = [...turbines].sort((a, b) => {
    const da = a.upcoming_maintenance_date - now;
    const db = b.upcoming_maintenance_date - now;
    return da - db; // soonest first
  });
  for (const t of sorted) {
    const daysLeft = Math.ceil(
      (t.upcoming_maintenance_date - now) / (24 * 3600 * 1000),
    );
    const dateStr = t.upcoming_maintenance_date.toISOString().slice(0, 10);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.record_id}</td>
      <td>${t.turbine_name}</td>
      <td>${t.plant_name}</td>
      <td>${dateStr}</td>
      <td>${daysLeft}</td>
      <td>${Math.round(t.operating_hours).toLocaleString()}</td>
      <td>${badge(t.maintenance_status)}</td>
    `;
    rows.appendChild(tr);
  }
}

// KPIs
function renderKPI() {
  const now = new Date();
  let ok = 0,
    up = 0,
    due = 0,
    hrs = 0;
  for (const t of turbines) {
    const daysLeft = Math.ceil(
      (t.upcoming_maintenance_date - now) / (24 * 3600 * 1000),
    );
    const st = statusOf(daysLeft);
    if (st === "OK") ok++;
    else if (st === "UPCOMING") up++;
    else due++;
    hrs += t.operating_hours;
  }
  kTotal.textContent = turbines.length;
  kOK.textContent = ok;
  kUP.textContent = up;
  kDUE.textContent = due;
  kHrs.textContent = Math.round(hrs).toLocaleString();
}

// Donut chart
const donutCtx = document.getElementById("donutChart").getContext("2d");
const donutData = {
  labels: ["OK", "Upcoming", "Due"],
  datasets: [{ data: [0, 0, 0] }],
};
const donut = new Chart(donutCtx, {
  type: "doughnut",
  data: donutData,
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: { labels: { color: "#cfe2ff" } },
    },
  },
});
function updateDonut() {
  const now = new Date();
  let ok = 0,
    up = 0,
    due = 0;
  for (const t of turbines) {
    const daysLeft = Math.ceil(
      (t.upcoming_maintenance_date - now) / (24 * 3600 * 1000),
    );
    const st = statusOf(daysLeft);
    if (st === "OK") ok++;
    else if (st === "UPCOMING") up++;
    else due++;
  }
  donut.data.datasets[0].data = [ok, up, due];
  donut.update();
}

// Loop control
function step() {
  tick();
  renderKPI();
  renderTable();
  updateDonut();
}

let timer = null;
function startLoop(d = +selInterval.value) {
  stopLoop();
  timer = setInterval(step, d);
}
function stopLoop() {
  if (timer) clearInterval(timer);
  timer = null;
}

// Init
step();
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
btnClear.addEventListener("click", () => {
  rows.innerHTML = "";
});
