/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tasks', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description').nullable();
    table.integer('module_id').notNullable().references('id').inTable('modules').onDelete('CASCADE');
    table.string('jira_issue_id').nullable();
    table.string('jira_issue_key').nullable();
    table.integer('assigned_developer').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('status').defaultTo('todo'); // todo, in_progress, in_review, testing, done, blocked
    table.enum('priority', ['lowest', 'low', 'medium', 'high', 'highest']).defaultTo('medium');
    table.integer('story_points').defaultTo(0);
    table.integer('original_estimate_hours').nullable();
    table.integer('time_spent_hours').defaultTo(0);
    table.integer('remaining_estimate_hours').nullable();
    table.date('due_date').nullable();
    table.date('start_date').nullable();
    table.date('completed_date').nullable();
    table.string('github_branch').nullable(); // Feature branch for this task
    table.string('github_pr_url').nullable();
    table.integer('github_pr_number').nullable();
    table.string('github_pr_status').nullable(); // open, closed, merged
    table.integer('reopened_count').defaultTo(0);
    table.json('metadata').nullable(); // Store additional task metadata
    table.timestamps(true, true);
    
    // Indexes
    table.index(['module_id']);
    table.index(['assigned_developer']);
    table.index(['status']);
    table.index(['priority']);
    table.index(['jira_issue_id']);
    table.index(['github_pr_number']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('tasks');
};
