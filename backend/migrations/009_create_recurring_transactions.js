exports.up = function(knex) {
  return knex.schema.createTable('recurring_transactions', table => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('account_id').references('id').inTable('accounts').onDelete('CASCADE');
    table.integer('day_of_month').notNullable(); // Day of month (1-31) to create transaction
    table.string('merchant');
    table.text('description');
    table.string('category');
    table.decimal('amount', 15, 2).notNullable();
    table.boolean('is_expense').defaultTo(true);
    table.date('start_date').notNullable(); // When recurring started
    table.date('end_date').nullable(); // Optional end date
    table.date('last_processed').nullable(); // Last month this was processed
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('recurring_transactions');
};







