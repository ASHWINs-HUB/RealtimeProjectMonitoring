/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('project_metrics', function(table) {
    table.increments('id').primary();
    table.integer('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.decimal('completion_percentage', 5, 2).defaultTo(0);
    table.decimal('risk_score', 5, 2).defaultTo(0); // 0-100 risk score
    table.string('risk_category').defaultTo('low'); // low, medium, high, critical
    table.date('predicted_delivery_date').nullable();
    table.date('actual_delivery_date').nullable();
    table.integer('total_story_points').defaultTo(0);
    table.integer('completed_story_points').defaultTo(0);
    table.integer('total_tasks').defaultTo(0);
    table.integer('completed_tasks').defaultTo(0);
    table.integer('active_developers').defaultTo(0);
    table.decimal('avg_pr_merge_time_hours', 8, 2).defaultTo(0);
    table.decimal('commit_frequency_per_day', 8, 2).defaultTo(0);
    table.decimal('sprint_velocity', 8, 2).defaultTo(0);
    table.integer('reopened_issues').defaultTo(0);
    table.decimal('developer_workload_score', 5, 2).defaultTo(0);
    table.json('ml_features').nullable(); // Store ML input features
    table.json('ml_prediction').nullable(); // Store ML prediction details
    table.timestamp('last_calculated_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    // Indexes
    table.index(['project_id']);
    table.index(['risk_category']);
    table.index(['last_calculated_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('project_metrics');
};
