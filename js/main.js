// =================== THEME TOGGLE ===================
const themeBtn = document.getElementById("theme-toggle");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");
  themeBtn.textContent = themeBtn.textContent === "🌙" ? "☀️" : "🌙";
});

// =================== REALTIME GRAPH ===================
const ctx = document.getElementById("liveChart");

const liveChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Flow (m³/s)",
        data: [],
        borderColor: "#42b9ff",
        borderWidth: 3,
        tension: 0.4,
        fill: false,
      },
    ],
  },
  options: {
    responsive: true,
    animation: { duration: 0 },
    scales: {
      y: { beginAtZero: false, grid: { color: "rgba(255,255,255,0.05)" } },
      x: { grid: { color: "rgba(255,255,255,0.05)" } },
    },
  },
});

// =================== LIVE TABLE + GRAPH UPDATES ===================
const tbody = document.getElementById("data-body");

function addLiveData() {
  const now = new Date().toLocaleTimeString();

  const head = (12 + Math.random() * 2).toFixed(2);
  const flow = (3 + Math.random() * 1).toFixed(2);
  const pressure = (100000 + Math.random() * 8000).toFixed(0);
  const eff = (85 + Math.random() * 10).toFixed(2);

  // update table
  tbody.insertAdjacentHTML(
    "afterbegin",
    `
        <tr>
            <td>${now}</td>
            <td>${head}</td>
            <td>${flow}</td>
            <td>${pressure}</td>
            <td>${eff}</td>
        </tr>
    `,
  );

  if (tbody.children.length > 12) {
    tbody.removeChild(tbody.lastChild);
  }

  // update graph
  liveChart.data.labels.push(now);
  liveChart.data.datasets[0].data.push(flow);

  if (liveChart.data.labels.length > 20) {
    liveChart.data.labels.shift();
    liveChart.data.datasets[0].data.shift();
  }

  liveChart.update();
}

setInterval(addLiveData, 1500);
addLiveData();
