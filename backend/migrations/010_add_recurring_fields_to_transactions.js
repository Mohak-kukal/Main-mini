exports.up = function(knex) {
  return knex.schema.table('transactions', table => {
    table.boolean('is_recurring').defaultTo(false);
    table.integer('recurring_transaction_id').nullable();
  }).then(() => {
    // Add foreign key constraint after column is created (if recurring_transactions table exists)
    return knex.schema.hasTable('recurring_transactions').then(exists => {
      if (exists) {
        return knex.schema.table('transactions', table => {
          table.foreign('recurring_transaction_id').references('id').inTable('recurring_transactions').onDelete('SET NULL');
        });
      }
    });
  });
};

exports.down = function(knex) {
  return knex.schema.table('transactions', table => {
    table.dropColumn('is_recurring');
    table.dropColumn('recurring_transaction_id');
  });
};

