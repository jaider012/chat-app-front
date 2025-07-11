# Aplicación de Chat Segura

Esta es una aplicación de chat en tiempo real construida con React y TypeScript, diseñada para ofrecer comunicación segura con cifrado de extremo a extremo.

## Características

*   **Mensajería en Tiempo Real:** Envía y recibe mensajes instantáneamente.
*   **Autenticación de Usuario:** Sistema de inicio de sesión y registro seguro.
*   **Cifrado de Extremo a Extremo:** Tus conversaciones están protegidas con cifrado avanzado.
*   **Gestión de Conversaciones:** Visualiza y gestiona tus chats activos.
*   **Búsqueda de Usuarios:** Encuentra y conecta con otros usuarios.
*   **Indicadores de Estado:** Ve cuando otros usuarios están escribiendo.

## Tecnologías Utilizadas

*   **Frontend:** React, TypeScript, Vite
*   **Estilos:** Tailwind CSS
*   **Cifrado:** Web Crypto API, Double Ratchet Algorithm
*   **Comunicación en Tiempo Real:** WebSockets (a través de Socket.IO u otra librería similar)
*   **Gestión de Estado:** Context API (o similar)

## Configuración del Proyecto

Para configurar el proyecto en tu entorno local, sigue estos pasos:

1.  **Clona el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd chat-app-front
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    # o si usas yarn
    # yarn install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las variables necesarias, como la URL de tu servidor backend. Ejemplo:
    ```
    VITE_API_BASE_URL=http://localhost:3000/api
    VITE_WEBSOCKET_URL=ws://localhost:3000
    ```
    *(Asegúrate de reemplazar las URLs con las de tu backend real.)*

## Ejecutar la Aplicación

Para iniciar la aplicación en modo de desarrollo:

```bash
npm run dev
# o si usas yarn
# yarn dev
```

Esto iniciará el servidor de desarrollo y la aplicación estará disponible en `http://localhost:5173` (o el puerto que Vite asigne).

## Estructura del Proyecto

El proyecto sigue una estructura modular para facilitar el desarrollo y mantenimiento:

```
src/
├── assets/             # Recursos estáticos como imágenes
├── components/         # Componentes reutilizables de la UI
├── contexts/           # Contextos de React para gestión de estado global (Auth, Crypto, Socket, Theme)
├── crypto/             # Lógica de cifrado y gestión de claves
├── hooks/              # Hooks personalizados de React
├── pages/              # Páginas principales de la aplicación (Dashboard, Login, etc.)
├── services/           # Servicios para interactuar con la API backend
├── types/              # Definiciones de tipos TypeScript
├── utils/              # Funciones de utilidad y helpers
├── App.tsx             # Componente principal de la aplicación
├── main.tsx            # Punto de entrada de la aplicación
└── ...
```