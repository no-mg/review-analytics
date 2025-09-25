const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors()); // разрешаем запросы с других доменов
app.use(express.json());

// --- Раздача статичных файлов (index.html, main.js, styles.css) ---
app.use(express.static(path.join(__dirname, "public")));

// --- 1. Список тем ---
app.get("/topics", (req, res) => {
  res.json({
    topics: [
      { id: 1, name: "Ипотека" },
      { id: 2, name: "Карты" },
      { id: 3, name: "Кредиты" },
      { id: 4, name: "Вклады" }
    ]
  });
});

// --- 2. Общая статистика ---
app.get("/topics/stats", (req, res) => {
  res.json({
    period: { from: req.query.date_from, to: req.query.date_to },
    topics: [
      {
        id: 1,
        name: "Ипотека",
        stats: { positive: 120, neutral: 45, negative: 35 }
      },
      {
        id: 2,
        name: "Карты",
        stats: { positive: 200, neutral: 80, negative: 60 }
      }
    ]
  });
});

// --- 3. Динамика по теме ---
app.get("/topics/:id/timeline", (req, res) => {
  const topicId = Number(req.params.id);
  res.json({
    topic: { id: topicId, name: topicId === 1 ? "Ипотека" : "Карты" },
    timeline: [
      { date: "2024-01-01", positive: 5, neutral: 2, negative: 1 },
      { date: "2024-01-02", positive: 8, neutral: 3, negative: 4 },
      { date: "2024-01-03", positive: 12, neutral: 5, negative: 2 }
    ]
  });
});

// --- 4. Отзывы ---
app.get("/reviews", (req, res) => {
  res.json({
    filters: {
      topic_id: Number(req.query.topic_id),
      sentiment: req.query.sentiment || "all",
      period: { from: req.query.date_from, to: req.query.date_to }
    },
    pagination: { page: 1, limit: 10, total: 2 },
    reviews: [
      {
        id: 9321,
        date: "2024-01-03",
        sentiment: "negative",
        text: "Очень долго оформляется ипотека!",
        region: "Москва"
      },
      {
        id: 9322,
        date: "2024-01-03",
        sentiment: "negative",
        text: "Банк затянул с одобрением заявки.",
        region: "Санкт-Петербург"
      }
    ]
  });
});

// --- Запуск сервера ---
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
