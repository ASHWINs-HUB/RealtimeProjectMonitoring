// src/controllers/projectController.js
const ProjectModel = require('../models/projectModel');
const TeamMemberModel = require('../models/teamMemberModel');

exports.createProject = async (req, res, next) => {
  try {
    const { jira_project_key, jira_project_name } = req.body;
    if (!jira_project_key || !jira_project_name) return res.status(400).json({ message: 'Missing Jira project details' });
    const project = await ProjectModel.create({
      jira_project_key,
      jira_project_name,
      github_repo_name: null,
      github_repo_url: null,
      status: 'PENDING',
      created_by: req.user.id
    });
    res.status(201).json(project);
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
