const shortId = require('shortid');

const messages = [];

const set = (message, user, sid) => {
    const newMessage = {
        id: shortId.generate(),
        createdAt: (new Date()).toLocaleTimeString(),
        sid,
        message,
        user
    };
    messages.push(newMessage);
    return newMessage
};

const get = () => {
    return messages;
};

module.exports = {
    set,
    get
};

