// src/controllers/webhookController.js
const ProjectModel = require('../models/projectModel');

exports.createProjectFromWebhook = async (req, res, next) => {
  try {
    // This would be triggered by Jira automation webhook
    const { jira_project_key, jira_project_name } = req.body;
    if (!jira_project_key || !jira_project_name) return res.status(400).json({ message: 'Missing Jira project details' });
    const project = await ProjectModel.create({
      jira_project_key,
      jira_project_name,
      github_repo_name: null,
      github_repo_url: null,
      status: 'PENDING',
      created_by: null
    });
    res.status(201).json(project);
  } catch (err) { next(err); }
};
