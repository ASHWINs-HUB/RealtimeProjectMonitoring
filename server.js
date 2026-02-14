const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { createServer } = require('http')

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Mock database (in production, use PostgreSQL)
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@company.com', role: 'hr', password: 'password123' },
  { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'manager', password: 'password123' },
  { id: 3, name: 'Mike Johnson', email: 'mike@company.com', role: 'team_leader', password: 'password123' },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@company.com', role: 'developer', password: 'password123' }
]

const mockProjects = [
  { id: 1, name: 'E-commerce Platform', status: 'On Track', progress: 75, risk: 12, deadline: '2024-03-15' },
  { id: 2, name: 'Mobile App Redesign', status: 'At Risk', progress: 45, risk: 68, deadline: '2024-02-28' },
  { id: 3, name: 'API Integration', status: 'On Track', progress: 90, risk: 8, deadline: '2024-03-30' },
  { id: 4, name: 'Database Migration', status: 'Delayed', progress: 30, risk: 45, deadline: '2024-04-10' }
]

const mockTasks = [
  { id: 1, projectId: 1, title: 'Setup authentication', status: 'completed', assignee: 'John Doe' },
  { id: 2, projectId: 1, title: 'Create user dashboard', status: 'in-progress', assignee: 'Jane Smith' },
  { id: 3, projectId: 2, title: 'Design mobile screens', status: 'in-progress', assignee: 'Mike Johnson' },
  { id: 4, projectId: 2, title: 'Implement navigation', status: 'todo', assignee: 'Sarah Wilson' }
]

// Helper function to generate JWT token
const generateToken = (user) => {
  // In production, use proper JWT library
  return Buffer.from(JSON.stringify(user)).toString('base64')
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    // In production, verify JWT properly
    const user = JSON.parse(Buffer.from(token, 'base64').toString())
    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' })
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body

  // Find user by email
  const user = mockUsers.find(u => u.email === email && u.password === password)
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  // Generate token
  const token = generateToken(user)
  
  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
})

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body
  
  // Check if user already exists
  const existingUser = mockUsers.find(u => u.email === email)
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' })
  }

  // Create new user (in production, save to database)
  const newUser = {
    id: mockUsers.length + 1,
    name,
    email,
    role: role || 'developer',
    password
  }
  
  mockUsers.push(newUser)
  
  const token = generateToken(newUser)
  
  res.status(201).json({
    message: 'User created successfully',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  })
})

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user })
})

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' })
})

// Project routes
app.get('/api/projects', authenticateToken, (req, res) => {
  res.json(mockProjects)
})

app.get('/api/projects/:id', authenticateToken, (req, res) => {
  const project = mockProjects.find(p => p.id === parseInt(req.params.id))
  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }
  res.json(project)
})

app.post('/api/projects', authenticateToken, (req, res) => {
  const { name, description, deadline } = req.body
  
  const newProject = {
    id: mockProjects.length + 1,
    name,
    description,
    status: 'Planning',
    progress: 0,
    risk: 0,
    deadline
  }
  
  mockProjects.push(newProject)
  
  res.status(201).json(newProject)
})

// Task routes
app.get('/api/projects/:projectId/tasks', authenticateToken, (req, res) => {
  const tasks = mockTasks.filter(t => t.projectId === parseInt(req.params.projectId))
  res.json(tasks)
})

app.post('/api/projects/:projectId/tasks', authenticateToken, (req, res) => {
  const { title, description, assignee } = req.body
  
  const newTask = {
    id: mockTasks.length + 1,
    projectId: parseInt(req.params.projectId),
    title,
    description,
    status: 'todo',
    assignee
  }
  
  mockTasks.push(newTask)
  
  res.status(201).json(newTask)
})

// User routes
app.get('/api/users', authenticateToken, (req, res) => {
  const { role } = req.query
  
  if (role) {
    const filteredUsers = mockUsers.filter(u => u.role === role)
    return res.json(filteredUsers)
  }
  
  res.json(mockUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role
  })))
})

// Analytics routes
app.get('/api/analytics/team', authenticateToken, (req, res) => {
  res.json({
    totalProjects: mockProjects.length,
    completedProjects: mockProjects.filter(p => p.status === 'Completed').length,
    atRiskProjects: mockProjects.filter(p => p.status === 'At Risk').length,
    totalTasks: mockTasks.length,
    completedTasks: mockTasks.filter(t => t.status === 'completed').length
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 API available at http://localhost:${PORT}/api`)
  console.log(`🔗 Frontend should connect to http://localhost:${PORT}`)
})
