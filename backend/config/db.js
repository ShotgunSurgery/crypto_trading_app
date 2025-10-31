import mysql from "mysql2";

export function createConnection() {
  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  connection.connect((err) => {
    if (err) {
      console.error(" Error connecting to MySQL:", err.message);
      process.exit(1);
    } else {
      console.log(" Connected to MySQL database");
    }
  });   

  return connection;
}
