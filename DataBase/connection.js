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

async function addUser(username, email, password) {
  try {
      if (!isConnected) {
          await connect();
      }
      // Проверка наличия пользователя с таким же username или email
      const checkResult = await client.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);

      if (checkResult.rows.length > 0) {
        return false;
      }
      else{
        await client.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, password]);
        return true;
      }
  } catch (error) {
      console.error('Error loading data:', error);
      return false;
  }
}

async function findUser(username, password) {
  try {
      if (!isConnected) {
          await connect();
      }
      // Проверка наличия пользователя с таким же username или email
      const checkResult = await client.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);

      if (checkResult.rows.length > 0) {
        const user = checkResult.rows[0];
        return { username: user.username, id: user.id };
      }
      else{
        return false;
      }
  } catch (error) {
      console.error('Error loading data:', error);
      return false;
  }
}

async function updateUser(id, newemail, newpassword) {
  try {
      if (!isConnected) {
          await connect();
      }
      // Проверка наличия пользователя с таким же username
      const checkResult = await client.query('SELECT id FROM users WHERE id = $1', [id]);

      if (checkResult.rows.length > 0) {
        const checkemail= await client.query('SELECT * FROM users WHERE email = $1', [newemail]); //почты не повторяются
        const user = checkResult.rows[0];
        if(newemail != "" && checkemail.rows.length == 0) await client.query('UPDATE users SET email = $1, updated_at = now()  WHERE id = $2', [newemail, id]);
        if(newpassword != "") await client.query('UPDATE users SET password = $1, updated_at = now() WHERE id = $2', [newpassword, id]);
        return true;
      }
      else{
        return false;
      }
  } catch (error) {
      console.error('Error loading data:', error);
      return false;
  }
}


async function deleteUser(username) {
  try {
      if (!isConnected) {
          await connect();
      }
      // Проверка наличия пользователя с таким же username
      const checkResult = await client.query('SELECT * FROM users WHERE username = $1', [username]);

      if (checkResult.rows.length > 0) {
        await client.query('DELETE FROM users WHERE username = $1', [username]);
        return true;
      }
      else{
        return false;
      }
  } catch (error) {
      console.error('Error loading data:', error);
      return false;
  }
}

module.exports = { addUser, disconnect, findUser, deleteUser, updateUser };


  //Аня!!!! ip сервера = ip ubuntu, но в pg_hba.conf тоже она