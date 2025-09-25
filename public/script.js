// Chart instances
let sentimentChart = null;
let trendsChart = null;

// DOM elements
const topicsContainer = document.getElementById("topics-container");
const topicsLoading = document.getElementById("topics-loading");
const topicsError = document.getElementById("topics-error");

const statisticsTitle = document.getElementById("statistics-title");
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

// DOM для отзывов
const reviewsContainer = document.getElementById("reviews-container");
const reviewsLoading = document.getElementById("reviews-loading");
const reviewsError = document.getElementById("reviews-error");

// Current selected topic
let currentTopic = null;

// Format date to yyyy-mm-dd (для API)
function formatApiDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${y}-${m}-${d}`;
}

// Format date to dd.mm.yyyy (для UI)
function formatUiDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

// Универсальная функция запроса
async function fetchData(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ошибка сети: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
  feather.replace();
  loadTopics();

  // Set default dates (last 6 months)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 6);

  document.getElementById("start-date").value = formatUiDate(startDate);
  document.getElementById("end-date").value = formatUiDate(endDate);

  // Apply filters button click handler
  applyFiltersBtn.addEventListener("click", function () {
    if (!currentTopic) {
      alert("Выберите тему!");
      return;
    }
    loadStatistics(currentTopic);
    loadTrends(currentTopic);
    loadReviews(currentTopic);
  });
});

// Load topics list
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

// Render topics list
function renderTopics(topics) {
  topicsContainer.innerHTML = "";

  topics.forEach((topic) => {
    const topicElement = document.createElement("div");
    topicElement.className = "topic-card cursor-pointer";
    topicElement.innerHTML = `
      <div class="flex items-center">
        <i data-feather="file-text" class="mr-3 text-gray-500"></i>
        <span class="font-medium text-gray-700">${topic.name}</span>
      </div>
    `;

    topicElement.addEventListener("click", () => {
      document.querySelectorAll(".topic-card").forEach((el) => el.classList.remove("active"));
      topicElement.classList.add("active");

      currentTopic = topic;
      loadStatistics(topic);
      loadTrends(topic);
      loadReviews(topic);
    });

    topicsContainer.appendChild(topicElement);
  });

  feather.replace();
}

// Load statistics for selected topic
async function loadStatistics(topic) {
  statisticsContent.classList.add("hidden");
  statisticsError.classList.add("hidden");
  statisticsPlaceholder.classList.add("hidden");
  statisticsLoading.classList.remove("hidden");

  if (sentimentChart) sentimentChart.destroy();

  statisticsTitle.innerHTML = `<i data-feather="pie-chart" class="mr-2 text-blue-500"></i> Статистика: ${topic.name}`;

  const startDate = document.getElementById("start-date").value.split(".").reverse().join("-");
  const endDate = document.getElementById("end-date").value.split(".").reverse().join("-");

  try {
    const data = await fetchData(`/topics/stats?date_from=${startDate}&date_to=${endDate}`);
    const topicStats = data.topics.find((t) => t.id === topic.id);

    if (!topicStats) throw new Error("Нет данных по теме");

    statisticsLoading.classList.add("hidden");
    statisticsContent.classList.remove("hidden");
    renderStatistics(topicStats.stats);
  } catch {
    statisticsLoading.classList.add("hidden");
    statisticsError.classList.remove("hidden");
  }
}

// Render statistics
function renderStatistics(stats) {
  const total = stats.positive + stats.neutral + stats.negative;
  const positive = stats.positive;
  const neutral = stats.neutral;
  const negative = stats.negative;

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

  const ctx = document.getElementById("sentimentChart").getContext("2d");
  sentimentChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Положительные", "Нейтральные", "Отрицательные"],
      datasets: [{
        data: [positive, neutral, negative],
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
        hoverBackgroundColor: ["#22C55E", "#FBBF24", "#ff2949"],
        borderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { usePointStyle: true, padding: 20 } },
      }
    }
  });
}

// Load trends data
async function loadTrends(topic) {
  trendsContent.classList.add("hidden");
  trendsError.classList.add("hidden");
  trendsPlaceholder.classList.add("hidden");
  trendsLoading.classList.remove("hidden");

  const startDate = document.getElementById("start-date").value.split(".").reverse().join("-");
  const endDate = document.getElementById("end-date").value.split(".").reverse().join("-");

  try {
    const data = await fetchData(`/topics/${topic.id}/timeline?date_from=${startDate}&date_to=${endDate}&group_by=day`);
    trendsLoading.classList.add("hidden");
    trendsContent.classList.remove("hidden");
    renderTrends(topic.name, data.timeline);
  } catch {
    trendsLoading.classList.add("hidden");
    trendsError.classList.remove("hidden");
  }
}

// Render trends chart
function renderTrends(topicName, timeline) {
  if (trendsChart) trendsChart.destroy();

  const ctx = document.getElementById("trendsChart").getContext("2d");

  trendsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: timeline.map((t) => t.date),
      datasets: [
        {
          label: "Положительные",
          data: timeline.map((t) => t.positive),
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          fill: true,
        },
        {
          label: "Нейтральные",
          data: timeline.map((t) => t.neutral),
          borderColor: "#F59E0B",
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          fill: true,
        },
        {
          label: "Отрицательные",
          data: timeline.map((t) => t.negative),
          borderColor: "#EF4444",
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `График динамики тональности по теме "${topicName}"`,
        },
        legend: { position: "top" },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

// Load reviews
async function loadReviews(topic) {
  reviewsContainer.innerHTML = "";
  reviewsLoading.classList.remove("hidden");
  reviewsError.classList.add("hidden");

  const startDate = document.getElementById("start-date").value.split(".").reverse().join("-");
  const endDate = document.getElementById("end-date").value.split(".").reverse().join("-");

  try {
    const data = await fetchData(`/reviews?topic_id=${topic.id}&date_from=${startDate}&date_to=${endDate}&page=1&limit=10`);
    reviewsLoading.classList.add("hidden");
    renderReviews(data.reviews);
  } catch {
    reviewsLoading.classList.add("hidden");
    reviewsError.classList.remove("hidden");
  }
}

// Render reviews
function renderReviews(reviews) {
  if (!reviews || reviews.length === 0) {
    reviewsContainer.innerHTML = `<p class="text-gray-500">Нет отзывов за выбранный период</p>`;
    return;
  }

  reviews.forEach((review) => {
    const reviewEl = document.createElement("div");
    reviewEl.className = "p-4 mb-3 border rounded-lg bg-white shadow-sm";
    reviewEl.innerHTML = `
      <div class="flex justify-between mb-2">
        <span class="text-sm text-gray-500">${review.date} | ${review.region || "Регион не указан"}</span>
        <span class="px-2 py-1 rounded text-xs ${
          review.sentiment === "positive" ? "bg-green-100 text-green-700" :
          review.sentiment === "neutral" ? "bg-yellow-100 text-yellow-700" :
          "bg-red-100 text-red-700"
        }">${review.sentiment}</span>
      </div>
      <p class="text-gray-800">${review.text}</p>
    `;
    reviewsContainer.appendChild(reviewEl);
  });
}
