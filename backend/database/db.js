const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_NAME || 'ecommerce_db',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise;

try {
  poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
      console.log('Connected to SQL Server');
      return pool;
    })
    .catch(err => {
      console.log('Database Connection Failed:', err.message);
      return null;
    });
} catch (err) {
  console.log('Database Connection Error:', err.message);
  poolPromise = null;
}

module.exports = {
  sql,
  poolPromise
};