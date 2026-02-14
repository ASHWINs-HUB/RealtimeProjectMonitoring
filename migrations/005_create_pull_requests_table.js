/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('pull_requests', function(table) {
    table.increments('id').primary();
    table.integer('task_id').nullable().references('id').inTable('tasks').onDelete('SET NULL');
    table.integer('github_pr_id').notNullable().unique();
    table.string('github_pr_number').notNullable();
    table.string('title').notNullable();
    table.text('description').nullable();
    table.string('branch_name').notNullable();
    table.string('base_branch').notNullable(); // Usually 'develop' or 'main'
    table.string('status').notNullable(); // open, closed, merged, draft
    table.string('merge_status').nullable(); // clean, conflict, blocked
    table.integer('author_id').references('id').inTable('users').onDelete('SET NULL');
    table.integer('reviewer_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.integer('merged_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at_github').nullable();
    table.timestamp('updated_at_github').nullable();
    table.timestamp('merged_at').nullable();
    table.integer('additions').nullable(); // Lines added
    table.integer('deletions').nullable(); // Lines deleted
    table.integer('changed_files').nullable();
    table.json('metadata').nullable(); // Store additional PR metadata
    table.timestamps(true, true);
    
    // Indexes
    table.index(['task_id']);
    table.index(['github_pr_id']);
    table.index(['github_pr_number']);
    table.index(['status']);
    table.index(['author_id']);
    table.index(['reviewer_id']);
    table.index(['merged_by']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('pull_requests');
};
