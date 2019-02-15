import React, { Component } from 'react';
import { observer } from 'mobx-react';
import socketIOClient from 'socket.io-client';
// import PropTypes from 'prop-types';
import {
  Container, Row, Col, Badge
} from 'reactstrap';
import cogoToast from 'cogo-toast';
import cookies from 'browser-cookies';
import VotableView from './components/VotableView';
import VotingView from './components/VotingView';
import NameGetter from './components/NameGetter';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import TopNav from './components/TopNav';
import RoomGetter from './components/RoomGetter';

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
    roomName: null,
    votables: [],
    timeRemaining: 300,
    users: [],
    voteDuration: 120
  }

  constructor(props) {
    super(props);
    console.log(props);
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

    this.socket.on('error', ({ message }) => {
      cogoToast.error(message);
    });

    this.socket.on('connect', () => {
      const name = cookies.get('name');
      if (name) {
        this.handleOnStart(name);
      }
    });
  }

  handleOnStart = (name) => {
    this.setState({ name });
    cookies.set('name', name);
  }

  handleOnStartRoom = (roomName) => {
    const { name } = this.state;
    this.setState({ roomName });
    this.socket.emit('join-room', { roomName, userName: name });
  }

  toggleAdmin = () => {
    this.setState({ admin: !this.state.admin });
  }

  handleVotableAdded = (option) => {
    const { socket } = this;
    const { roomName, name } = this.state;
    socket.emit('create-votable', { option, name, roomName });
  }

  handleVotableDelete = (option) => {
    const { socket } = this;
    const { roomName, name } = this.state;
    socket.emit('delete-votable', { option, roomName, name });
  }

  handleSetVoteDuration = (voteDuration) => {
    const { socket } = this;
    const { roomName, name } = this.state;
    socket.emit('set-vote-duration', { roomName, name, voteDuration });
  }

  handleCastVote = (option) => {
    const { socket } = this;
    const { name, roomName } = this.state;
    socket.emit('cast-vote', { option, name, roomName });
  }

  handleNavClick = (which) => {
    switch (which) {
      case 'admin':
        this.toggleAdmin();
      default:
    }
  }

  handleToggleVoting = () => {
    const { socket } = this;
    const { name, roomName } = this.state;
    socket.emit('toggle-voting', { name, roomName });
  }

  render() {
    const { admin, name,
      roomName, votables,
      votingOpen, voteDuration,
      timeRemaining, users } = this.state;

    if (admin) {
      return (<><TopNav itemClicked={this.handleNavClick} users={users} />
        <Container fluid>
          <Row>
            <div className='col-sm-12'>
              <VotableView socket={this.socket}
                votingOpen={votingOpen}
                votables={votables}
                onVotableDelete={this.handleVotableDelete}
                onVotableAdded={this.handleVotableAdded}
                onToggleVoting={this.handleToggleVoting}
                onSetVoteDuration={this.handleSetVoteDuration}
                voteDuration={voteDuration}
                roomName={roomName} />
              <button type='button' onClick={this.toggleAdmin} >Finish</button>
            </div>
          </Row>
        </Container></>);
    } else {
      if (!name) {
        return (<>
          <TopNav itemClicked={this.handleNavClick} users={users} />
          <NameGetter onStart={this.handleOnStart} />
        </>);
      }
      if (!roomName) {
        return (<>
          <TopNav itemClicked={this.handleNavClick} users={users} />
          <RoomGetter onStart={this.handleOnStartRoom} />
        </>);
      }
      return (
        <>
          <TopNav itemClicked={this.handleNavClick} users={users} />
          <Container fluid>
            <Row>
              <Col sm={12}>
                <Badge color="info" onClick={() => { alert('hello') }}>
                  <span>Voting as </span>
                  <span><strong>{name}</strong></span>
                </Badge>
                &nbsp;
                <Badge color="warning">
                  <span>{roomName}</span>
                </Badge>
              </Col>
            </Row>
            <Row noGutters className='justify-content-center align-items-center'>
              <Col sm={12}>
                <div>
                  <VotingView socket={this.socket}
                    votables={votables}
                    votingOpen={votingOpen}
                    onCastVote={this.handleCastVote}
                    timeRemaining={timeRemaining}
                    name={name}
                    roomName={roomName}
                    voteDuration={voteDuration}></VotingView>
                </div>
              </Col>
            </Row>
          </Container>
        </>
      )
    }
  }
}

export default App;
