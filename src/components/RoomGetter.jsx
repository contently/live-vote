import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Form, Label, Input, FormGroup, Button, Badge
} from 'reactstrap';


class RoomGetter extends Component {
  state = {
    name: ''
  };

  handleOnSubmit = (e) => {
    const { onStart } = this.props;
    const { name } = this.state;
    e.preventDefault();
    onStart(name);
  };

  handleChange = (e) => {
    const { state } = this;
    const newState = { ...state };
    newState[e.target.name] = e.target.value;
    this.setState(newState);
  };

  handleRoomClick(name) {
    const { onStart } = this.props;
    onStart(name);
  }

  render() {
    const { rooms } = this.props;
    const { name } = this.state;
    return (
      <Form onSubmit={this.handleOnSubmit}>
        <FormGroup>
          <Label htmlFor="name">
            What are you voting on?
            <Input type="text" name="name" onChange={this.handleChange} autoComplete="off" />
          </Label>
          <Button type="submit" color="primary" disabled={name.trim().length === 0}>Join &gt;&gt; </Button>
        </FormGroup>
        <h4>Rooms</h4>
        {(rooms || []).map(r => (
          <Button
            key={r.name}
            type="button"
            onClick={() => { this.handleRoomClick(r.name); }}
          >
            <span>
              {r.name}
              &nbsp;
            </span>
            <Badge color="warning">{r.users.filter(u => u.status === 'online').length}</Badge>
          </Button>
        ))}
      </Form>
    );
  }
}

RoomGetter.propTypes = {
  onStart: PropTypes.func.isRequired,
  rooms: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired
};

export default RoomGetter;
