/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('modules', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.integer('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.integer('assigned_team_leader').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('status').defaultTo('planning'); // planning, in_progress, testing, completed, blocked
    table.integer('story_points').defaultTo(0);
    table.integer('completed_story_points').defaultTo(0);
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.date('actual_end_date').nullable();
    table.string('github_branch').nullable(); // Main branch for this module
    table.json('metadata').nullable(); // Store additional module metadata
    table.timestamps(true, true);
    
    // Indexes
    table.index(['project_id']);
    table.index(['assigned_team_leader']);
    table.index(['status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('modules');
};
