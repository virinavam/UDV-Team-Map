FROM node:20-alpine

# Рабочая директория
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --silent

# Копируем весь код
COPY . .

# Открываем порт Vite
EXPOSE 5173

# Запускаем dev-сервер Vite на 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host"]
