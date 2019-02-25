import React, { Component } from 'react';
import { observer } from 'mobx-react';
import socketIOClient from 'socket.io-client';
// import PropTypes from 'prop-types';
import cogoToast from 'cogo-toast';
import cookies from 'browser-cookies';
import { Spinner } from 'reactstrap';
import Sound from 'react-sound';
import VotableView from './views/VotableView';
import VotingView from './views/VotingView';
import NameGetter from './components/NameGetter';
import Layout from './views/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import RoomGetter from './components/RoomGetter';
// import If from './components/If';
import UserRoomStatus from './components/UserRoomStatus';
import mp3 from './Jeopardy-theme-song.mp3';

// Local vs. Prod websockets url hack
let host = window.location.origin.replace(/^http/, 'ws');

if (host.includes('localhost')) {
  host = host.replace('8081', '3000');
}

/* eslint-disable */
@observer
class App extends Component {
  state = {
    showOptions: false,
    name: null,
    currentRoomIndex: -1,
    users: [],
    rooms: [],
    connected: false
  }

  constructor(props) {
    super(props);
    this.toastManager = props.toastManager;
    this.socket = socketIOClient(host);

    this.socket.on('room-updated', data => {
      const { room, message } = data;
      this.updateRoom(room);
      if (message) {
        const messageType = message.type || 'success';
        cogoToast[messageType](message.content, {});
      }
    });

    this.socket.on('vote-time-remaining', (payload) => {
      const { rooms } = this.state;
      const { roomName, remaining } = payload;
      const copy = [...rooms];
      const item = copy.find(r => r.name === roomName);
      const currentRoom = this.currentRoom();

      if (item) {
        item.timeRemaining = remaining;
      }
      this.setState({ rooms: copy });
    });

    this.socket.on('users-status', (users) => {
      this.setState({ users });
    });

    this.socket.on('server-error', ({ message, code }) => {
      cogoToast.error(message.content);
      if (code == 404) {
        this.handleNavClick('/');
      }
    });

    this.socket.on('room-joined', (room) => {
      this.handleRoomJoined(room);
    });

    this.socket.on('room-closed', (room) => {
      const currentRoom = this.currentRoom();
      if (!currentRoom) return;
      if (room.name === currentRoom.name) {
        this.handleNavClick('/');
      }
    });

    this.socket.on('all-rooms', (rooms) => {
      const currentRoom = this.currentRoom();
      this.setState({ rooms });
      if (currentRoom && !rooms.find(n => n.name === currentRoom.name)) {
        this.handleNavClick('/');
        cogoToast.success('Room closed');
      }
    });

    this.socket.on('connect', () => {
      const name = cookies.get('name');
      const currentRoom = this.currentRoom();
      if (name) {
        this.handleOnStart(name);
        this.handleRoomRoute();
      }
      if (name && currentRoom) {
        this.handleOnStartRoom(currentRoom.name);
      }
      this.setState({ connected: true });
      // this.socket.emit('list-rooms');
    });

  }

  updateRoom(room) {
    const { rooms } = this.state;
    if (!room) debugger;
    const items = rooms.map(r => {
      if (r.name === room.name) {
        return room;
      }
      return r;
    });
    this.setState({ rooms: items });
  }

  findRoom(room) {
    return this.findRoomByName(room.name);
  }

  findRoomByName(name) {
    const { rooms } = this.state;
    return rooms[this.indexOfRoomByName(name)];
  }

  indexOfRoomByName(name) {
    const { rooms } = this.state;
    for (let x = 0; x < rooms.length; x += 1) {
      if (rooms[x].name === name) {
        return x;
      }
    }
    return -1;
  }

  currentRoom() {
    const { rooms, currentRoomIndex } = this.state;
    return rooms[currentRoomIndex] || null;
  }

  handleRoomRoute() {
    const { location: { pathname } } = window;
    if (pathname && pathname !== '/') {
      this.handleOnStartRoom(null, pathname.substring(1));
    }
  }

  handleRoomJoined(room) {
    const localRoom = this.indexOfRoomByName(room.name);
    if (localRoom >= 0) {
      this.setState({
        currentRoomIndex: localRoom
      });
    } else {
      const { rooms } = this.state;
      this.setState({ rooms: [...rooms, room] });
      this.setState({ currentRoomIndex: rooms.length });
    }
    history.pushState({}, 'room', room.slug);
  }

  handleOnStart = (name) => {
    cookies.set('name', name);
    this.setState({ name });
  }

  handleOnStartRoom = (roomName, route = null) => {
    const { name } = this.state;
    this.socket.emit('join-room', { roomName, route, userName: name });
  }

  toggleshowOptions = () => {
    this.setState({ showOptions: !this.state.showOptions });
  }

  handleNewRound = () => {
    const { socket } = this;
    const { name } = this.state;
    const currentRoom = this.currentRoom();
    socket.emit('new-round', { name, roomName: currentRoom.name });
  }

  handleVotableAdded = (option) => {
    const { socket } = this;
    const { name } = this.state;
    const currentRoom = this.currentRoom();
    socket.emit('create-votable', { option, name, roomName: currentRoom.name });
  }

  handleVotableDelete = (option) => {
    const { socket } = this;
    const { name } = this.state;
    const currentRoom = this.currentRoom();
    socket.emit('delete-votable', { option, roomName: currentRoom.name, name });
  }

  handleSetVoteDuration = (voteDuration) => {
    const { socket } = this;
    const { name } = this.state;
    const currentRoom = this.currentRoom();
    socket.emit('set-vote-duration', { roomName: currentRoom.name, name, voteDuration });
  }

  handleCastVote = (option) => {
    const { socket } = this;
    const { name } = this.state;
    const currentRoom = this.currentRoom();
    socket.emit('cast-vote', { option, name, roomName: currentRoom.name });
  }

  handleClickHome() {
    this.setState({ currentRoomIndex: -1 });
    history.pushState({}, 'home', '/');
  }

  handleNavClick = (which) => {
    switch (which) {
      case 'showOptions':
        this.toggleshowOptions();
        break;
      case 'rooms':
        this.handleClickHome();
        break;
      case '/':
        this.handleClickHome();
        break;
      default:
    }
  }

  handleToggleVoting = () => {
    const { socket } = this;
    const { name } = this.state;
    const currentRoom = this.currentRoom();
    socket.emit('toggle-voting', { name, roomName: currentRoom.name });
  }

  handleToggleSound = () => {
    const { socket } = this;
    const { name } = this.state;
    const currentRoom = this.currentRoom();
    socket.emit('toggle-sound', { name, roomName: currentRoom.name });
  }

  handleCloseRoom = () => {
    const { socket } = this;
    const currentRoom = this.currentRoom();
    socket.emit('close-room', { roomName: currentRoom.name });
  }

  soundStatus = () => {
    const currentRoom = this.currentRoom();
    if (!currentRoom) return Sound.status.STOPPED;
    const { votingOpen, soundEnabled } = currentRoom;
    return votingOpen && soundEnabled ? Sound.status.PLAYING : Sound.status.STOPPED;
  }

  render() {
    const { showOptions,
      name,
      rooms, connected } = this.state;

    if (!connected) {
      return (
        <Layout currentRoom={{ name: 'Loading', users: [] }} onNavClick={this.handleNavClick} showOptions={showOptions}>
          <Spinner color='primary'>Hold tight</Spinner>
        </Layout>
      )
    }

    if (!name) {
      return (
        <Layout currentRoom={{ name: 'Loading', users: [] }} onNavClick={this.handleNavClick} showOptions={showOptions}>
          <NameGetter onStart={this.handleOnStart} />
        </Layout>
      );
    }

    const currentRoom = this.currentRoom();

    if (!currentRoom) {
      return (
        <Layout currentRoom={{ name: 'Loading', users: [] }} onNavClick={this.handleNavClick} showOptions={showOptions}>
          <h4>Join / Create Room</h4>
          <RoomGetter onStart={this.handleOnStartRoom} rooms={rooms || []} />
        </Layout>
      );
    }

    const { votables, votingOpen, voteDuration, soundEnabled } = currentRoom;
    if (showOptions) {
      return (
        <Layout currentRoom={currentRoom} onNavClick={this.handleNavClick} showOptions={showOptions}>
          <Sound
            url={mp3}
            playStatus={this.soundStatus()}
          />
          <VotableView socket={this.socket}
            votingOpen={votingOpen}
            soundEnabled={soundEnabled}
            votables={votables}
            onNewRound={this.handleNewRound}
            onVotableDelete={this.handleVotableDelete}
            onVotableAdded={this.handleVotableAdded}
            onToggleVoting={this.handleToggleVoting}
            onToggleSound={this.handleToggleSound}
            onSetVoteDuration={this.handleSetVoteDuration}
            onCloseRoom={this.handleCloseRoom}
            voteDuration={voteDuration}
            currentRoom={currentRoom} />
        </Layout>
      )
    }

    return (<>
      <Layout currentRoom={currentRoom} onNavClick={this.handleNavClick} showOptions={showOptions}>
        <Sound
          url={mp3}
          playStatus={this.soundStatus()}
        />
        {!showOptions && name && currentRoom &&
          <>
            <UserRoomStatus user={name} currentRoom={currentRoom} />
            <VotingView socket={this.socket}
              votables={currentRoom.votables}
              votingOpen={currentRoom.votingOpen}
              onCastVote={this.handleCastVote}
              timeRemaining={currentRoom.timeRemaining || currentRoom.voteDuration}
              name={name}
              currentRoom={currentRoom.name}
              voteDuration={currentRoom.voteDuration}></VotingView>
          </>
        }
      </Layout>
    </>
    )
  }
}

export default App;
