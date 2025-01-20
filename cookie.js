const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const PORT = 8080;
const COOKIE_PATH = '/';

const parseCookies = (cookie = '') =>
    cookie
        .split(';')
        .map((v) => v.split('='))
        .reduce((acc, [k, v]) => {
            acc[k.trim()] = decodeURIComponent(v);
            return acc;
        }, {});

const server = http.createServer(async (request, response) => {
    const cookies = parseCookies(request.headers.cookie);

    if (request.url.startsWith('/login')) {
        handleLogin(request, response);
    } else if (cookies.name) {
        greetUser(response, cookies.name);
    } else {
        serveHtml(response);
    }
});

const handleLogin = (request, response) => {
    const url = new URL(request.url, `http://localhost:${PORT}`);
    const name = url.searchParams.get('name');

    if (!name) {
        response.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
        });
        response.end('이름이 제공되지 않았습니다.');
        return;
    }

    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5);

    response.writeHead(302, {
        Location: '/',
        'Set-Cookie': `name=${encodeURIComponent(
            name
        )}; Expires=${expires.toGMTString()}; HttpOnly; Path=${COOKIE_PATH}`,
    });
    response.end();
};

const greetUser = (response, name) => {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(`${name}님 안녕하세요.`);
};

const serveHtml = async (response) => {
    try {
        const filePath = path.join(__dirname, 'cookie.html');
        const data = await fs.readFile(filePath);
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(data);
    } catch (err) {
        response.writeHead(500, {
            'Content-Type': 'text/plain; charset=utf-8',
        });
        response.end(`파일 읽기 실패: ${err.message}`);
    }
};

server.listen(PORT, () => {
    console.log(`${PORT}번 포트에서 서버가 실행 중입니다.`);
});
