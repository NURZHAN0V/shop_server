import compression from 'compression';

/** Сжатие ответов (уровень 6), с учётом x-no-compression. */
export const compressionMiddleware = compression({
  level: 6, // Уровень сжатия (1-9, 6 оптимально)
  filter: (req, res) => {
    // Не сжимаем если клиент не поддерживает
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Используем стандартный фильтр compression
    return compression.filter(req, res);
  },
});