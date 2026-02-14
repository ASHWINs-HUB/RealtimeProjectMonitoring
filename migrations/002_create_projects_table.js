/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('projects', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.string('status').defaultTo('planning'); // planning, active, completed, on_hold, cancelled
    table.integer('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('assigned_manager').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('github_repo_url').nullable();
    table.string('github_repo_id').nullable();
    table.string('jira_project_key').nullable();
    table.string('jira_project_id').nullable();
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.date('actual_end_date').nullable();
    table.decimal('budget', 12, 2).nullable();
    table.decimal('actual_cost', 12, 2).nullable();
    table.json('metadata').nullable(); // Store additional project metadata
    table.timestamps(true, true);
    
    // Indexes
    table.index(['created_by']);
    table.index(['assigned_manager']);
    table.index(['status']);
    table.index(['github_repo_id']);
    table.index(['jira_project_key']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('projects');
};
