const config = require('config');
const axios = require('axios').default;
const socketioJwt = require('socketio-jwt');

const users = {};

const getUserInfo = async (socket) => {
    const token = socket.encoded_token;
    const id = socket.decoded_token;
    const user = await axios.get(config.get('user.infoURL'), {
        headers: {
            authorization: token
        }
    });
    return user;
};

const registerUser = ({ id, name }) => {
    users[id] = name;
};

const authorize = () => {
    return socketioJwt.authorize({
        secret: process.env.JWT_SECRET || config.get('user.auth.JWT_TOKEN'),
        timeout: config.get('user.auth.timeout')
    })
};

module.exports = {
    authorize,
    getUserInfo,
    registerUser,
};
