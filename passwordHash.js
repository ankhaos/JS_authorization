const bcrypt = require('bcrypt');

async function hash(password) {
  const saltRounds = 10; // Количество раундов для генерации соли
  return await bcrypt.hash(password, saltRounds);
}

async function compare(password, userPas) {
    return await bcrypt.compare(password, userPas);
  }

module.exports = {
  hash,
  compare,
};