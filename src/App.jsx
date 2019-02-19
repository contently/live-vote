import React, { Component } from 'react';
import { observer } from 'mobx-react';
import socketIOClient from 'socket.io-client';
// import PropTypes from 'prop-types';
import cogoToast from 'cogo-toast';
import cookies from 'browser-cookies';
import VotableView from './views/VotableView';
import VotingView from './views/VotingView';
import NameGetter from './components/NameGetter';
import Layout from './views/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import RoomGetter from './components/RoomGetter';
import If from './components/If';

let host = window.location.origin.replace(/^http/, 'ws');

if (host.includes('localhost')) {
  host = host.replace('8081', '3000');
}

/* eslint-disable */
@observer
class App extends Component {
  state = {
    admin: false,
    votingOpen: false,
    name: null,
    currentRoom: null,
    votables: [],
    timeRemaining: 300,
    users: [],
    voteDuration: 120,
    rooms: [],
    connected: false
  }

  constructor(props) {
    super(props);
    this.toastManager = props.toastManager;
    this.socket = socketIOClient(host);

    this.socket.on('room-updated', data => {
      console.log('room-updated', data);
      const { room, message } = data;

      this.setState({
        votables: room.votables,
        users: room.users,
        voteDuration: room.voteDuration,
        votingOpen: room.votingOpen
      });
      if (message) {
        const messageType = message.type || 'success';
        cogoToast[messageType](message.content, {});
      }
    });

    this.socket.on('voting-status', (payload) => {
      this.setState({ votingOpen: payload });
      if (payload) {
        cogoToast.success('Voting opened');
      }
    });

    this.socket.on('vote-time-remaining', (payload) => {
      this.setState({ timeRemaining: payload });
    });

    this.socket.on('users-status', (users) => {
      this.setState({ users });
    });

    this.socket.on('server-error', ({ message }) => {
      cogoToast.error(message);
    });

    this.socket.on('room-joined', (room) => {
      this.handleRoomJoined(room);
    });

    this.socket.on('all-rooms', (rooms) => {
      const { currentRoom } = this.state;
      this.setState({ rooms });
      if (currentRoom && !rooms.find(n => n.name === currentRoom.name)) {
        this.handleNavClick('/');
        //this.setState({ admin: false });
        cogoToast.success('Room closed');
      }
    });

    this.socket.on('connect', () => {
      const name = cookies.get('name');
      const { currentRoom } = this.state;
      if (name) {
        this.handleOnStart(name);
        this.handleRoomRoute();
      }
      if (name && currentRoom) {
        this.handleOnStartRoom(currentRoom.name);
      }
      this.setState({ connected: true });
      this.socket.emit('list-rooms');
    });

  }

  handleRoomRoute() {
    const { location: { pathname } } = window;
    if (pathname && pathname !== '/') {
      this.handleOnStartRoom(null, pathname.substring(1));
    }
  }

  handleRoomJoined(room) {
    this.setState({
      currentRoom: room
    });
    history.pushState({}, 'room', room.slug);
  }

  handleOnStart = (name) => {
    cookies.set('name', name);
    this.setState({ name });
  }

  handleOnStartRoom = (roomName, route = null) => {
    const { name } = this.state;
    //this.setState({ currentRoom });
    this.socket.emit('join-room', { roomName, route, userName: name });
    //history.pushState({}, 'room', currentRoom);
  }

  toggleAdmin = () => {
    this.setState({ admin: !this.state.admin });
  }

  handleVotableAdded = (option) => {
    const { socket } = this;
    const { currentRoom, name } = this.state;
    socket.emit('create-votable', { option, name, roomName: currentRoom.name });
  }

  handleVotableDelete = (option) => {
    const { socket } = this;
    const { currentRoom, name } = this.state;
    socket.emit('delete-votable', { option, roomName: currentRoom.name, name });
  }

  handleSetVoteDuration = (voteDuration) => {
    const { socket } = this;
    const { currentRoom, name } = this.state;
    console.log(currentRoom);
    socket.emit('set-vote-duration', { roomName: currentRoom.name, name, voteDuration });
  }

  handleCastVote = (option) => {
    const { socket } = this;
    const { name, currentRoom } = this.state;
    socket.emit('cast-vote', { option, name, roomName: currentRoom.name });
  }

  handleClickHome() {
    this.setState({ currentRoom: null });
    history.pushState({}, 'home', '/');
  }

  handleNavClick = (which) => {
    switch (which) {
      case 'admin':
        this.toggleAdmin();
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
    const { name, currentRoom } = this.state;
    socket.emit('toggle-voting', { name, roomName: currentRoom.name });
  }

  handleCloseRoom = () => {
    const { currentRoom } = this.state;
    const { socket } = this;
    socket.emit('close-room', { roomName: currentRoom.name });
  }

  render() {
    const { admin, name,
      currentRoom, votables,
      votingOpen, voteDuration,
      timeRemaining, users, rooms, connected } = this.state;
    if (!connected) {
      return (
        <Layout currentRoom={currentRoom} onNavClick={this.handleNavClick}></Layout>
      )
    }
    return (<>
      <Layout currentRoom={currentRoom} onNavClick={this.handleNavClick}>
        <If condition={name === null}>
          <NameGetter onStart={this.handleOnStart} />
        </If>
        <If condition={currentRoom === null}>
          <RoomGetter onStart={this.handleOnStartRoom} rooms={rooms || []} />
        </If>
        {admin && currentRoom &&
          <VotableView socket={this.socket}
            votingOpen={votingOpen}
            votables={votables}
            onVotableDelete={this.handleVotableDelete}
            onVotableAdded={this.handleVotableAdded}
            onToggleVoting={this.handleToggleVoting}
            onSetVoteDuration={this.handleSetVoteDuration}
            onCloseRoom={this.handleCloseRoom}
            voteDuration={voteDuration}
            currentRoom={currentRoom} />
        }
        {!admin && name && currentRoom &&
          <VotingView socket={this.socket}
            votables={votables}
            votingOpen={votingOpen}
            onCastVote={this.handleCastVote}
            timeRemaining={timeRemaining}
            name={name}
            currentRoom={currentRoom.name}
            voteDuration={voteDuration}></VotingView>
        }
      </Layout>
    </>
    )
  }
}

export default App;
