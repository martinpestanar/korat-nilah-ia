# Korat Flow Agencia - MVP

Este es el proyecto MVP para Korat Flow Agencia.

## 🚀 Instalación y Configuración

Sigue estos pasos para configurar el proyecto en una nueva computadora.

### 1. Prerrequisitos
- **Node.js**: Asegúrate de tener instalado Node.js (versión 16 o superior).
- **Git**: Necesitas Git para clonar el repositorio.

### 2. Clonar el repositorio
Abre una terminal y ejecuta:

```bash
git clone https://github.com/martingreen-pe/Korat_MVP.git
cd Korat_MVP
```

### 3. Instalar dependencias
Ejecuta el siguiente comando para instalar las librerías necesarias:

```bash
npm install
```

### 4. Configurar variables de entorno
Crea un archivo llamado `.env` en la raíz del proyecto (al mismo nivel que este README).
Añade la siguiente configuración (ajusta la URL si es necesario):

```env
# URL del backend (n8n webhooks)
VITE_API_URL="https://wh.martinwork.mooo.com/webhook"
```

> **Nota:** Este archivo contiene configuración sensible o local, por eso no se sube al repositorio.

### 5. Correr el proyecto
Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

El proyecto estará disponible en la URL que muestre la terminal (usualmente `http://localhost:5173`).
