# GloChat

## Overview
GloChat is a modern real-time chatting application designed for instant messaging with high visual appeal. It uses a Django backend equipped with WebSockets for instant delivery, paired with a sleek React-based glassmorphism frontend.

## Features
- **Real-Time Chatting:** Uses WebSockets for zero-delay text transmission.
- **Modern User Authentication:** Secure JWT-based registration and login flows.
- **Vibrant Dark-Themed UI:** Features a custom neon/glassmorphism theme with fluid states and layouts.
- **Responsive Navigation:** Live user searching and chat switching on a single panel.
- **Friendly Alerts:** Input errors and registration outcomes are shown natively in the style of the application.

## Tech Stack
### Frontend
- React.js (Vite)
- Lucide React (Icons)
- Vanilla CSS (Glassmorphism layout)

### Backend
- Django
- Django REST Framework (DRF)
- Django Channels (WebSockets)
- Daphne (ASGI server)
- SQLite (Local DB)

## Architecture
- **API Flow:** The React client logs in or registers users through HTTPS REST requests. On successful login, a JWT token is stored.
- **WebSocket Protocol:** Once a user selects another recipient, the client connects to `ws://localhost:8000/ws/chat/<room_name>/`. The server groups the socket connections and saves message logs in SQLite.

## Folder Structure
```text
ChatApp/
├── .github/workflows/  - CI/CD Deployment configurations
├── client/            - React Vite frontend project
│   ├── src/           - UI components, style, entry points
│   └── vercel.json    - Vercel client deployment redirect settings
├── server/            - Django project settings
├── chat/              - Django chat app (Models, Views, WebSocket Consumer)
├── manage.py          - Command-line utility
└── venv/              - Local Python Virtualenv
```

## Setup and Commands

### Local Backend
1. Create virtualenv: `python -m venv venv`
2. Activate environment: `venv\Scripts\activate` (Windows)
3. Install packages: `pip install django channels channels-redis djangorestframework djangorestframework-simplejwt django-cors-headers Pillow daphne`
4. Migrate database: `python manage.py migrate`
5. Run server: `python manage.py runserver`

### Local Frontend
1. Install client: `cd client && npm install`
2. Run development dev: `npm run dev`

## Production Deployment Guide

### 1. Database (PostgreSQL)
- Create a PostgreSQL database on **Render**, **Railway**, or **Neon**.
- Copy the Connection Database URL.

### 2. Configure Django settings for Postgres
Install `dj-database-url` and `psycopg2-binary` to read database settings from environment:
```bash
pip install dj-database-url psycopg2-binary
```
Modify `server/settings.py` database settings to read from `DATABASE_URL`:
```python
import dj_database_url
DATABASES['default'] = dj_database_url.config(
    default='sqlite:///' + os.path.join(BASE_DIR, 'db.sqlite3')
)
```

### 3. Deploy Backend on Render
- Create a new **Web Service** on Render.
- Connect your GitHub repository.
- Build Command: `pip install -r requirements.txt && python manage.py migrate`
- Start Command: `daphne server.asgi:application --port $PORT --bind 0.0.0.0`
- Add Environment Variables:
  - `DATABASE_URL`: Your PostgreSQL URI
  - `SECRET_KEY`: Random string
  - `ALLOWED_HOSTS`: `*` or Render subdomain URL

