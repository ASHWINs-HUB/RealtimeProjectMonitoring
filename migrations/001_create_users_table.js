/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.enum('role', ['hr', 'manager', 'team_leader', 'developer']).notNullable();
    table.string('github_oauth_token').nullable();
    table.string('github_username').nullable();
    table.string('jira_oauth_token').nullable();
    table.string('jira_username').nullable();
    table.string('microsoft_oauth_token').nullable();
    table.string('microsoft_email').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index(['email']);
    table.index(['role']);
    table.index(['is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
