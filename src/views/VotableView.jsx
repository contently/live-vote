import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Form, Button, Label, FormGroup, Input
} from 'reactstrap';

class VotableView extends Component {
  state = {
    name: ''
  };

  constructor(props) {
    super(props);
    this.state.socket = props.socket;
    console.log('votable-view');
  }

  handleOnSubmit = (e) => {
    const { name } = this.state;
    const { onVotableAdded } = this.props;
    e.preventDefault();
    onVotableAdded(name);
    this.setState({ name: '' });
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

  deleteItem = (name) => {
    const { onVotableDelete } = this.props;
    onVotableDelete(name);
  }

  toggleVoting = () => {
    const { onToggleVoting } = this.props;
    onToggleVoting();
  }

  render() {
    const { name } = this.state;
    const { votables, votingOpen, voteDuration } = this.props;
    return (
      <Form onSubmit={this.handleOnSubmit}>
        <h4>Voting</h4>
        {votingOpen ? <Button type="button" onClick={this.toggleVoting} color="danger">Close Voting</Button>
          : <Button type="button" onClick={this.toggleVoting} color="success" disabled={!(votables.length > 1)}>Open Voting</Button>}
        <h4>Settings</h4>
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
          <Button type="submit" disabled={votingOpen}>+</Button>
        </FormGroup>
        {votables.map(n => (
          <div key={n.name}>
            <Button type="button" onClick={() => this.deleteItem(n.name)}>-</Button>
            {n.name}
          </div>
        ))}
        <Button type="button" color="danger" onClick={this.handleCloseRoom}>Close Room</Button>
      </Form>
    );
  }
}

VotableView.propTypes = {
  onVotableAdded: PropTypes.func.isRequired,
  onVotableDelete: PropTypes.func.isRequired,
  onToggleVoting: PropTypes.func.isRequired,
  onSetVoteDuration: PropTypes.func.isRequired,
  onCloseRoom: PropTypes.func.isRequired,
  votables: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
  votingOpen: PropTypes.bool.isRequired,
  voteDuration: PropTypes.number.isRequired,
  /* eslint-disable-next-line */
  socket: PropTypes.object.isRequired
};

export default VotableView;
