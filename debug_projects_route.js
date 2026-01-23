const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config({ path: './backend/.env' });

try {
    const projectsRoute = require('./backend/routes/projects');
    app.use('/api/projects', projectsRoute);
    console.log("Health check passed: Projects route loaded successfully.");
} catch (error) {
    console.error("Health check failed:", error);
    process.exit(1);
}
