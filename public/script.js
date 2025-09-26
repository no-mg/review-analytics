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

// Новый элемент для загрузки JSON
const jsonFileInput = document.getElementById("json-file-input");

// Данные из локального JSON
let localData = null;

let selectedTopics = [];

async function fetchData(url) {
  if (localData) {
    // Используем локальные данные вместо fetch
    return localData;
  }
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
  document.getElementById("start-date").valueAsDate = startDate;
  document.getElementById("end-date").valueAsDate = endDate;

  applyFiltersBtn.addEventListener("click", () => {
    if (selectedTopics.length === 0) {
      alert("Функция в разработке: выберите хотя бы одну тему и загрузите JSON!");
      return;
    }
    if (localData) {
      loadStatisticsFromJSON(selectedTopics, localData);
      selectedTopics.forEach((t) => {
        loadTrendsFromJSON(t, localData);
        loadReviewsFromJSON(t, localData);
      });
    } else {
      selectedTopics.forEach((t) => {
        loadStatisticsForMultiple(selectedTopics);
        loadTrends(t);
        loadReviews(t);
      });
    }
  });

  resetSelectionBtn.addEventListener("click", () => {
    selectedTopics = [];
    document.querySelectorAll(".topic-card").forEach((el) =>
      el.classList.remove("active")
    );
    resetSelectionBtn.classList.add("hidden");

    // Скрываем диаграмму
    statisticsPlaceholder.classList.remove("hidden");
    statisticsContent.classList.add("hidden");

    // Скрываем график
    trendsContent.classList.add("hidden");
    trendsPlaceholder.classList.remove("hidden");

    // Чистим отзывы
    reviewsContainer.innerHTML = "";

    // Уничтожаем графики
    if (sentimentChart) {
      sentimentChart.destroy();
      sentimentChart = null;
    }
    if (trendsChart) {
      trendsChart.destroy();
      trendsChart = null;
    }
  });

  chartTypeSelect.addEventListener("change", () => {
    if (selectedTopics.length > 0) {
      if (localData) {
        loadStatisticsFromJSON(selectedTopics, localData);
      } else {
        loadStatisticsForMultiple(selectedTopics);
      }
    }
  });

  // Обработка загрузки локального JSON
  jsonFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        localData = data; // сохраняем данные
        processLocalData(localData);
      } catch (err) {
        alert("Ошибка при чтении JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  });
});

// ======== Функции для работы с локальным JSON ========

function processLocalData(data) {
  if (!data.topics || !data.reviews) {
    alert("Некорректная структура JSON. Должны быть поля topics и reviews");
    return;
  }

  // Загружаем темы
  renderTopics(data.topics);

  // Выбираем первую тему по умолчанию
  if (data.topics.length > 0) {
    selectedTopics = [data.topics[0]];
    loadStatisticsFromJSON(selectedTopics, data);
    loadReviewsFromJSON(selectedTopics[0], data);
    loadTrendsFromJSON(selectedTopics[0], data);
  }
}

function loadStatisticsFromJSON(topics, data) {
  statisticsContent.classList.remove("hidden");
  statisticsPlaceholder.classList.add("hidden");

  const filtered = data.topics.filter((t) =>
    topics.find((sel) => sel.id === t.id)
  );
  renderMultiStatistics(filtered);
}

function loadReviewsFromJSON(topic, data) {
  const topicReviews = data.reviews.filter((r) => r.topic_id === topic.id);
  renderReviews(topicReviews);
}

function loadTrendsFromJSON(topic, data) {
  const timelineData = data.topics.find((t) => t.id === topic.id)?.timeline || [];
  if (!timelineData || timelineData.length === 0) {
    trendsContent.classList.add("hidden");
    trendsPlaceholder.classList.remove("hidden");
    if (trendsChart) {
      trendsChart.destroy();
      trendsChart = null;
    }
    return;
  }
  trendsContent.classList.remove("hidden");
  renderTrends(topic.name, timelineData);
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
        <i data-feather="file-text" class="mr-3"></i>
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
        statisticsPlaceholder.classList.remove("hidden");
        statisticsContent.classList.add("hidden");
        resetSelectionBtn.classList.add("hidden");

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
      } else {
        resetSelectionBtn.classList.remove("hidden");
        loadStatisticsForMultiple(selectedTopics);
        loadTrends(selectedTopics[0]);
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
      plugins: {
        legend: { display: false },
      },
    },
  });
}

async function loadTrends(topic) {
  trendsContent.classList.add("hidden");
  trendsError.classList.add("hidden");
  trendsPlaceholder.classList.add("hidden");
  trendsLoading.classList.remove("hidden");

  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  try {
    const data = await fetchData(
      `/topics/${topic.id}/timeline?date_from=${startDate}&date_to=${endDate}&group_by=day`
    );
    trendsLoading.classList.add("hidden");

    if (!data.timeline || data.timeline.length === 0) {
      trendsContent.classList.add("hidden");
      trendsPlaceholder.classList.remove("hidden");
      if (trendsChart) {
        trendsChart.destroy();
        trendsChart = null;
      }
      return;
    }

    trendsContent.classList.remove("hidden");
    renderTrends(topic.name, data.timeline);
  } catch {
    trendsLoading.classList.add("hidden");
    trendsError.classList.remove("hidden");
  }
}

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
        legend: { position: "top" },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
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
      reviewsContainer.innerHTML =
        `<p class="text-gray-500">Нет отзывов за выбранный период</p>`;
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
        <span class="text-sm text-gray-500">${review.date} | ${review.region || "Регион не указан"}</span>
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
