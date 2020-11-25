const { MessagesModel } = require('chat-mongo-db');

const setMessage = async (message, userId, socketId) => {
    const newMessage = new MessagesModel({
        socketId,
        message,
        user_id: userId
    });
    await newMessage.save();
    return newMessage;
};

const getMessages = async () => {
    return await MessagesModel.find({});
};

module.exports = {
    setMessage,
    getMessages
};

