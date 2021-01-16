const dotenv = require('dotenv');
dotenv.config();

const http = require('http')
    .createServer();
const io = require('socket.io')(http, { cors: { origin: '*' } });
const mongoose = require('mongoose');
// const bluebirdPromise = require("bluebird");
const util = require('util');
const redis = require('redis');
const { authenticateJWT } = require('./services/authService');
const { setMessage, getMessages } = require('./services/messageService');

// bluebirdPromise.promisifyAll(redis, /* { suffix: 'Promise' } */);
const redisClient = redis.createClient();


const sAdd = util.promisify(redisClient.sadd).bind(redisClient); // logs in
const sRem = util.promisify(redisClient.srem).bind(redisClient); // logs out
const smembers = util.promisify(redisClient.smembers).bind(redisClient); // what users are online
const scard = util.promisify(redisClient.scard).bind(redisClient); // how many users are online
const sismember = util.promisify(redisClient.sismember).bind(redisClient); // is online
const del = util.promisify(redisClient.del).bind(redisClient); // is online

mongoose.connect(process.env.MONGODB_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})
    .catch(err => {
        console.error(err.stack);
        process.exit(1)
    });

redisClient.del('online_users', (err, isOk) => console.log(err, isOk));

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
        // redisClient.lpush('activeUsers', JSON.stringify(socket.user), (err, isOk) => {
        //     if (!err) {
        //         redisClient.lrange('activeUsers', 0, -1, (err, data) =>{
        //             console.log(err);
        //             if(err || !data || !Array.isArray(data)) return;
        //             socket.emit('onlineUsers', data.map(item => JSON.parse(item)));
        //         })
        //     }
        // });

        await sAdd('online_users', socket.user.id);
        const usersOnline = await smembers('online_users');
        console.log('usersOnline', usersOnline);

        socket.emit('users_online', usersOnline);

        socket.broadcast.emit('join', `${socket.user.email} entered to the chat`);
        const messages = await getMessages();
        socket.emit('messages', messages);

        socket.on('message', async (message) => {
            console.log('socket.user._id', socket.user);
            const newMessage = await setMessage(message, socket.user.id, socket.id);
            console.log('newMessage', newMessage);
            io.emit('message', newMessage);
        });

        socket.on('disconnect', async () => {
            socket.broadcast.emit('leave', `${socket.user.email} left the chat`);
            await sRem('online_users', socket.user.id);
            const usersOnline = await smembers('online_users');
            console.log('usersOnline after disconnect', usersOnline);

            socket.emit('users_online', usersOnline);
        })

    });

let port = process.env.PORT || 8000;
http.listen(port, function(){
    console.log('listening on *:' + port);
});

