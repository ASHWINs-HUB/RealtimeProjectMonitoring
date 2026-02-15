// src/controllers/projectController.js
const ProjectModel = require('../models/projectModel');
const TeamMemberModel = require('../models/teamMemberModel');
const jiraService = require('../services/jiraService');

exports.createProject = async (req, res, next) => {
  try {
    const { jira_project_key, jira_project_name, description, repo_name, private: repoPrivate, team_members } = req.body;
    if (!jira_project_key || !jira_project_name) return res.status(400).json({ message: 'Missing Jira project details' });

    // 1) Create project in JIRA automatically so analytics can pull data immediately
    let jiraResult = null;
    try {
      jiraResult = await jiraService.createProject(jira_project_key, jira_project_name);
    } catch (jiraErr) {
      // Log but don't block DB insert — still allow creating project record locally
      console.warn('JIRA project creation failed:', jiraErr.message || jiraErr);
    }

    // 2) Persist basic project record in DB
    const project = await ProjectModel.create({
      jira_project_key,
      jira_project_name,
      github_repo_name: repo_name || null,
      github_repo_url: null,
      status: 'PENDING',
      created_by: req.user && req.user.id ? req.user.id : null
    });

    // 3) Optionally add provided team members (if any)
    if (Array.isArray(team_members)) {
      for (const member of team_members) {
        await TeamMemberModel.add({ project_id: project.id, github_username: member });
      }
    }

    // 4) Return created project plus JIRA response (if available)
    return res.status(201).json({ project, jira: jiraResult });
  } catch (err) { next(err); }
};

exports.approveProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await ProjectModel.updateStatus(id, 'APPROVED');
    res.json(project);
  } catch (err) { next(err); }
};

exports.rejectProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await ProjectModel.updateStatus(id, 'REJECTED');
    res.json(project);
  } catch (err) { next(err); }
};

exports.addBranches = async (req, res, next) => {
  try {
    // This would call GitHub API in real impl
    res.json({ message: 'Branches defined (mock)' });
  } catch (err) { next(err); }
};

exports.addTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { github_username } = req.body;
    if (!github_username) return res.status(400).json({ message: 'GitHub username required' });
    const member = await TeamMemberModel.add({ project_id: id, github_username });
    res.status(201).json(member);
  } catch (err) { next(err); }
};
