const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors()); // разрешаем запросы с других доменов
app.use(express.json());

// --- Раздача статичных файлов (index.html, main.js, styles.css) ---
app.use(express.static(path.join(__dirname, "public")));

// --- Хранилище для загружаемого файла ---
const upload = multer({ dest: "uploads/" });
let lastUploadedFile = null;

// --- 1. Список тем ---
app.get("/topics", (req, res) => {
  res.json({
    topics: [
      { id: 1, name: "Ипотека" },
      { id: 2, name: "Карты" },
      { id: 3, name: "Кредиты" },
      { id: 4, name: "Вклады" },
    ],
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
        stats: { positive: 120, neutral: 45, negative: 35 },
      },
      {
        id: 2,
        name: "Карты",
        stats: { positive: 200, neutral: 80, negative: 60 },
      },
    ],
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
      { date: "2024-01-03", positive: 12, neutral: 5, negative: 2 },
    ],
  });
});

// --- 4. Отзывы ---
app.get("/reviews", (req, res) => {
  res.json({
    filters: {
      topic_id: Number(req.query.topic_id),
      sentiment: req.query.sentiment || "all",
      period: { from: req.query.date_from, to: req.query.date_to },
    },
    pagination: { page: 1, limit: 10, total: 2 },
    reviews: [
      {
        id: 9321,
        date: "2024-01-03",
        sentiment: "negative",
        text: "Очень долго оформляется ипотека!",
        region: "Москва",
      },
      {
        id: 9322,
        date: "2024-01-03",
        sentiment: "negative",
        text: "Банк затянул с одобрением заявки.",
        region: "Санкт-Петербург",
      },
    ],
  });
});

// --- 5. Загрузка JSON файла ---
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Файл не найден" });
  }

  const targetPath = path.join(__dirname, "uploads", "uploaded.json");

  // Перезаписываем файл с фиксированным именем
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
