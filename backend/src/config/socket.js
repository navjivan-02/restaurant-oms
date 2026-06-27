// Socket.io singleton — avoids circular deps between index.js and controllers.
// index.js calls setIo(io) once after creating the server;
// controllers call getIo() when they need to emit events.
let io;

const setIo = (ioInstance) => {
  io = ioInstance;
};

const getIo = () => io;

module.exports = { setIo, getIo };
