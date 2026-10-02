const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'blog_user',
  password: process.env.DB_PASSWORD || 'BlogPass@2025',
  database: process.env.DB_NAME || 'blog_cms',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

console.log(`[Database] Đang kết nối tới MySQL tại ${dbConfig.host}:${dbConfig.port}, Database: ${dbConfig.database}...`);

const pool = mysql.createPool(dbConfig);

// Helper kiểm tra kết nối với cơ chế retry khi khởi động Docker
async function testConnection(retries = 10, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log(`[Database] ✅ Kết nối MySQL thành công! (Lần thử ${i})`);
      connection.release();
      return true;
    } catch (err) {
      console.warn(`[Database] ⚠️ Chưa thể kết nối MySQL (Lần ${i}/${retries}): ${err.message}`);
      if (i < retries) {
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
  console.error('[Database] ❌ Lỗi: Không thể kết nối tới MySQL sau nhiều lần thử!');
  return false;
}

testConnection();

module.exports = pool;
