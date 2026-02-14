# ProjectPulse AI - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Python 3.8+
- Redis (optional, for caching)

### Environment Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd project-pulse-ai
npm install
```

2. **Database Setup**
```bash
# Create PostgreSQL database
createdb project_pulse_ai

# Run migrations
npm run migrate

# Seed database (optional)
npm run seed
```

3. **Environment Variables**
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. **ML Service Setup**
```bash
cd ml-service
pip install -r requirements.txt
python main.py
```

5. **Start Services**
```bash
# Start backend (port 3001)
npm run server:dev

# Start frontend (port 3000)
npm run client:dev

# Or start both together
npm run dev
```

## 🔐 OAuth Setup

### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set callback URL: `http://localhost:3000/auth/github/callback`
4. Copy Client ID and Secret to `.env`

### Jira OAuth
1. Go to Atlassian Developer Console
2. Create new OAuth 2.0 app
3. Set callback URL: `http://localhost:3000/auth/jira/callback`
4. Copy Client ID and Secret to `.env`

## 🗄️ Database Schema

### Core Tables
- `users` - User management and authentication
- `projects` - Project metadata and assignments
- `modules` - Project modules with team leaders
- `tasks` - Individual tasks with Jira integration
- `pull_requests` - GitHub PR tracking
- `project_metrics` - AI-generated metrics and predictions

## 🤖 ML Service

### Training the Model
```bash
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d @training_data.json
```

### Making Predictions
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"sprint_data": {...}}'
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List projects (role-based)
- `POST /api/projects` - Create project (HR only)
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project (Manager only)

### GitHub Integration
- `POST /api/github/repo/create` - Create repository
- `POST /api/github/branch/create` - Create branch
- `POST /api/github/pr/create` - Create pull request

### Jira Integration
- `GET /api/jira/issues/:projectKey` - Get project issues
- `POST /api/jira/issue/create` - Create issue
- `GET /api/jira/sprints/:projectKey` - Get sprints

### Analytics
- `GET /api/analytics/projects/:id/metrics` - Project metrics
- `POST /api/analytics/risk/predict` - Risk prediction
- `GET /api/analytics/dashboard/:role` - Dashboard data

## 🎯 Role-Based Access

### HR
- View all projects (read-only)
- Create projects and assign managers
- Access global analytics and risk reports

### Manager
- Full access to assigned projects
- Create GitHub repositories
- Manage modules and team leaders
- Approve pull requests

### Team Leader
- Manage assigned modules
- Create and assign tasks
- Review pull requests
- View team analytics

### Developer
- View assigned tasks only
- Update task status
- Create pull requests
- View personal metrics

## 🔍 Monitoring

### Health Checks
- Backend: `GET /health`
- ML Service: `GET /health`
- Database: Automatic connection checks

### Logging
- Backend logs: `./logs/`
- ML Service logs: Console output
- Error tracking: Sentry integration

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd client && npm run build

# Backend
npm start
```

### Docker Deployment
```bash
# Build and run all services
docker-compose up -d
```

### Environment Variables for Production
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-production-secret
GITHUB_CLIENT_ID=prod-github-id
JIRA_CLIENT_ID=prod-jira-id
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists

2. **OAuth Callbacks Failing**
   - Check callback URLs in OAuth apps
   - Verify environment variables
   - Check CORS settings

3. **ML Service Not Responding**
   - Ensure Python dependencies installed
   - Check if port 8000 is available
   - Verify model training data format

4. **Frontend Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript configuration
   - Verify all dependencies installed

### Debug Mode
```bash
# Enable debug logging
DEBUG=project-pulse-ai:* npm run dev

# Run with inspect
node --inspect server.js
```

## 📚 API Documentation

Full API documentation available at:
- Swagger UI: `http://localhost:3001/api-docs`
- Postman Collection: `./docs/postman.json`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests if applicable
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.
