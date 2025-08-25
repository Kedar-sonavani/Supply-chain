const { query, closePool } = require('./config/database');

async function testConnection() {
  console.log('🚀 Starting comprehensive database test...\n');
  
  try {
    // Test 1: Basic connection (no alias to avoid syntax issues)
    const timeResult = await query('SELECT NOW()');
    const versionResult = await query('SELECT VERSION()');
    console.log('✅ Database connected successfully!');
    console.log(`🕐 Current time: ${Object.values(timeResult.rows[0])[0]}`);
    console.log(`📊 MySQL version: ${Object.values(versionResult.rows[0])[0]}\n`);

    // Test 2: Database and tables check
    console.log('📋 Checking database structure...');
    
    // Check current database
    const dbResult = await query('SELECT DATABASE()');
    console.log(`📁 Current database: ${Object.values(dbResult.rows[0])[0]}`);
    
    // List all tables
    const tables = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY table_name
    `);

    if (tables.rows.length > 0) {
      console.log('📊 Tables found:');
      tables.rows.forEach(row => {
        console.log(`   ├── ${row.TABLE_NAME || row.table_name || Object.values(row)[0]} (${row.TABLE_TYPE || row.table_type || Object.values(row)[1]})`);
      });
    } else {
      console.log('⚠️ No tables found in the database');
    }
    console.log('');

    // Test 3: Test specific supply chain tables if they exist
    const expectedTables = ['users', 'suppliers', 'products', 'inventory', 'shipments', 'orders'];
    console.log('🔍 Checking for supply chain tables...');
    for (const tableName of expectedTables) {
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   ✔️ ${tableName}: ${countResult.rows[0].count} rows`);
      } catch (err) {
        console.log(`   ❌ ${tableName}: Not found or inaccessible`);
      }
    }
    console.log('');

    // Test 4: Performance test
    console.log('⚡ Running performance test...');
    const startTime = Date.now();
    await query('SELECT SLEEP(0.1)');
    const endTime = Date.now();
    console.log(`⏱️ Query execution time: ${endTime - startTime}ms\n`);

    console.log('🎉 Database setup test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Database test failed:');
    console.error('Error details:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. ✓ Verify MySQL service is running');
    console.log('2. ✓ Check your .env file has correct credentials:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_PORT=3306');
    console.log('   DB_USER=your_username');
    console.log('   DB_PASSWORD=your_password');
    console.log('   DB_NAME=supply_chain_tracker');
    console.log('3. ✓ Ensure database "supply_chain_tracker" exists');
    console.log('4. ✓ Run your schema.sql file to create tables');
    console.log('5. ✓ Verify user has proper permissions (SELECT, INSERT, UPDATE, DELETE)');
    console.log('6. ✓ Test connection with MySQL Workbench or CLI first');
    if (closePool) {
      console.log('🔌 Closing database connection pool...');
      await closePool();
      console.log('✅ Database connection pool closed');
    }
    process.exit(1);
  }
}

// Handle unexpected errors
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled promise rejection:', err);
  process.exit(1);
});

testConnection();