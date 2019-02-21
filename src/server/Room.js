/* eslint-disable no-console */
class Room {
  static nameToSlug(name) {
    return name.toLowerCase().trim().replace(/([^a-zA-Z0-9])/g, '-').replace(/(-{2})/g, '-');
  }

  constructor(name, socketIo, persistence) {
    this.name = name;
    this.io = socketIo;
    this.votables = [];
    this.votingOpen = false;
    this.users = [];
    this.voteDuration = (33 * 4);
    this.votingEnds = 0;
    this.votingInterval = null;
    this.soundEnabled = false;
    this.slug = Room.nameToSlug(name);
    this.persistence = persistence;
  }

  addUser(name, socket) {
    let user = this.users.find(u => u.name === name);
    if (!user) {
      user = { name, socket, status: 'online' };
      this.users.push(user);
    }
    user.status = 'online';
    user.socket = socket;
    this.updateRoom();
    this.broadcast('room-updated', { room: this.serialized(), message: { content: `${name} joined ${this.name}`, type: 'success' } });
  }

  removeUser(name) {
    this.users = this.users.map((u) => {
      if (u.name === name) {
        return { ...u, status: 'offline' };
      }
      return u;
    });
    this.updateRoom();
    this.broadcast('room-updated', { room: this.serialized(), message: { content: `${name} left  ${this.name}`, type: 'warn' } });
  }

  removeUserBySocket(socket) {
    const user = this.users.find(u => u.socket === socket);
    if (user) this.removeUser(user.name);
  }

  addVotable(name) {
    if (this.votables.find(v => v.name === name)) return;
    this.votables.push({ name, votes: [] });
    this.updateRoom();
    this.broadcast('room-updated', { room: this.serialized() });
  }

  removeVotable(name) {
    this.votables = this.votables.filter(v => v.name !== name);
    this.updateRoom();
    this.broadcast('room-updated', { room: this.serialized() });
  }

  setVoteDuration(duration) {
    if (!duration || duration < 0) {
      // return this.sendError('Invalid duration');
      this.voteDuration = 0;
    } else {
      this.voteDuration = duration;
    }
    this.updateRoom();
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
    this.updateRoom();
    return this.broadcast('room-updated', { room: this.serialized() });
  }

  toggleVoting() {
    this.votingOpen = !this.votingOpen;
    if (this.votingOpen) {
      this.startTimer();
      this.updateRoom();
      this.broadcast('room-updated', { room: this.serialized(), message: { content: `${this.name} voting opened`, type: 'success' } });
    } else {
      this.stopTimer();
      this.updateRoom();
      this.broadcast('room-updated', { room: this.serialized(), message: { content: `${this.name} voting ended`, type: 'warn' } });
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.broadcast('room-updated', { room: this.serialized(), message: { content: `${this.name} sound toggled`, type: 'success' } });
    this.updateRoom();
  }

  startTimer() {
    this.votingEnds = new Date().setSeconds(
      new Date().getSeconds() + this.voteDuration
    );
    this.votingInterval = setInterval(() => {
      const remaining = this.voteTimeRemaining() > 0 ? this.voteTimeRemaining() : 0;
      this.broadcast('vote-time-remaining', { roomName: this.name, remaining });
      if (Math.floor(this.voteTimeRemaining()) % 3 === 0) {
        this.persistChanges();
      }
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
    console.log('broadcast', `room: ${this.name}`, `action: ${action}`, payload);
    this.io.in(this.slug).emit(action, payload);
  }

  dispose() {
    console.log('dispose', this.name);
    this.stopTimer();
    this.broadcast('room-closed', { room: this.serialized() });
  }

  updateRoom() {
    this.persistChanges();
  }

  async persistChanges() {
    this.persistence.persist(`rooms/${this.slug}/data`, this.serialized());
  }

  async loadFromPersistence() {
    const data = await this.persistence.load(`rooms/${this.slug}/data`);
    console.log(this.serialized());
    Object.assign(this, data);
    console.log(this.serialized());
  }

  serialized() {
    const {
      users, votables, votingOpen, votingEnds, voteDuration, name, slug, soundEnabled
    } = this;
    return {
      users: users.map(u => ({ name: u.name, status: u.status })),
      votables,
      votingOpen,
      votingEnds,
      voteDuration,
      name,
      slug,
      soundEnabled,
      timeRemaining: this.voteTimeRemaining()
    };
  }
}

module.exports = Room;
