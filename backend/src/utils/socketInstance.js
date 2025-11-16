// Store Socket.io instance so it can be accessed from controllers
let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  return ioInstance;
};

module.exports = { setIO, getIO };

