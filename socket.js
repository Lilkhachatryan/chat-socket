const dotenv = require('dotenv');
dotenv.config();

const http = require('http')
    .createServer();
const io = require('socket.io')(http, { cors: { origin: '*' } });
const mongoose = require('mongoose');
const { authenticateJWT } = require('./services/authService');
const { setMessage, getMessages } = require('./services/messageService');

mongoose.connect(process.env.MONGODB_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});

io.sockets
    .use((socket, next) => {
        const header = socket.handshake.headers['authorization'];
        const user = authenticateJWT(header);

        if (user) {
            socket.user = user;
            return next();
        }

        const err = new Error('Not authorized');
        err.data = { content: "Please retry later" };
        next(err);
    })
    .on('connection', async (socket) => {
        socket.broadcast.emit('join', (`${socket.user.email} entered to the chat`));
        const messages = await getMessages();
        socket.emit('messages', messages);

        socket.on('message', async (message) => {
            console.log('socket.user._id', socket.user);
            const newMessage = await setMessage(message, socket.user.id, socket.id);
            console.log('newMessage', newMessage);
            io.emit('message', newMessage);
        });

        socket.on('disconnect', () => {
            socket.broadcast.emit('leave', `${socket.user.email} left the chat`);
        })

    });

let port = process.env.PORT || 8000;
http.listen(port, function(){
    console.log('listening on *:' + port);
});

