import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api'
});

async function test() {
    try {
        console.log('Logging in...');
        const loginRes = await api.post('/auth/login', {
            email: 'hr@projectpulse.io',
            password: 'password123'
        });

        const token = loginRes.data.token;
        console.log('Login successful. Token:', token.substring(0, 20) + '...');
        console.log('User Role:', loginRes.data.user.role);

        console.log('Fetching projects...');
        const projectsRes = await api.get('/projects', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Projects count:', projectsRes.data.projects.length);
        if (projectsRes.data.projects.length > 0) {
            console.log('First project:', projectsRes.data.projects[0].name);
        } else {
            console.log('Project list is empty.');
        }

        console.log('Fetching analytics...');
        const analyticsRes = await api.get('/analytics/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Analytics received:', !!analyticsRes.data.analytics);

        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err.response?.data || err.message);
        process.exit(1);
    }
}

test();
