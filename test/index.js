const http = require('http');

const iterations = 120;
const options = {
  hostname: 'localhost',
  port: 1480,
  path: '/',
  method: 'GET'
};

for (let i = 1; i <= iterations; i++) {
  const req = http.request(options, (res) => {
    console.log(`Запрос ${i}: статус ${res.statusCode}`);
    
    // Если нужно прочитать тело ответа
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      // console.log(`Ответ: ${data}`); // Раскомментировать, если нужен контент
    });
  });

  req.on('error', (error) => {
    console.error(`Запрос ${i} ошибка:`, error.message);
  });

  // Отправляем запрос
  req.end();
}
