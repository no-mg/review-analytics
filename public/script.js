let sentimentChart = null;
let trendsChart = null;

const topicsContainer = document.getElementById("topics-container");
const topicsLoading = document.getElementById("topics-loading");
const topicsError = document.getElementById("topics-error");

const statisticsContent = document.getElementById("statistics-content");
const statisticsLoading = document.getElementById("statistics-loading");
const statisticsError = document.getElementById("statistics-error");
const statisticsPlaceholder = document.getElementById("statistics-placeholder");

const totalReviews = document.getElementById("total-reviews");
const positiveCount = document.getElementById("positive-count");
const positiveBar = document.getElementById("positive-bar");
const positivePercent = document.getElementById("positive-percent");
const neutralCount = document.getElementById("neutral-count");
const neutralBar = document.getElementById("neutral-bar");
const neutralPercent = document.getElementById("neutral-percent");
const negativeCount = document.getElementById("negative-count");
const negativeBar = document.getElementById("negative-bar");
const negativePercent = document.getElementById("negative-percent");

const trendsContent = document.getElementById("trends-content");
const trendsLoading = document.getElementById("trends-loading");
const trendsError = document.getElementById("trends-error");
const trendsPlaceholder = document.getElementById("trends-placeholder");

const applyFiltersBtn = document.getElementById("apply-filters");
const resetSelectionBtn = document.getElementById("reset-selection");
const chartTypeSelect = document.getElementById("chart-type");

const reviewsContainer = document.getElementById("reviews-container");
const reviewsLoading = document.getElementById("reviews-loading");
const reviewsError = document.getElementById("reviews-error");

const fileInput = document.getElementById("json-file-input");
const detachJsonBtn = document.getElementById("detach-json");
const downloadFileBtn = document.getElementById("download-btn"); // исправлено!

let selectedTopics = [];

// Универсальная загрузка данных с сервера
async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка сети: ${res.status}`);
  return await res.json();
}

document.addEventListener("DOMContentLoaded", () => {
  feather.replace();
  loadTopics();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 6);

  // формат даты дд.мм.гггг
  ["start-date", "end-date"].forEach((id, idx) => {
    const input = document.getElementById(id);
    const d = idx === 0 ? startDate : endDate;
    input.value = d.toLocaleDateString("ru-RU");
    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "").slice(0, 8);
      if (value.length >= 5) {
        e.target.value = `${value.slice(0, 2)}.${value.slice(
          2,
          4
        )}.${value.slice(4)}`;
      } else if (value.length >= 3) {
        e.target.value = `${value.slice(0, 2)}.${value.slice(2)}`;
      } else {
        e.target.value = value;
      }
    });
  });

  applyFiltersBtn.addEventListener("click", () => {
    if (selectedTopics.length === 0) {
      alert("Выберите хотя бы одну тему!");
      return;
    }
    alert("Функция фильтров в разработке");
    loadStatisticsForMultiple(selectedTopics);
    loadTrends(selectedTopics);
    selectedTopics.forEach((t) => loadReviews(t));
  });

  resetSelectionBtn.addEventListener("click", clearSelection);

  chartTypeSelect.addEventListener("change", () => {
    if (selectedTopics.length > 0) loadStatisticsForMultiple(selectedTopics);
  });

  fileInput.addEventListener("change", handleFileUpload);
  detachJsonBtn.addEventListener("click", detachJsonFile);
  downloadFileBtn.addEventListener("click", downloadJsonFile);
});

function clearSelection() {
  selectedTopics = [];
  document
    .querySelectorAll(".topic-card")
    .forEach((el) => el.classList.remove("active"));
  resetSelectionBtn.classList.add("hidden");

  statisticsPlaceholder.classList.remove("hidden");
  statisticsContent.classList.add("hidden");

  trendsContent.classList.add("hidden");
  trendsPlaceholder.classList.remove("hidden");

  reviewsContainer.innerHTML = "";

  if (sentimentChart) {
    sentimentChart.destroy();
    sentimentChart = null;
  }
  if (trendsChart) {
    trendsChart.destroy();
    trendsChart = null;
  }
}

async function loadTopics() {
  topicsLoading.classList.remove("hidden");
  topicsError.classList.add("hidden");
  topicsContainer.classList.add("hidden");

  try {
    const data = await fetchData("/topics");
    renderTopics(data.topics);
    topicsLoading.classList.add("hidden");
    topicsContainer.classList.remove("hidden");
  } catch {
    topicsLoading.classList.add("hidden");
    topicsError.classList.remove("hidden");
  }
}

function renderTopics(topics) {
  topicsContainer.innerHTML = "";

  topics.forEach((topic) => {
    const topicElement = document.createElement("div");
    topicElement.className = "topic-card button cursor-pointer";
    topicElement.innerHTML = `
      <div class="flex items-center">
        <i data-feather="file-text" class="mr-3 text-gray-100"></i>
        <span class="font-medium">${topic.name}</span>
      </div>
    `;

    topicElement.addEventListener("click", () => {
      if (selectedTopics.find((t) => t.id === topic.id)) {
        selectedTopics = selectedTopics.filter((t) => t.id !== topic.id);
        topicElement.classList.remove("active");
      } else {
        selectedTopics.push(topic);
        topicElement.classList.add("active");
      }

      if (selectedTopics.length === 0) {
        clearSelection();
      } else {
        resetSelectionBtn.classList.remove("hidden");
        loadStatisticsForMultiple(selectedTopics);
        loadTrends(selectedTopics);
        loadReviews(selectedTopics[0]);
      }
    });

    topicsContainer.appendChild(topicElement);
  });

  feather.replace();
}

async function loadStatisticsForMultiple(topics) {
  statisticsContent.classList.remove("hidden");
  statisticsError.classList.add("hidden");
  statisticsPlaceholder.classList.add("hidden");
  statisticsLoading.classList.remove("hidden");

  if (sentimentChart) sentimentChart.destroy();

  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  try {
    const data = await fetchData(
      `/topics/stats?date_from=${startDate}&date_to=${endDate}`
    );
    const filtered = data.topics.filter((t) =>
      topics.find((sel) => sel.id === t.id)
    );
    statisticsLoading.classList.add("hidden");
    renderMultiStatistics(filtered);
  } catch {
    statisticsLoading.classList.add("hidden");
    statisticsError.classList.remove("hidden");
  }
}

function renderMultiStatistics(topicsStats) {
  const total = topicsStats.reduce(
    (sum, t) => sum + t.stats.positive + t.stats.neutral + t.stats.negative,
    0
  );

  if (total === 0) {
    statisticsContent.classList.add("hidden");
    statisticsPlaceholder.classList.remove("hidden");
    if (sentimentChart) {
      sentimentChart.destroy();
      sentimentChart = null;
    }
    return;
  }

  const positive = topicsStats.reduce((sum, t) => sum + t.stats.positive, 0);
  const neutral = topicsStats.reduce((sum, t) => sum + t.stats.neutral, 0);
  const negative = topicsStats.reduce((sum, t) => sum + t.stats.negative, 0);

  totalReviews.textContent = total;
  positiveCount.textContent = positive;
  neutralCount.textContent = neutral;
  negativeCount.textContent = negative;

  const positivePct = Math.round((positive / total) * 100);
  const neutralPct = Math.round((neutral / total) * 100);
  const negativePct = Math.round((negative / total) * 100);

  positiveBar.style.width = `${positivePct}%`;
  positivePercent.textContent = `${positivePct}%`;
  neutralBar.style.width = `${neutralPct}%`;
  neutralPercent.textContent = `${neutralPct}%`;
  negativeBar.style.width = `${negativePct}%`;
  negativePercent.textContent = `${negativePct}%`;

  const chartType = chartTypeSelect.value;
  const ctx = document.getElementById("sentimentChart").getContext("2d");
  sentimentChart = new Chart(ctx, {
    type: chartType,
    data: {
      labels: ["Положительные", "Нейтральные", "Отрицательные"],
      datasets: [
        {
          data: [positive, neutral, negative],
          backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });
}

async function loadTrends(topics) {
  trendsContent.classList.add("hidden");
  trendsError.classList.add("hidden");
  trendsPlaceholder.classList.add("hidden");
  trendsLoading.classList.remove("hidden");

  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  try {
    const datasets = [];
    const labelsSet = new Set();

    for (const topic of topics) {
      const data = await fetchData(
        `/topics/${topic.id}/timeline?date_from=${startDate}&date_to=${endDate}&group_by=day`
      );

      if (data.timeline && data.timeline.length > 0) {
        data.timeline.forEach((p) => labelsSet.add(p.date));

        datasets.push({
          label: "Положительные",
          data: data.timeline.map((p) => p.positive),
          borderColor: "#10B981",
          backgroundColor: "#10B98133",
          fill: false,
        });
        datasets.push({
          label: "Нейтральные",
          data: data.timeline.map((p) => p.neutral),
          borderColor: "#F59E0B",
          backgroundColor: "#F59E0B33",
          fill: false,
        });
        datasets.push({
          label: "Отрицательные",
          data: data.timeline.map((p) => p.negative),
          borderColor: "#EF4444",
          backgroundColor: "#EF444433",
          fill: false,
        });
      }
    }

    const labels = Array.from(labelsSet).sort();

    if (datasets.length === 0) {
      trendsLoading.classList.add("hidden");
      trendsPlaceholder.classList.remove("hidden");
      if (trendsChart) {
        trendsChart.destroy();
        trendsChart = null;
      }
      return;
    }

    if (trendsChart) trendsChart.destroy();
    const ctx = document.getElementById("trendsChart").getContext("2d");
    trendsChart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              usePointStyle: true,
              generateLabels: (chart) => {
                return [
                  { text: "Положительные", fillStyle: "#10B981" },
                  { text: "Нейтральные", fillStyle: "#F59E0B" },
                  { text: "Отрицательные", fillStyle: "#EF4444" },
                ];
              },
            },
          },
          title: {
            display: true,
            text: `График тональности ${topics.length} ${
              topics.length === 1 ? "темы" : "тем"
            }`,
          },
        },
        scales: { y: { beginAtZero: true } },
      },
    });

    trendsLoading.classList.add("hidden");
    trendsContent.classList.remove("hidden");
  } catch {
    trendsLoading.classList.add("hidden");
    trendsError.classList.remove("hidden");
  }
}

async function loadReviews(topic) {
  reviewsContainer.innerHTML = "";
  reviewsLoading.classList.remove("hidden");
  reviewsError.classList.add("hidden");

  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  try {
    const data = await fetchData(
      `/reviews?topic_id=${topic.id}&date_from=${startDate}&date_to=${endDate}&page=1&limit=10`
    );
    reviewsLoading.classList.add("hidden");

    if (!data.reviews || data.reviews.length === 0) {
      reviewsContainer.innerHTML = `<p class="text-gray-500">Нет отзывов за выбранный период</p>`;
      return;
    }
    renderReviews(data.reviews);
  } catch {
    reviewsLoading.classList.add("hidden");
    reviewsError.classList.remove("hidden");
  }
}

function renderReviews(reviews) {
  reviewsContainer.innerHTML = "";
  reviews.forEach((review) => {
    const reviewEl = document.createElement("div");
    reviewEl.className = "p-4 mb-3 border rounded-lg bg-white shadow-sm";
    reviewEl.innerHTML = `
      <div class="flex justify-between mb-2">
        <span class="text-sm text-gray-500">${review.date} | ${
      review.region || "Регион не указан"
    }</span>
        <span class="px-2 py-1 rounded text-xs ${
          review.sentiment === "positive"
            ? "bg-green-100 text-green-700"
            : review.sentiment === "neutral"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
        }">${review.sentiment}</span>
      </div>
      <p class="text-gray-800">${review.text}</p>
    `;
    reviewsContainer.appendChild(reviewEl);
  });
}

// ===== Работа с JSON-файлом (только загрузка/скачивание) =====

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((res) => {
      if (!res.ok) throw new Error("Ошибка загрузки файла");
      detachJsonBtn.classList.remove("hidden");
      downloadFileBtn.classList.remove("hidden");
    })
    .catch(() => alert("Ошибка при отправке JSON файла"));
}

function detachJsonFile() {
  fileInput.value = "";
  detachJsonBtn.classList.add("hidden");
  downloadFileBtn.classList.add("hidden");
}

function downloadJsonFile() {
  window.location.href = "/download";
}
