const app = require('express')();
const express = require('express');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

const state = {
  votables: [],
  votingOpen: false,
  votingEnds: 0,
  votingInterval: null,
  rooms: {}
};

class Room {
  constructor(name, socketIo) {
    this.name = name;
    this.io = socketIo;
    this.votables = [];
    this.votingOpen = false;
    this.users = [];
    this.voteDuration = 120;
    this.votingEnds = 0;
    this.votingInterval = null;
  }

  addUser(name, socket) {
    if (!this.users.find(u => u.name === name)) {
      this.users.push({ name, socket });
    }
    this.broadcast('room-updated', { room: this.serialized(), message: { content: `${name} joined`, type: 'success' } });
  }

  removeUser(name) {
    this.users = this.users.filter(u => u.name !== name);
    this.broadcast('room-updated', { room: this.serialized(), message: { content: `${name} left`, type: 'warn' } });
  }

  removeUserBySocket(socket) {
    const user = this.users.find(u => u.socket === socket);
    if (user) this.removeUser(user.name);
  }

  addVotable(name) {
    if (this.votables.find(v => v.name === name)) return;
    this.votables.push({ name, votes: [] });
    this.broadcast('room-updated', { room: this.serialized() });
  }

  removeVotable(name) {
    this.votables = this.votables.filter(v => v.name !== name);
    this.broadcast('room-updated', { room: this.serialized() });
  }

  setVoteDuration(duration) {
    if (!duration || duration < 0) {
      // return this.sendError('Invalid duration');
      this.voteDuration = 0;
    } else {
      this.voteDuration = duration;
    }
    return this.broadcast('room-updated', { room: this.serialized() });
  }

  castVote(name, option) {
    const votable = this.votables.find(f => f.name === option);
    if (!votable) return this.sendError('Invalid option');

    this.votables = this.votables.map((v) => {
      const votesCopy = { ...v };
      votesCopy.votes = v.votes.filter(vv => vv !== name);
      if (v.name === option) {
        votesCopy.votes.push(name);
      }
      return votesCopy;
    });
    return this.broadcast('room-updated', { room: this.serialized() });
  }

  toggleVoting() {
    this.votingOpen = !this.votingOpen;
    this.broadcast('voting-status', this.votingOpen);
    if (this.votingOpen) {
      this.startTimer();
    } else {
      this.stopTimer();
    }
  }

  startTimer() {
    this.votingEnds = new Date().setSeconds(
      new Date().getSeconds() + this.voteDuration
    );
    this.votingInterval = setInterval(() => {
      const remaining = this.voteTimeRemaining() > 0 ? this.voteTimeRemaining() : 0;
      this.broadcast('vote-time-remaining', remaining);
      if (this.voteTimeRemaining() < 0) {
        this.toggleVoting();
      }
    }, 120);
  }

  stopTimer() {
    clearInterval(this.votingInterval);
    this.sendError('voting ended');
  }

  voteTimeRemaining() {
    return (this.votingEnds - new Date()) / 1000;
  }

  sendError(message, payload = null) {
    this.broadcast('error', { message, payload });
  }

  broadcast(action, payload) {
    console.log('broadcast', action, payload);
    this.io.in(this.name).emit(action, payload);
  }

  serialized() {
    const {
      users, votables, votingOpen, votingEnds, voteDuration
    } = this;
    return {
      users: users.map(u => ({ name: u.name })),
      votables,
      votingOpen,
      votingEnds,
      voteDuration
    };
  }
}

app.use(express.static('dist'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../', 'dist', 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    Object.keys(state.rooms).forEach((r) => {
      console.log('removing user from ', r);
      if (state.rooms[r]) {
        state.rooms[r].removeUserBySocket(socket);
      }
    });
  });

  socket.on('join-room', (payload) => {
    const { userName, roomName } = payload;
    const lowerRoomName = roomName.toLowerCase();
    if (!state.rooms[lowerRoomName]) {
      state.rooms[lowerRoomName] = new Room(lowerRoomName, io);
    }
    socket.join(lowerRoomName);
    state.rooms[lowerRoomName].addUser(userName, socket);
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
});

const port = process.env.PORT || 3000;

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});
