/* eslint-disable no-console */
const Room = require('./Room');

/**
 * Protocol:
 *
 * - Startup -
 * 1. Connect
 * 2.
 */

class App {
  constructor(io) {
    this.io = io;
    this.state = {
      rooms: {}
    };
  }

  start() {
    this.wireHandlers();
  }

  // Wired Handlers
  onConnect(socket) {
    console.log('client connected');
    this.sendAllRooms(socket);
    socket.on('disconnect', () => {
      Object.keys(this.state.rooms).forEach((r) => {
        console.log('removing user from', r);
        if (this.state.rooms[r]) {
          this.state.rooms[r].removeUserBySocket(socket);
        }
      });
    });
  }

  // Emitters
  sendAllRooms(socket) {
    socket.emit('all-rooms', this.serializedRooms());
  }

  // Helpers
  serializedRooms() {
    const { rooms } = this.state;
    return Object.keys(rooms).map(r => rooms[r].serialized());
  }

  createRoom(roomName, route, io) {
    const slug = roomName ? Room.nameToSlug(roomName) : route;
    this.state.rooms[slug] = new Room(roomName, io);
    io.emit('all-rooms', (Object.keys(this.state.rooms).map(r => this.state.rooms[r].serialized())));
  }

  wireHandlers() {
    const { io } = this;
    io.on('connection', (socket) => {
      this.onConnect(socket);
      socket.on('join-room', (payload) => {
        console.log('join-room', payload);
        const { userName, roomName, route } = payload;
        const slug = roomName ? Room.nameToSlug(roomName) : route;
        if (!this.state.rooms[slug]) {
          if (roomName) {
            this.createRoom(roomName, route, io);
          } else {
            socket.emit('server-error', { message: 'Room does not exist', code: '404' });
          }
        }
        if (this.state.rooms[slug]) {
          socket.join(slug);
          this.state.rooms[slug].addUser(userName, socket);
          socket.emit('room-joined', this.state.rooms[slug].serialized());
          io.emit('room-updated', { room: this.state.rooms[slug].serialized() });
        }
      });

      socket.on('close-room', (payload) => {
        const { roomName, route } = payload;
        const slug = roomName ? Room.nameToSlug(roomName) : route;
        if (!this.state.rooms[slug]) return;
        this.state.rooms[slug].dispose();
        delete this.state.rooms[slug];
        io.emit('all-rooms', (Object.keys(this.state.rooms).map(r => this.state.rooms[r].serialized())));
      });

      socket.on('create-votable', (payload) => {
        // TODO: Capture who did this
        const { roomName, option, route } = payload;
        const slug = roomName ? Room.nameToSlug(roomName) : route;
        if (!this.state.rooms[slug]) return;
        this.state.rooms[slug].addVotable(option);
      });

      socket.on('delete-votable', (payload) => {
        // TODO: Capture who did this
        console.log('delete-votable', payload);
        const { roomName, option, route } = payload;
        const slug = roomName ? Room.nameToSlug(roomName) : route;
        if (!this.state.rooms[slug]) return;
        this.state.rooms[slug].removeVotable(option);
      });

      socket.on('set-vote-duration', (payload) => {
        // TODO: Capture who did this
        console.log('set-vote-duration', payload);
        const { roomName, voteDuration, route } = payload;
        const slug = roomName ? Room.nameToSlug(roomName) : route;

        if (!this.state.rooms[slug]) return;
        this.state.rooms[slug].setVoteDuration(voteDuration);
      });

      socket.on('toggle-voting', (payload) => {
        console.log('toggle-voting', payload);
        const { roomName, route } = payload;
        const slug = roomName ? Room.nameToSlug(roomName) : route;
        if (!this.state.rooms[slug]) return;
        this.state.rooms[slug].toggleVoting();
      });

      socket.on('cast-vote', (payload) => {
        const {
          option, name,
          roomName, route
        } = payload;
        const slug = roomName ? Room.nameToSlug(roomName) : route;
        if (!this.state.rooms[slug]) return;
        this.state.rooms[slug].castVote(name, option);
      });

      socket.on('list-rooms', () => {
        console.log('list-rooms');
        socket.emit('all-rooms', (Object.keys(this.state.rooms).map(r => this.state.rooms[r].serialized())));
      });
    });
  }
}

module.exports = App;
