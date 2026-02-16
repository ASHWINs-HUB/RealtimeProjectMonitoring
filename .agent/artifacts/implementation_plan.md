# ProjectPulse AI - Full SaaS Refactoring Plan

## Current State Analysis
- Two separate server.js files (root + backend/) causing confusion
- Mixed module systems (CommonJS in src/services, ESM in backend/)
- Frontend services (jiraService, githubService, analyticsEngine) placed in src/services/ but using `require()` (Node.js) - they're server code misplaced in frontend
- Flat database schema - missing scopes, project_managers, teams, jira/github mapping tables
- Analytics engine uses hardcoded values, no real ML
- Role-based routing is broken (duplicate Route paths for different roles don't work in React Router)
- No JWT_SECRET in env, authentication incomplete
- No proper migration system

## Architecture Decision: Unified Monorepo
```
RealtimeProjectMonitoring/
├── backend/                    # Express API Server
│   ├── src/
│   │   ├── config/            # DB, env validation
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, RBAC, rate-limit, error
│   │   ├── models/            # PostgreSQL models
│   │   ├── routes/            # Express routes
│   │   ├── services/          # Jira, GitHub, ML services
│   │   ├── migrations/        # DB migrations
│   │   └── utils/             # Logger, helpers
│   ├── server.js
│   ├── package.json
│   └── .env
├── src/                       # React Frontend (Vite)
│   ├── components/            # Reusable UI components
│   ├── layouts/               # MainLayout with dynamic sidebar
│   ├── pages/                 # Role-based pages
│   ├── services/              # Frontend API service only
│   ├── store/                 # Zustand stores
│   ├── hooks/                 # Custom hooks
│   └── styles/                # Global CSS
├── package.json               # Frontend deps
├── vite.config.js
└── .env                       # Frontend env (VITE_ only)
```

## Phase 1: Backend Foundation
1. Database migration system with complete normalized schema
2. JWT authentication with bcrypt password hashing
3. Role-based middleware
4. Complete API routes for all entities

## Phase 2: Integration Services
1. Jira service (project creation, issue management, sprint/velocity)
2. GitHub service (repo creation, commits, activity analytics)
3. Webhook handlers

## Phase 3: ML Analytics Engine
1. Real logistic regression for risk scoring
2. Sprint delay prediction
3. Developer performance scoring
4. Burnout detection
5. Completion forecasting

## Phase 4: Frontend Overhaul
1. Fix routing with proper role-based access
2. Dynamic sidebar per role
3. All role-specific dashboards
4. Responsive SaaS design
5. Toast notifications, loading states, empty states

## Phase 5: Polish
1. Production error handling
2. Rate limiting
3. Environment validation
4. Deployment guide
