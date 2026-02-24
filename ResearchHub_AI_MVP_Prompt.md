# ResearchHub AI — MVP Build Prompt

Build a working MVP of **ResearchHub AI**, an intelligent research paper management platform where researchers can search for papers, organize them into workspaces, and chat with an AI that answers questions based on their imported papers.

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** SQLite via SQLAlchemy
- **AI:** Groq API with `llama-3.3-70b-versatile`
- **Auth:** JWT with bcrypt password hashing

---

## Project Structure

```
ResearchHub-AI/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   └── routers/
│       ├── auth.py
│       ├── papers.py
│       ├── workspaces.py
│       └── chat.py
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── api.ts
    │   └── pages/
    │       ├── Login.tsx
    │       ├── Register.tsx
    │       ├── Dashboard.tsx
    │       ├── Search.tsx
    │       ├── Workspace.tsx
    │       └── Chat.tsx
    ├── package.json
    └── vite.config.ts
```

---

## Backend

### `requirements.txt`
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-dotenv==1.0.0
groq==0.4.1
httpx==0.25.2
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
sqlalchemy==2.0.23
```

### `.env`
```
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=any_long_random_string_here
```

### `database.py`
- SQLite database (`researchhub.db`)
- SQLAlchemy engine + SessionLocal + Base
- `get_db` dependency

### `models.py`
Define all ORM models in one file:

**User:** `id`, `email` (unique), `hashed_password`, `full_name`

**Workspace:** `id`, `name`, `description`, `user_id` (FK→User)

**Paper:** `id`, `title`, `authors` (string), `abstract`, `year`, `source_url`, `workspace_id` (FK→Workspace), `user_id` (FK→User)

**Message:** `id`, `workspace_id` (FK→Workspace), `role` (user/assistant), `content`, `created_at`

### `schemas.py`
Pydantic schemas for all models (request + response shapes).

### `auth.py`
- `create_access_token(email)` → signed JWT, 24hr expiry
- `get_current_user(token, db)` → FastAPI dependency, returns User or raises 401

---

### `routers/auth.py` — prefix `/auth`

**POST `/auth/register`** — `{ email, password, full_name }` → hash password, save user, return `{ message }`

**POST `/auth/login`** — `{ email, password }` → verify password, return `{ access_token, token_type, user: { id, email, full_name } }`

---

### `routers/workspaces.py` — prefix `/workspaces`
All routes require JWT auth.

**GET `/workspaces`** — return all workspaces for current user

**POST `/workspaces`** — `{ name, description }` → create and return workspace

**GET `/workspaces/{id}`** — return workspace + its papers

**DELETE `/workspaces/{id}`** — delete workspace

---

### `routers/papers.py` — prefix `/papers`
All routes require JWT auth.

**GET `/papers/search?query=...`**
- Call Semantic Scholar free API: `https://api.semanticscholar.org/graph/v1/paper/search?query={query}&limit=10&fields=title,authors,abstract,year,url`
- Return list of papers with metadata

**POST `/papers/import`** — `{ title, authors, abstract, year, source_url, workspace_id }` → save paper to DB, return paper

**GET `/papers/workspace/{workspace_id}`** — return all papers in workspace

**DELETE `/papers/{id}`** — delete paper

---

### `routers/chat.py` — prefix `/chat`
All routes require JWT auth.

**POST `/chat`** — `{ message, workspace_id }`
1. Fetch all papers in workspace from DB
2. Build a context string from all paper titles + abstracts
3. Fetch last 6 messages from DB for conversation history
4. Call Groq API:
   - System prompt: `"You are a research assistant. Answer questions based on these research papers:\n\n{context}"`
   - Include last 6 messages as conversation history
   - Append current user message
5. Save user message + AI response to Messages table
6. Return `{ response }`

**GET `/chat/history/{workspace_id}`** — return last 50 messages

**DELETE `/chat/history/{workspace_id}`** — clear all messages for workspace

---

### `main.py`
- Create FastAPI app
- Add CORS middleware allowing `http://localhost:5173`
- Include all 4 routers
- On startup: `Base.metadata.create_all(bind=engine)`

---

## Frontend

### `package.json` — key dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.0",
  "react-hot-toast": "^2.4.1"
}
```

### `api.ts`
- Axios instance with `baseURL: http://localhost:8000`
- Request interceptor: read token from `localStorage` and attach as `Authorization: Bearer {token}`
- Export typed functions for every API call (login, register, searchPapers, importPaper, getWorkspaces, createWorkspace, getWorkspacePapers, sendMessage, getChatHistory)

### `App.tsx`
React Router setup with these routes:
- `/` → redirect to `/dashboard` if logged in, else `/login`
- `/login` → LoginPage
- `/register` → RegisterPage
- `/dashboard` → DashboardPage (protected)
- `/search` → SearchPage (protected)
- `/workspace/:id` → WorkspacePage (protected)
- `/chat/:workspaceId` → ChatPage (protected)

Store `token` and `user` in `localStorage`. Protected routes check for token, redirect to `/login` if missing.

---

### Pages

**`Login.tsx`**
- Simple centered form: email + password fields
- On submit → POST `/auth/login` → save token + user to localStorage → redirect to `/dashboard`
- Link to Register

**`Register.tsx`**
- Form: full name, email, password
- On submit → POST `/auth/register` → redirect to `/login`
- Link to Login

**`Dashboard.tsx`**
- Top navbar with app name + logout button
- "My Workspaces" heading
- Grid of workspace cards (name, description, paper count)
- Each card links to `/workspace/{id}`
- "New Workspace" button → simple modal/inline form with name + description
- "Search Papers" link in nav

**`Search.tsx`**
- Search bar + Search button
- On search → GET `/papers/search?query=...`
- Results list: each showing title, authors, year, abstract (truncated)
- "Import" button on each result → dropdown to pick workspace → POST `/papers/import`
- Success toast on import

**`Workspace.tsx`** (route: `/workspace/:id`)
- Workspace name + description at top
- "Chat with AI about these papers" button → links to `/chat/{id}`
- List of imported papers (title, authors, year, abstract snippet)
- "Remove" button on each paper
- If no papers: show "Import papers from Search to get started"

**`Chat.tsx`** (route: `/chat/:workspaceId`)
- Header: workspace name + "Back to Workspace" link
- Message list: user messages right-aligned (blue), AI messages left-aligned (gray)
- Load conversation history on mount
- Input bar at bottom: text input + Send button
- On send → POST `/chat` → append both messages to UI
- Loading indicator while waiting for AI response
- "Clear History" button

---

## Design — Keep It Simple
- Dark background (`#0f172a`), white text, blue accents (`#3b82f6`)
- Tailwind utility classes only — no custom CSS files needed
- Readable, clean layout — no need for animations or complex UI patterns
- Mobile doesn't need to be perfect for MVP

---

## Run Instructions

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

- App: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`

---

## Key Notes for Implementation
- Keep all backend models in a single `models.py` — no need to split into separate files
- SQLite is fine — no PostgreSQL or Docker needed
- No vector embeddings needed for MVP — just pass all paper abstracts as plain text context to Groq
- No file upload needed for MVP — search + import from Semantic Scholar is sufficient
- No need for refresh tokens — a 24hr JWT is fine
- Semantic Scholar API requires no API key for basic search
- Make sure CORS is configured or the frontend will get blocked by the browser
