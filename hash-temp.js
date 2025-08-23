const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'cjud@dicaf';
  const hashedPassword = await bcrypt.hash(password, 12);
  console.log('Senha hasheada:', hashedPassword);
}

hashPassword();
