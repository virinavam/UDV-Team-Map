FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json для установки зависимостей (node_modules будет создан на этапе сборки)
COPY package.json package-lock.json* ./

# Устанавливаем зависимости. Если package-lock.json нет - команда fallbacks на npm install
RUN npm ci --silent || npm install --silent

# Копируем остальной код (это нужно для сборки node_modules в образе)
COPY . .

# Открываем порт dev-сервера Vite (по-умолчанию 5173)
EXPOSE 5173

# В режиме разработки запускать Vite (hot reload). В production вы можете запускать сборку `npm run build`.
CMD ["npm", "run", "dev"]

