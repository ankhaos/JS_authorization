const { Client } = require('pg');

const client = new Client({
	user: 'anna',
	password: 'kokomi',
	host: 'localhost',
	port: '5432',
	database: 'holodos',
});

const createTable = `
  CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now() 
);
`;

async function createUsersTable() {
    try {
      await client.connect();
      console.log('Connected to PostgreSQL database');
  
      await client.query(createTable);
      console.log('Table created successfully or already exists');
    } catch (error) {
      console.error('Error creating table:', error);
    } finally {
      await client.end();
      console.log('Connection to PostgreSQL database closed');
    }
  }
  
  createUsersTable();




  //Аня!!!! ip сервера = ip ubuntu, но в pg_hba.conf тоже она