/**
 * Утилиты для работы с фото сотрудников
 */

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api";

/**
 * Кеш для blob URL фотографий
 * Ключ: оригинальный photoUrl, Значение: blob URL
 */
const photoCache = new Map<string, string>();

/**
 * Очищает кеш фотографий
 */
export const clearPhotoCache = () => {
  // Отзываем все blob URL перед очисткой кеша
  photoCache.forEach((blobUrl) => {
    if (blobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(blobUrl);
    }
  });
  photoCache.clear();
};

/**
 * Очищает конкретную фотографию из кеша
 */
export const clearPhotoFromCache = (photoUrl: string) => {
  const cached = photoCache.get(photoUrl);
  if (cached && cached.startsWith("blob:")) {
    URL.revokeObjectURL(cached);
  }
  photoCache.delete(photoUrl);
};

/**
 * Формирует полный URL для фото сотрудника
 * @param photoUrl - URL фото (может быть относительным путем, полным URL или null/undefined)
 * @returns Полный URL для фото или null, если фото нет
 */
export const getPhotoUrl = (
  photoUrl: string | null | undefined
): string | undefined => {
  if (!photoUrl) {
    return undefined;
  }

  // Если это уже полный URL (начинается с http:// или https://), возвращаем как есть
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }

  // Если это data URL (base64), возвращаем как есть
  if (photoUrl.startsWith("data:")) {
    return photoUrl;
  }

  // Если это placeholder, возвращаем как есть
  if (photoUrl === "/placeholder.svg" || photoUrl.includes("placeholder")) {
    return photoUrl;
  }

  // Если это относительный путь, добавляем базовый URL API
  // Если путь начинается с /api/, используем базовый URL без /api
  if (photoUrl.startsWith("/api/")) {
    // Убираем /api из конца API_BASE_URL, если он есть
    const baseUrl = API_BASE_URL.replace(/\/api$/, "");
    // Путь уже содержит /api/, просто добавляем к baseUrl
    return `${baseUrl}${photoUrl}`;
  }

  // Если путь начинается с api/ (без начального слэша), добавляем базовый URL без /api
  if (photoUrl.startsWith("api/")) {
    const baseUrl = API_BASE_URL.replace(/\/api$/, "");
    return `${baseUrl}/${photoUrl}`;
  }

  // В остальных случаях добавляем базовый URL API
  const cleanPath = photoUrl.startsWith("/") ? photoUrl.slice(1) : photoUrl;
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Загружает фото с токеном авторизации и возвращает blob URL
 * @param photoUrl - URL фото (может быть относительным путем или полным URL)
 * @returns Promise с blob URL или undefined, если загрузка не удалась
 */
export const loadPhotoWithAuth = async (
  photoUrl: string | null | undefined
): Promise<string | undefined> => {
  if (!photoUrl) {
    return undefined;
  }

  // Если это data URL или placeholder, возвращаем как есть
  if (
    photoUrl.startsWith("data:") ||
    photoUrl === "/placeholder.svg" ||
    photoUrl.includes("placeholder")
  ) {
    return photoUrl;
  }

  // Проверяем кеш перед загрузкой
  const cachedBlobUrl = photoCache.get(photoUrl);
  if (cachedBlobUrl) {
    return cachedBlobUrl;
  }

  try {
    // Формируем полный URL
    const fullUrl = getPhotoUrl(photoUrl);
    if (!fullUrl) {
      return undefined;
    }

    // Получаем токен авторизации
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("Токен авторизации не найден для загрузки фото");
      return fullUrl; // Возвращаем URL без токена, пусть браузер попробует загрузить
    }

    // 1️⃣ Получаем файл через fetch с Authorization
    const res = await fetch(fullUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn(`Не удалось загрузить фото: ${res.status}`);
      return undefined;
    }

    // 2️⃣ Конвертируем в blob
    const blob = await res.blob();

    // 3️⃣ Показываем через ObjectURL
    const imageUrl = URL.createObjectURL(blob);

    // Сохраняем в кеш
    photoCache.set(photoUrl, imageUrl);

    return imageUrl;
  } catch (error) {
    console.error("Ошибка при загрузке фото с авторизацией:", error);
    // В случае ошибки возвращаем исходный URL
    return getPhotoUrl(photoUrl);
  }
};
