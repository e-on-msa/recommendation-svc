require('dotenv').config();
const mysql     = require('mysql2');
const { Sequelize } = require('sequelize');

// 공통 환경변수 설정
const DB_HOST     = process.env.DB_HOST     || 'mysql';
const DB_PORT     = process.env.DB_PORT     || 3306;
const DB_USER     = process.env.DB_USER     || 'eon';
const DB_PASSWORD = process.env.DB_PASSWORD || 'eon';
const DB_NAME     = process.env.DB_NAME     || 'eon_db';

// 1) Raw MySQL 풀 (자동 재연결)
const rawConnection = mysql.createPool({
  host:              DB_HOST,
  port:              DB_PORT,
  user:              DB_USER,
  password:          DB_PASSWORD,
  database:          DB_NAME,
  waitForConnections: true,
  connectionLimit:   10,
});
rawConnection.getConnection((err, conn) => {
  if (err) {
    console.error('MySQL(raw) 연결 실패:', err.message);
  } else {
    console.log('MySQL(raw) 연결 성공!');
    conn.release();
  }
});

// 2) Sequelize 인스턴스
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host:    DB_HOST,
  port:    DB_PORT,
  dialect: 'mysql',
  logging: console.log,    // 개발 중 SQL 로깅
});
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Sequelize 연결 성공!');
  } catch (err) {
    console.error('Sequelize 연결 실패:', err.message);
  }
})();

module.exports = {
  rawConnection,
  sequelize,
  Sequelize
};
