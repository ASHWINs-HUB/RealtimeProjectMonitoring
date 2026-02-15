import { UserModel } from '../models/userModel.js';
import { ProjectModel } from '../models/projectModel.js';
import { TaskModel } from '../models/taskModel.js';
import logger from './logger.js';

export const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');

    // Create sample users
    const users = [
      {
        name: 'John Doe',
        email: 'john@company.com',
        role: 'hr',
        password: 'password123'
      },
      {
        name: 'Jane Smith',
        email: 'jane@company.com',
        role: 'manager',
        password: 'password123'
      },
      {
        name: 'Mike Johnson',
        email: 'mike@company.com',
        role: 'team_leader',
        password: 'password123'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@company.com',
        role: 'developer',
        password: 'password123'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      try {
        const user = await UserModel.create(userData);
        createdUsers.push(user);
        logger.info(`Created user: ${user.name}`);
      } catch (error) {
        // User might already exist
        const existingUser = await UserModel.getByEmail(userData.email);
        if (existingUser) {
          createdUsers.push(existingUser);
          logger.info(`User already exists: ${existingUser.name}`);
        }
      }
    }

    // Create sample projects
    const projects = [
      {
        name: 'E-commerce Platform',
        description: 'Modern e-commerce platform with React and Node.js',
        status: 'On Track',
        progress: 75,
        risk: 12,
        deadline: '2024-03-15',
        repo_url: 'https://github.com/company/ecommerce-platform',
        repo_name: 'ecommerce-platform',
        project_key: 'ECOM',
        team_leader: 'Mike Johnson',
        created_by: createdUsers[1]?.id || 2 // Jane Smith (manager)
      },
      {
        name: 'Mobile App Redesign',
        description: 'Complete redesign of the mobile application',
        status: 'At Risk',
        progress: 45,
        risk: 68,
        deadline: '2024-02-28',
        repo_url: 'https://github.com/company/mobile-app',
        repo_name: 'mobile-app',
        project_key: 'MOBILE',
        team_leader: 'Mike Johnson',
        created_by: createdUsers[1]?.id || 2 // Jane Smith (manager)
      },
      {
        name: 'API Integration',
        description: 'Third-party API integration for payment processing',
        status: 'On Track',
        progress: 90,
        risk: 8,
        deadline: '2024-03-30',
        repo_url: 'https://github.com/company/api-integration',
        repo_name: 'api-integration',
        project_key: 'API',
        team_leader: 'Mike Johnson',
        created_by: createdUsers[1]?.id || 2 // Jane Smith (manager)
      },
      {
        name: 'Database Migration',
        description: 'Migrate legacy database to PostgreSQL',
        status: 'Delayed',
        progress: 30,
        risk: 45,
        deadline: '2024-04-10',
        repo_url: 'https://github.com/company/db-migration',
        repo_name: 'db-migration',
        project_key: 'DB',
        team_leader: 'Mike Johnson',
        created_by: createdUsers[1]?.id || 2 // Jane Smith (manager)
      }
    ];

    const createdProjects = [];
    for (const projectData of projects) {
      try {
        const project = await ProjectModel.create(projectData);
        createdProjects.push(project);
        logger.info(`Created project: ${project.name}`);
      } catch (error) {
        // Project might already exist
        logger.warn(`Project might already exist: ${projectData.name}`);
      }
    }

    // Create sample tasks
    const tasks = [
      {
        project_id: createdProjects[0]?.id || 1,
        title: 'Setup authentication',
        description: 'Implement JWT-based authentication system',
        status: 'completed',
        assignee: 'John Doe'
      },
      {
        project_id: createdProjects[0]?.id || 1,
        title: 'Create user dashboard',
        description: 'Build responsive user dashboard with analytics',
        status: 'in-progress',
        assignee: 'Jane Smith'
      },
      {
        project_id: createdProjects[1]?.id || 2,
        title: 'Design mobile screens',
        description: 'Create UI/UX designs for mobile app screens',
        status: 'in-progress',
        assignee: 'Mike Johnson'
      },
      {
        project_id: createdProjects[1]?.id || 2,
        title: 'Implement navigation',
        description: 'Implement mobile app navigation system',
        status: 'todo',
        assignee: 'Sarah Wilson'
      },
      {
        project_id: createdProjects[2]?.id || 3,
        title: 'Payment gateway integration',
        description: 'Integrate Stripe payment gateway',
        status: 'completed',
        assignee: 'Sarah Wilson'
      },
      {
        project_id: createdProjects[3]?.id || 4,
        title: 'Database schema design',
        description: 'Design new PostgreSQL database schema',
        status: 'completed',
        assignee: 'Mike Johnson'
      }
    ];

    for (const taskData of tasks) {
      try {
        const task = await TaskModel.create(taskData);
        logger.info(`Created task: ${task.title}`);
      } catch (error) {
        logger.warn(`Task might already exist: ${taskData.title}`);
      }
    }

    // Add team members to projects
    for (const project of createdProjects) {
      for (const user of createdUsers) {
        if (user.role !== 'hr' && user.name !== project.team_leader) {
          try {
            await UserModel.addToProject(user.id, project.id, 'member');
            logger.info(`Added ${user.name} to project ${project.name}`);
          } catch (error) {
            logger.warn(`User ${user.name} might already be in project ${project.name}`);
          }
        }
      }
    }

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
};
