# Persona AI

A full-stack AI persona application built with React, Django REST Framework, and MySQL.

## Architecture

```
personaAI/
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── backend/
    ├── apps/
    ├── config/
    ├── .env
    └── manage.py
```

## Technology Stack

### Frontend
- React 18
- Vite
- React Router DOM
- Framer Motion
- Axios
- Tailwind CSS
- Lucide React Icons
- Leaflet (maps)

### Backend
- Python 3.10+
- Django 4.2
- Django REST Framework 3.14
- SimpleJWT (authentication)
- MySQL (SQLite fallback)
- python-dotenv

## Features

- User authentication (signup/login)
- AI Persona creation and management
- Chat sessions with persona persistence
- Shared public personas
- Debate Room (autonomous AI debates)
- Live Voice Call (Web Speech API)
- AI Smart Writer
- Decision Helper
- Trip Planner with landmarks
- Game Zone (Tic-Tac-Toe)
- Dark/Light theme support
- Responsive design

## Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- MySQL (optional, SQLite used as fallback)

### Installation

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

Create `backend/.env`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=persona_ai
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_HOST=localhost
DB_PORT=3306
JWT_SECRET=your-jwt-secret-here
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=compound-beta
HEYGEN_API_KEY=your-heygen-api-key
PEXELS_API_KEY=your-pexels-api-key
HF_API_TOKEN=your-hf-token
REPLICATE_API_TOKEN=your-replicate-token
FAL_KEY=your-fal-key
DEEPGRAM_API_KEY=your-deepgram-api-key
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Note:** If MySQL credentials are not configured, the backend automatically falls back to SQLite.

### Database Migration

```bash
cd backend
python3 manage.py migrate
```

### Running the Application

Start the backend:
```bash
cd backend
python3 manage.py runserver 8787
```

Start the frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

Or run both simultaneously:
```bash
cd frontend
npm run dev:all
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8787

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (authenticated)

### Personas
- `POST /api/personas` - Create persona (authenticated)
- `GET /api/personas` - List user personas (authenticated)
- `GET /api/personas/{slug}` - Get public persona
- `DELETE /api/personas/{id}` - Delete persona (authenticated)

### Chat Sessions
- `POST /api/chat-sessions` - Create chat session (authenticated)
- `GET /api/chat-sessions` - List user chat sessions (authenticated)
- `GET /api/chat-sessions/{id}` - Get session with messages (authenticated)
- `POST /api/chat-sessions/{id}/messages` - Add message (authenticated)
- `DELETE /api/chat-sessions/{id}` - Delete session (authenticated)

### Core Services
- `GET /api/health` - Health check
- `GET /api2/ping` - Ping with Groq status
- `POST /api2/ask` - Groq AI proxy
- `POST /api/generate-video` - Video generation
- `GET /api/generate-video` - Video status
- `DELETE /api/generate-video` - Cancel video
- `POST /api/memorial-video` - Memorial video generation

## Database Schema

### Users (Custom User Model)
- id, email (unique), name, password, date_joined, last_login

### Personas
- id, slug (unique), user (FK), name, prompt, description, is_public, created_at, updated_at

### Chat Sessions
- id, user (FK), persona (FK, nullable), title, persona_prompt, session_type, metadata, created_at, updated_at

### Chat Messages
- id, session (FK), role, content, created_at

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
python3 manage.py runserver 8787
```

### Build Frontend
```bash
cd frontend
npm run build
```

### Run Tests
```bash
cd backend
python3 manage.py test
```

## License

MIT
