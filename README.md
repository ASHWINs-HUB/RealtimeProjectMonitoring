# ProjectPulse AI

An AI-driven project execution platform with real-time integrations for GitHub, Jira, and Microsoft Teams.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd project-pulse-ai

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Start services
npm run dev
```

## 🏗️ Architecture

### Frontend (React)
- Role-based dashboards (HR, Manager, Team Leader, Developer)
- Real-time project analytics
- AI-powered risk assessment
- WebSocket integration for live updates

### Backend (Node.js + Express)
- RESTful API with JWT authentication
- PostgreSQL database
- Real-time metrics processing
- Integration with external services

### ML Service (FastAPI)
- Risk prediction using RandomForest
- Sprint velocity analysis
- Performance metrics calculation

### Integrations
- GitHub REST API (repository management)
- Jira REST API (issue tracking)
- Microsoft Graph API (Teams integration)

## 📊 Features

### AI-Powered Analytics
- Project risk assessment
- Delivery date prediction
- Team performance analysis
- Sprint velocity calculation
- Resource optimization recommendations

### Real-Time Monitoring
- Live project progress tracking
- Task status updates
- Team collaboration metrics
- Automated alerts and notifications

### Role-Based Access Control
- HR: Global project oversight, analytics
- Manager: Repository control, module management
- Team Leader: Task assignment, branch management
- Developer: Issue tracking, commit management

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **ML Service**: Python, FastAPI, scikit-learn
- **Database**: PostgreSQL with Redis for caching
- **Authentication**: JWT with role-based access
- **Real-time**: WebSocket, Server-Sent Events
- **Integrations**: GitHub API, Jira API, Microsoft Graph

## 🔐 Security

- JWT-based authentication
- Role-based access control
- API rate limiting
- HTTPS enforcement
- OAuth integration for external services
- Environment variable management

## 📈 Scalability

- Microservices architecture
- Horizontal database scaling
- Load balancing ready
- Caching layer with Redis
- CDN integration for static assets
- Container deployment support
