FROM node:20-alpine

WORKDIR /app

# Copiamos solo los archivos de dependencias para aprovechar la caché de Docker
COPY package*.json ./

RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# Comando para desarrollo con hot-reload
CMD ["npm", "run", "dev", "--", "--host"]
