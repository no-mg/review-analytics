const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Раздача статичных файлов (index.html, script.js, styles.css) ---
app.use(express.static(path.join(__dirname, "public")));

// --- Хранилище загружаемых файлов ---
const upload = multer({ dest: "uploads/" });
let lastUploadedFile = null;

// --- Список тем ---
const topics = [
  { id: 1, name: "Ипотека" },
  { id: 2, name: "Карты" },
  { id: 3, name: "Кредиты" },
  { id: 4, name: "Вклады" },
];

// --- 1. Список тем ---
app.get("/topics", (req, res) => {
  res.json({ topics });
});

// --- 2. Общая статистика по темам ---
app.get("/topics/stats", (req, res) => {
  res.json({
    period: { from: req.query.date_from, to: req.query.date_to },
    topics: topics.map((t) => ({
      id: t.id,
      name: t.name,
      stats: {
        positive: Math.floor(Math.random() * 200),
        neutral: Math.floor(Math.random() * 100),
        negative: Math.floor(Math.random() * 50),
      },
    })),
  });
});

// --- 3. Динамика по конкретной теме ---
app.get("/topics/:id/timeline", (req, res) => {
  const topicId = Number(req.params.id);
  const topic = topics.find((t) => t.id === topicId);

  if (!topic) {
    return res.status(404).json({ error: "Тема не найдена" });
  }

  // Генерация тестовых данных
  const timeline = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    timeline.push({
      date: d.toISOString().split("T")[0],
      positive: Math.floor(Math.random() * 20),
      neutral: Math.floor(Math.random() * 10),
      negative: Math.floor(Math.random() * 8),
    });
  }

  res.json({ topic, timeline });
});

// --- 4. Отзывы ---
app.get("/reviews", (req, res) => {
  const topicId = Number(req.query.topic_id);
  const topic = topics.find((t) => t.id === topicId);

  if (!topic) {
    return res.json({ reviews: [] });
  }

  const reviews = [
    {
      id: 1001,
      date: "2024-01-10",
      sentiment: "positive",
      text: `Очень понравился продукт "${topic.name}"!`,
      region: "Москва",
    },
    {
      id: 1002,
      date: "2024-01-12",
      sentiment: "negative",
      text: `Недоволен сервисом по теме "${topic.name}".`,
      region: "Санкт-Петербург",
    },
  ];

  res.json({
    filters: {
      topic_id: topicId,
      sentiment: req.query.sentiment || "all",
      period: { from: req.query.date_from, to: req.query.date_to },
    },
    pagination: { page: 1, limit: 10, total: reviews.length },
    reviews,
  });
});

// --- 5. Загрузка JSON файла ---
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Файл не найден" });
  }

  const targetPath = path.join(__dirname, "uploads", "uploaded.json");

  fs.rename(req.file.path, targetPath, (err) => {
    if (err) {
      console.error("Ошибка сохранения файла:", err);
      return res.status(500).json({ error: "Ошибка при сохранении файла" });
    }

    lastUploadedFile = targetPath;
    res.json({ message: "Файл успешно загружен" });
  });
});

// --- 6. Скачивание JSON файла ---
app.get("/download", (req, res) => {
  if (!lastUploadedFile || !fs.existsSync(lastUploadedFile)) {
    return res.status(404).json({ error: "Файл не найден" });
  }
  res.download(lastUploadedFile, "result.json");
});

// --- Запуск сервера ---
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
