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

let isConnected = false;

async function connect() {
    if (!isConnected) {
        await client.connect();
        isConnected = true;
        console.log('Connected to PostgreSQL database');
    }
}

async function disconnect() {
    if (isConnected) {
        await client.end();
        isConnected = false;
        console.log('Connection to PostgreSQL database closed');
    }
}

async function createUsersTable() {
    try {
      await connect();
      await client.query(createTable);
      console.log('Table created successfully or already exists');
    } catch (error) {
      console.error('Error creating table:', error);
    } finally {
      await disconnect();
    }
}

async function addUser(username, email, password) { //Добавление пользователя в БД     
    try {
      if (!isConnected) {
          await connect();
      }
      await client.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, password]);
      console.log("Data was loaded");
    } catch (error) {
      console.error('Error loading data:', error);
    }
}

module.exports = { addUser, disconnect };


  //Аня!!!! ip сервера = ip ubuntu, но в pg_hba.conf тоже она