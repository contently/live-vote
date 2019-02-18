/* eslint-disable no-console */
const app = require('express')();
const express = require('express');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const Room = require('./Room');

const state = {
  rooms: {}
};

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    Object.keys(state.rooms).forEach((r) => {
      console.log('removing user from', r);
      if (state.rooms[r]) {
        state.rooms[r].removeUserBySocket(socket);
      }
    });
  });

  socket.on('join-room', (payload) => {
    console.log('join-room', payload);
    const { userName, roomName, route } = payload;
    const slug = roomName ? Room.nameToSlug(roomName) : route;
    if (!state.rooms[slug]) {
      if (roomName) {
        state.rooms[slug] = new Room(roomName, io);
      } else {
        socket.emit('server-error', { message: 'Room does not exist' });
      }
    }
    if (state.rooms[slug]) {
      socket.join(slug);
      state.rooms[slug].addUser(userName, socket);
      socket.emit('room-joined', state.rooms[slug].serialized());
      console.log('state', state);
    }
  });

  socket.on('create-votable', (payload) => {
    // TODO: Capture who did this
    const { roomName, option } = payload;
    const lowerRoomName = roomName.toLowerCase();
    if (!state.rooms[lowerRoomName]) return;
    state.rooms[lowerRoomName].addVotable(option);
  });

  socket.on('delete-votable', (payload) => {
    // TODO: Capture who did this
    console.log('delete-votable', payload);
    const { roomName, option } = payload;
    const lowerRoomName = roomName.toLowerCase();
    if (!state.rooms[lowerRoomName]) return;
    state.rooms[lowerRoomName].removeVotable(option);
  });

  socket.on('set-vote-duration', (payload) => {
    // TODO: Capture who did this
    console.log('set-vote-duration', payload);
    const { roomName, voteDuration } = payload;
    const lowerRoomName = roomName.toLowerCase();

    if (!state.rooms[lowerRoomName]) return;
    state.rooms[lowerRoomName].setVoteDuration(voteDuration);
  });

  socket.on('toggle-voting', (payload) => {
    console.log('toggle-voting', payload);
    const { roomName } = payload;
    const lowerRoomName = roomName.toLowerCase();
    if (!state.rooms[lowerRoomName]) return;
    state.rooms[lowerRoomName].toggleVoting();
  });

  socket.on('cast-vote', (payload) => {
    const { option, name, roomName } = payload;
    const lowerRoomName = roomName.toLowerCase();
    if (!state.rooms[lowerRoomName]) return;
    state.rooms[lowerRoomName].castVote(name, option);
  });

  socket.on('list-rooms', () => {
    socket.emit('all-rooms', (Object.keys(state.rooms).map(r => state.rooms[r].serialized())));
  });
});

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
