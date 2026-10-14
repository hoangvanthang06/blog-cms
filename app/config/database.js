const mysql = require('mysql2/promise');
const localDb = require('./localDb');

const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'blog_user',
  password: process.env.DB_PASSWORD || 'BlogPass@2025',
  database: process.env.DB_NAME || 'blog_cms',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

console.log(`[Database] Đang thử kết nối MySQL tại ${dbConfig.host}:${dbConfig.port}...`);

let isMySQLConnected = false;
const pool = mysql.createPool(dbConfig);

// Helper kiểm tra kết nối với cơ chế retry khi khởi động Docker
async function testConnection(retries = 3, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log(`[Database] ✅ Kết nối MySQL thành công! Đang sử dụng CSDL MySQL 8.0.`);
      connection.release();
      isMySQLConnected = true;
      return true;
    } catch (err) {
      if (i === 1) {
        console.warn(`[Database] ⚠️ Chưa thể kết nối MySQL (${err.code || err.message}).`);
      }
      if (i < retries) {
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
  console.log(`[Database] ℹ️ Đã tự động kích hoạt Chế độ Cơ sở Dữ liệu Nội bộ (Local In-Memory Engine) với dữ liệu khởi tạo đầy đủ.`);
  return false;
}

testConnection();

// Wrapper xuất pool với hàm query linh hoạt
const dbWrapper = {
  query: async (sql, params) => {
    if (isMySQLConnected) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        console.warn(`[Database] MySQL query error, fallback to LocalDB:`, err.message);
        return await localDb.query(sql, params);
      }
    } else {
      return await localDb.query(sql, params);
    }
  },
  getConnection: async () => {
    if (isMySQLConnected) {
      return await pool.getConnection();
    }
    return {
      release: () => {},
      query: (sql, params) => localDb.query(sql, params)
    };
  }
};

module.exports = dbWrapper;
