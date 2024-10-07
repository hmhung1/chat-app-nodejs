const express = require('express');
const { appendFile, readFileSync, writeFileSync } = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// Đọc lịch sử chat từ file JSON
let chatHistory = [];
try {
    chatHistory = JSON.parse(readFileSync('chatHistory.json', 'utf8'));
} catch (err) {
    console.error('Không thể đọc file chatHistory.json:', err);
}

// Đọc dữ liệu người dùng từ file JSON
let users = [];
try {
    users = JSON.parse(readFileSync('users.json', 'utf8'));
} catch (err) {
    console.error('Không thể đọc file users.json:', err);
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log("user connected");

    socket.emit('load-history', chatHistory);

    socket.on('on-chat', (data) => {
        if (data.name) {
            chatHistory.push(data);
            writeFileSync('chatHistory.json', JSON.stringify(chatHistory));
            io.emit('user-chat', data);
        }
    });

    socket.on('register', ({ username, password }) => {
        const userExists = users.some(user => user.username === username);
        if (!userExists) {
            const newUser = { username, password };
            users.push(newUser);
            writeFileSync('users.json', JSON.stringify(users));
            socket.emit('register-response', { success: true });
        } else {
            socket.emit('register-response', { success: false, message: 'Tên đăng nhập đã tồn tại.' });
        }
    });

    socket.on('login', ({ username, password }) => {
        const user = users.find(user => user.username === username && user.password === password);
        if (user) {
            socket.emit('login-response', { success: true });
        } else {
            socket.emit('login-response', { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
        }
    });
});

server.listen(port, () => {
    console.log('listening on port ' + port);
});
