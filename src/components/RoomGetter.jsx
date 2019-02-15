import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from 'reactstrap/lib/Button';
import {
  Form, Label, Input, FormGroup
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

  render() {
    return (
      <Form onSubmit={this.handleOnSubmit}>
        <FormGroup>
          <Label htmlFor="name">
          What are you voting on?
            <Input type="text" name="name" onChange={this.handleChange} autoComplete="off" />
          </Label>
        </FormGroup>
        <FormGroup>
          <Button type="submit" color="primary">Start</Button>
        </FormGroup>
      </Form>
    );
  }
}

RoomGetter.propTypes = {
  onStart: PropTypes.func.isRequired,
};

export default RoomGetter;
