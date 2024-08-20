const express = require('express'); // подключение express
const jwt = require('jsonwebtoken'); // подключение токенов для аутентификации
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express(); // создаем объект приложения


const port = 3003;
const host = "127.0.0.1";
// Секретный ключ для подписи JWT
const JWT_SECRET = 'Al-3ex-5a-66ndr-23-eDum-822-as';


//экспортируем функции
const { addUser, disconnect, findUser, deleteUser, updateUser, checkToken } = require('./DataBase/connection');
const { hash } = require('./passwordHash');

// Используем body-parser для парсинга данных формы
app.use(bodyParser.urlencoded({ extended: true }));
// Парсинг тела запроса
app.use(express.json());
app.use(cookieParser());

app.get('/create', (req, res) => { //маршрут отображения формы
    res.sendFile(__dirname + '/Pages/creationpage.html');
});

// Маршрут для обработки POST-запроса с данными формы
app.post('/create', async (req, res) => {
    if(!req.body) return response.sendStatus(400);
    const username = req.body.username;
    const email = req.body.email;
    const password = await hash(req.body.password);

    const result = await addUser(username, email, password);
    if(result == false){
        console.log('User with this username or email already exists');
        res.redirect('/create');
    }
    else{
        console.log("Data was loaded");
        res.redirect('/login');
    }
    
});

app.get('/login', (req, res) => { //маршрут отображения формы
    res.sendFile(__dirname + '/Pages/login.html');
});

app.post('/login', async (req, res) => {
    if(!req.body) return response.sendStatus(400);
    const username = req.body.username;
    const password = req.body.password;

    const result = await findUser(username, password);
    if(result){
        // Создаем JWT токен
        const token = jwt.sign({ username: result.username, id: result.id}, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('jwtToken', token, { httpOnly: true, maxAge: 3600000 }); // 1 час

        console.log(`Logged in the account ${username}`);
        res.redirect('/logout');
    }
    else{
        console.log("Wrong data");
        res.redirect('/login');
    }
});

// Middleware для проверки JWT токена - проверяет, что пользователь аутентифицирован и имеет действительный токен, прежде чем позволить ему получить доступ к защищенным ресурсам
const authenticateToken = (req, res, next) => {
    const token = req.cookies.jwtToken; // Извлекаем токен из куки
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => { //Проверка и верификация токена - используется для проверки и декодирования JWT
        if (err) return res.sendStatus(403); //доступ запрещен из-за недопустимого токена
        req.user = user; //Если токен действителен, в объект запроса (req) добавляется поле user, содержащее данные, закодированные в токене
        next(); // которая передает управление следующему middleware или маршруту
    });
};

// Маршрут для выхода (защищенный маршрут)
app.get('/logout', authenticateToken, (req, res) => {
    res.sendFile(__dirname + '/Pages/logout.html');
});

app.post('/logout', authenticateToken, async (req, res) => {
    if(!req.body) return res.sendStatus(400);
    const newemail = req.body.email;
    var newpassword = req.body.password;
    if (newpassword != '') {
        newpassword = await hash(newpassword);
    }

    const { id } = req.user;
    await updateUser(id, newemail, newpassword);

    console.log('Data changed');
    res.clearCookie('jwtToken');
    console.log(`Logged out the account ${req.user.username}`);
    res.redirect('/login');
});

app.get('/exit', authenticateToken, async (req, res) => {
    if(!req.body) return res.sendStatus(400);
    res.clearCookie('jwtToken');
    console.log(`Logged out the account ${req.user.username}`);
    res.redirect('/login');
});

app.get('/delete', authenticateToken, async (req, res) => {
    if(!req.body) return res.sendStatus(400);
    const { username } = req.user;
    try {
        // Вызов функции для удаления аккаунта из базы данных
        await deleteUser(username);
        console.log(`Account deleted for user: ${username}`);
        res.clearCookie('jwtToken');
        console.log('Account deleted successfully');
    } catch (error) {
        console.error('Error deleting account:', error);
    }
    res.redirect('/create');
});

app.get('/confirm/:token', async (req, res) => {
    try {
      const token = req.params.token;
  
      if(await checkToken(token)){
        res.send('Ваш аккаунт успешно подтвержден!');
      } else {
        res.status(400).send('Неверный токен подтверждения.');
      }
    } catch (error) {
      console.error('Error confirming account:', error);
      res.status(500).send('Ошибка при подтверждении аккаунта.');
    }
  });


app.listen(port, host, () => {
    console.log(`Сервер начал прослушивание запросов на порту ${port}\nПосмотреть: http://${host}:${port}`);
});


process.on('SIGINT', async () => { //генерируется при нажатии Ctrl+C в терминале
    console.log('\nClosing server...');
    await disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => { //генерируется при завершении процесса операционной системой
    console.log('\nClosing server...');
    await disconnect();
    process.exit(0);
});


