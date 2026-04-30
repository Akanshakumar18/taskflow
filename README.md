# TaskFlow - Project Management App

A full-stack project management application with role-based access control.

## Features
- **Authentication**: Signup/Login with JWT
- **Project Management**: Create, update, delete projects
- **Team Management**: Add/remove members with Admin/Member roles
- **Task Management**: Create, assign, track tasks with status (Todo/In Progress/Done)
- **Dashboard**: Overview with stats, overdue tasks, recent activity
- **Role-Based Access**: Admin and Member roles at both system and project level

## Tech Stack
- **Backend**: Express.js + PostgreSQL
- **Frontend**: React + Vite + TailwindCSS
- **Auth**: JWT + bcryptjs

## Local Development

1. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```

2. Set up environment variables (`.env`):
   ```
   JWT_SECRET=your-secret-key
   DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
   PORT=5000
   ```

3. Build the client:
   ```bash
   cd client && npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Railway Deployment

1. Push this repo to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add a PostgreSQL service
4. Deploy from GitHub repo
5. Set environment variables:
   - `JWT_SECRET` - a secure random string
   - `DATABASE_URL` - auto-provided by Railway PostgreSQL service

The app will auto-build the client and serve it from the Express server.
