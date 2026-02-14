# ProjectPulse AI

A modern, production-ready SaaS dashboard UI built with React, featuring role-based interfaces for project monitoring and team management.

## 🚀 Features

- **Role-Based Dashboards**: HR, Manager, Team Leader, and Developer views
- **Modern UI/UX**: Inspired by Linear, Stripe, and Vercel design patterns
- **Responsive Design**: Mobile-first approach with collapsible sidebar
- **Interactive Components**: Kanban boards, real-time charts, and analytics
- **Clean Architecture**: Organized folder structure with separation of concerns

## 🛠️ Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: TailwindCSS with custom theme system
- **UI Components**: Shadcn UI components
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Routing**: React Router v6
- **State Management**: Zustand

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn package manager

## 🛠️ Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## 🎨 Theme System

### Light Theme Colors
- Background: `#F9FAFB`
- Card: `#FFFFFF`
- Primary Text: `#111827`
- Secondary Text: `#6B7280`
- Border: `#E5E7EB`
- Primary Accent: `#4F46E5`
- Success: `#16A34A`
- Warning: `#F59E0B`
- Danger: `#DC2626`

### Typography
- Font: Inter
- Spacing: 8px system
- Headings: `text-xl / text-2xl font-semibold`
- Body: `text-sm text-gray-600`

## 👥 User Roles

### HR Dashboard
- Project health overview cards
- Risk score indicators
- Delivery forecast charts
- High-risk project tracking

### Manager Dashboard
- Repository status panel
- Module progress tracking
- Merge approval workflow
- Sprint analytics

### Team Leader Dashboard
- Interactive Kanban board
- PR review queue
- Developer workload charts
- Sprint risk metrics

### Developer Dashboard
- Personal task management
- Branch status tracking
- Pull request monitoring
- Performance metrics

## 📁 Project Structure

```
src/
├── components/
│   └── ui/                 # Reusable UI components
├── layouts/                # Layout components
├── pages/                  # Page components
├── features/               # Feature-specific components
├── services/              # API services
├── hooks/                 # Custom React hooks
├── store/                 # State management
├── styles/                # Global styles
└── utils/                 # Utility functions
```

## 🎯 Component Standards

### Cards
- Rounded: `2xl`
- Shadow: `shadow-sm`
- Border: `border border-gray-200`
- Padding: `20px`

### Buttons
- Primary: `bg-indigo-600 text-white`
- Secondary: `border border-gray-300 bg-white`
- Smooth hover transitions

### Tables
- Minimal borders
- Hover row highlighting
- Sticky headers

## 📱 Responsive Design

- Fully responsive layout
- Collapsible sidebar (icon mode on mobile)
- Mobile drawer support
- Touch-friendly interactions

## ⚡ Performance

- Lazy-loaded routes
- Component-level memoization
- Optimized bundle size
- Clean component architecture

## 🔧 Customization

### Changing User Role
Edit `src/store/authStore.js`:
```javascript
user: {
  role: 'hr', // Change to 'manager', 'team_leader', or 'developer'
}
```

### Theme Customization
Modify `tailwind.config.js` to update colors, spacing, or typography.

### Adding New Components
1. Create component in `src/components/ui/`
2. Follow existing patterns
3. Export from index if needed

## 🚀 Deployment

The application is ready for deployment on any platform that supports static sites:

- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.
