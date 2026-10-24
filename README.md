# TaskFlow | Collaborative Project Management Tool

TaskFlow is a modern, full-stack collaborative project management web application inspired by Trello and Asana. It provides teams with real-time Kanban boards, task assignment, chronological discussions, role-based authorization, and instant live notifications powered by Socket.IO.

---

## 🌟 Key Features

* **Authentication & Authorization**: Secure JWT-based authentication with bcrypt password hashing, session validation (`/api/auth/me`), and route guards.
* **Workspace & Project Management**: Create projects, manage team members, assign project ownership, and track overall progress metrics.
* **Interactive Kanban Boards**: Organize tasks across "To Do", "In Progress", and "Completed" columns with priority badges, assignees, and due dates.
* **Task Collaboration & Comments**: Real-time task discussion threads with chronological ordering, user avatars, and author/owner moderation controls.
* **Live Notifications & Socket.IO**: Real-time event notifications for task assignments, status changes, new comments, and project invitations with an unread badge counter.
* **Zero Mock Data**: 100% backed by persistent MongoDB collections with cascading deletion rules.
* **Modern Responsive UI**: Dark-mode glassmorphic interface built with Tailwind CSS, Lucide icons, and micro-interactions.

---

## 🛠️ Technology Stack

### Frontend
* **Framework**: React 19 with Vite
* **Styling**: Tailwind CSS v4 (Vanilla CSS architecture)
* **Icons**: Lucide React
* **Routing**: React Router DOM v7
* **Real-time Client**: Socket.IO Client (`socket.io-client`)
* **HTTP Client**: Axios

### Backend
* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js
* **Database**: MongoDB with Mongoose ODM
* **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
* **Real-time Server**: Socket.IO
* **Logging & CORS**: Morgan & CORS

---

## 📁 Repository Structure

```text
CodeAlpha_ProjectManagementTool/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment variables & MongoDB connection
│   │   ├── controllers/     # Express controllers (auth, project, comment, notification)
│   │   ├── middleware/      # JWT auth guard & centralized error handler
│   │   ├── models/          # Mongoose models (User, Project, Task, Comment, Notification)
│   │   ├── routes/          # REST route handlers
│   │   ├── services/        # Business logic & JWT token generation
│   │   ├── socket.js        # Socket.IO rooms & real-time notification engine
│   │   ├── app.js           # Express app configuration & middleware
│   │   └── server.js        # HTTP server initialization with Socket.IO
│   ├── .env                 # Backend environment configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, NotificationBell, KanbanBoard, Modals
│   │   ├── context/         # AuthContext (login, register, logout, session)
│   │   ├── pages/           # Landing, Login, Register, Dashboard
│   │   ├── services/        # Axios API client & Socket.IO connection manager
│   │   ├── App.jsx          # Application routes and protected route wrapper
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Environment Variables Configuration

### Backend Configuration (`backend/.env`)
Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/project_management_db
JWT_SECRET=your_jwt_secret_key_taskflow_secure_2026
JWT_EXPIRE=7d
```

### Frontend Configuration (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🚀 Installation & Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [MongoDB](https://www.mongodb.com/) running locally on port `27017` (or MongoDB Atlas connection string)

### 1. Clone the repository
```bash
git clone https://github.com/Avinash-chande/codeAlpha_ProjectManagementTool.git
cd codeAlpha_ProjectManagementTool
```

### 2. Setup & Run the Backend
```bash
cd backend
npm install
npm run dev
```
*The backend API will run on `http://localhost:5000` with WebSocket support.*

### 3. Setup & Run the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*The Vite development server will run on `http://localhost:5173`.*

---

## 📡 Main REST API Endpoints

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account | Public |
| `POST` | `/api/auth/login` | Log in and receive JWT token | Public |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Private |

### 2. Projects (`/api/projects`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/projects` | List all user projects with metrics | Private |
| `POST` | `/api/projects` | Create a new project | Private |
| `GET` | `/api/projects/:id` | Get project details & Kanban tasks | Member/Owner |
| `PUT` | `/api/projects/:id` | Update project name or description | Owner only |
| `DELETE` | `/api/projects/:id` | Delete project and cascade tasks/comments | Owner only |
| `POST` | `/api/projects/:id/members` | Add registered user as member | Owner only |
| `DELETE` | `/api/projects/:id/members/:memberId` | Remove member from project | Owner only |

### 3. Tasks (`/api/tasks` & `/api/projects/:id/tasks`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/projects/:id/tasks` | Create task inside project | Member/Owner |
| `PATCH` | `/api/tasks/:id` | Update task status, priority, or assignee | Member/Owner |
| `DELETE` | `/api/tasks/:id` | Delete a task and cascade its comments | Member/Owner |

### 4. Comments (`/api/tasks/:taskId/comments` & `/api/comments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/tasks/:taskId/comments` | Retrieve task comments (chronological) | Member/Owner |
| `POST` | `/api/tasks/:taskId/comments` | Post a comment on a task | Member/Owner |
| `DELETE` | `/api/comments/:commentId` | Delete a comment | Author or Owner |

### 5. Notifications (`/api/notifications`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/notifications` | List user notifications & unread count | Private |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification as read | Private (Recipient) |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications as read | Private (Recipient) |
| `DELETE` | `/api/notifications/:id` | Delete a notification | Private (Recipient) |

### 6. Health & Discovery
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Health check (Uptime, MongoDB state, Memory) | Public |
| `GET` | `/api/` | API directory and service discovery | Public |

---

## ⚡ Real-Time Socket.IO Events

* **`join_user` (`userId`)**: Client joins their private room for instant targeted notifications.
* **`join_project` (`projectId`)**: Client subscribes to live updates on an active project board.
* **`notification`**: Server delivers live notification payloads directly to the client's notification bell.
* **`task_created` / `task_updated` / `task_deleted`**: Server broadcasts board task changes to project members.
* **`comment_created` / `comment_deleted`**: Server broadcasts task discussion activity.

---

## 🧪 How to Test the Application

### 1. Manual Testing via Browser
1. Open `http://localhost:5173` in two different browsers or an incognito tab.
2. Sign in as Owner in Browser 1 and Collaborator in Browser 2.
3. In Browser 1, create a project and add Collaborator as a member.
4. Verify that Browser 2 receives a real-time notification in the Notification Bell popover!
5. Assign a task to Collaborator and post comments; observe real-time updates and unread counters.

### 2. Production Build Verification
To ensure all frontend code compiles without warnings or errors:
```bash
cd frontend
npm run build
```
