const express = require('express'); // подключение express
const bodyParser = require('body-parser');
const app = express(); // создаем объект приложения
const port = 3003;
const host = "127.0.0.1";

const { addUser, disconnect } = require('./DataBase/connection');

// Используем body-parser для парсинга данных формы
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/create', (req, res) => { //маршрут отображения формы
    res.sendFile(__dirname + '/creationpage.html');
});

// Маршрут для обработки POST-запроса с данными формы
app.post('/create', (req, res) => {
    if(!req.body) return response.sendStatus(400);
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    addUser(username, email, password);

    console.log('Data received');
    res.send("Спасибо!");
});

app.listen(port, host, () => {
    console.log(`Сервер начал прослушивание запросов на порту ${port}\nПосмотреть: http://${host}:${port}`);
});


process.on('SIGINT', async () => { //генерируется при нажатии Ctrl+C в терминале
    console.log('Closing server...');
    await disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => { //генерируется при завершении процесса операционной системой
    console.log('Closing server...');
    await disconnect();
    process.exit(0);
});