const { Client } = require('pg');

const { compare } = require('../passwordHash'); //относительный путь
const nodemailer = require('nodemailer'); // отправка писем
const crypto = require('crypto'); // модуль криптографии

// Настройка nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'holodilnik.smartapp@gmail.com',
    pass: 'kokomi2022'
  }
});

async function sendConfirmationEmail(email) {
  try {
      console.log('попали');
    const token = crypto.randomBytes(20).toString('hex'); // Генерация уникального токена

    await addTokentoDb(token, email);

    // Отправка письма
    const mailOptions = {
      from: 'holodilnik.smartapp@gmail.com',
      to: email,
      subject: 'Подтверждение регистрации',
      text: `Пожалуйста, подтвердите вашу регистрацию, перейдя по ссылке: http://127.0.0.1:3003/confirm/${token}`
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

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
  updated_at TIMESTAMP DEFAULT now(),
  email_token VARCHAR(255),
  confirmed BOOLEAN,
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

async function addTokentoDb(token, email){
  try {
    if (!isConnected) {
        await connect();
    }
    await client.query('UPDATE users SET email_token = $1 WHERE email = $2', [token, email]);
    return true;

  } catch (error) {
      console.error('Error loading data:', error);
      return false;
  }
}

async function checkToken(token){
  try{
    if (!isConnected){
      await connect();
    }
    // Проверка токена в базе данных
    const result = await client.query('SELECT * FROM users WHERE email_token = $1', [token]);
  
    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Активация аккаунта
      await client.query('UPDATE users SET confirmed = true, email_token = NULL WHERE id = $1', [user.id]);
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
        
        // Отправка письма для подтверждения
        await sendConfirmationEmail(email);
        
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
      const checkResult = await client.query('SELECT * FROM users WHERE username = $1', [username]);

      if (checkResult.rows.length > 0) {
        const user = checkResult.rows[0];

        const passwordMatch = await compare(password, user.password); // Сравнение введенного пароля с хешем в базе данных
        
        if (passwordMatch) {
          return { username: user.username, id: user.id };
        } 
        else {
          return false;
        }
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
        if(newemail != "" && checkemail.rows.length == 0){
          await client.query('UPDATE users SET email = $1, updated_at = now()  WHERE id = $2', [newemail, id]);
          // Отправка письма для подтверждения
          await sendConfirmationEmail(newemail);
        }
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

module.exports = { addUser, disconnect, findUser, deleteUser, updateUser, addTokentoDb, checkToken, };

  //Аня!!!! ip сервера = ip ubuntu, но в pg_hba.conf тоже она