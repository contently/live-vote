import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Form, Button, Label, FormGroup, Input
} from 'reactstrap';
import ConfirmButton from '../components/ConfirmButton';

class VotableView extends Component {
  state = {
    name: ''
  };

  constructor(props) {
    super(props);
    this.state.socket = props.socket;
  }

  handleOnSubmit = (e) => {
    const { name } = this.state;
    const { onVotableAdded } = this.props;
    e.preventDefault();
    if (name.trim().length > 0) {
      onVotableAdded(name);
      this.setState({ name: '' });
    }
  };

  handleChange = (e) => {
    this.setState({ name: e.target.value });
  };

  handleDurationChange = (e) => {
    const { onSetVoteDuration } = this.props;
    const voteDuration = parseInt(e.target.value, 10);
    /* eslint-disable-next-line */
    if (isNaN(voteDuration)) {
      onSetVoteDuration(0);
    } else {
      onSetVoteDuration(voteDuration);
    }
  };

  handleCloseRoom = () => {
    const { onCloseRoom } = this.props;
    onCloseRoom();
  }

  handleNewRound = () => {
    const { onNewRound } = this.props;
    onNewRound();
  }

  deleteItem = (name) => {
    const { onVotableDelete } = this.props;
    onVotableDelete(name);
  }

  toggleVoting = () => {
    const { onToggleVoting } = this.props;
    onToggleVoting();
  }

  toggleSound = () => {
    const { onToggleSound } = this.props;
    onToggleSound();
  }

  newRoundEnabled = () => {
    const { votables } = this.props;
    return votables.length > 1 && votables.find(v => v.votes.length > 0);
  }

  render() {
    const { name } = this.state;
    const {
      votables,
      votingOpen,
      voteDuration,
      soundEnabled
    } = this.props;

    return (
      <Form onSubmit={this.handleOnSubmit}>
        <h4>Voting</h4>
        {votingOpen ? <Button type="button" onClick={this.toggleVoting} color="danger">Close Voting</Button>
          : <Button type="button" onClick={this.toggleVoting} color="success" disabled={!(votables.length > 1)}>Open Voting</Button>}
        {soundEnabled ? <Button type="button" onClick={this.toggleSound} color="danger">Turn Sound Off</Button>
          : <Button type="button" onClick={this.toggleSound} color="success">Turn Sound On</Button>}
        <ConfirmButton type="button" onClick={this.handleNewRound} color="warning" disabled={!this.newRoundEnabled()}>New Voting Round</ConfirmButton>
        <h4>Settings</h4>
        <ConfirmButton name="close-room" color="warning" cancelColor="none" confirmText="Sure?" onClick={this.handleCloseRoom}>Close Room</ConfirmButton>
        <FormGroup disabled={votingOpen}>
          <Label htmlFor="name">
            Vote Duration (seconds):
            <Input type="text" onChange={this.handleDurationChange} name="voteDuration" value={voteDuration} disabled={votingOpen} />
          </Label>
        </FormGroup>
        <h4>Options</h4>
        <FormGroup disabled={votingOpen}>
          <Label htmlFor="name">
            Option Name:
            <Input type="text" onChange={this.handleChange} value={name} name="name" disabled={votingOpen} />
          </Label>
          <Button type="submit" disabled={name.trim().length === 0 || votingOpen}>+</Button>
        </FormGroup>
        {votables.map(n => (
          <div key={n.name}>
            <Button type="button" onClick={() => this.deleteItem(n.name)}>-</Button>
            {n.name}
          </div>
        ))}
      </Form>
    );
  }
}

VotableView.propTypes = {
  onNewRound: PropTypes.func.isRequired,
  onVotableAdded: PropTypes.func.isRequired,
  onVotableDelete: PropTypes.func.isRequired,
  onToggleVoting: PropTypes.func.isRequired,
  onToggleSound: PropTypes.func.isRequired,
  onSetVoteDuration: PropTypes.func.isRequired,
  onCloseRoom: PropTypes.func.isRequired,
  votables: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
  votingOpen: PropTypes.bool.isRequired,
  voteDuration: PropTypes.number.isRequired,
  soundEnabled: PropTypes.bool.isRequired,
  /* eslint-disable-next-line */
  socket: PropTypes.object.isRequired
};

export default VotableView;
