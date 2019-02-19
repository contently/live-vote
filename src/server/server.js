/* eslint-disable no-console */
const app = require('express')();
const express = require('express');
const http = require('http').Server(app);
const socketIo = require('socket.io')(http);
const path = require('path');
const App = require('./App');

const voteApp = new App(socketIo);
voteApp.start();
// This allows us to serve the react app
// via `express`
app.use(express.static('dist'));

// Default path goes to react
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../', 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});
