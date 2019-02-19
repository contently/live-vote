import React from 'react';
import PropTypes from 'prop-types';
import {
  Nav, NavItem, Badge
} from 'reactstrap';

const UserRoomStatus = (props) => {
  const { user, currentRoom } = props;
  return (
    <Nav>
      <NavItem>
        <Badge color="info">
          <span>Voting as </span>
          <span>{user}</span>
        </Badge>
      </NavItem>
      <NavItem style={{ marginLeft: '5px' }}>
        <Badge color="warning">
          <span>{currentRoom.name}</span>
        </Badge>
      </NavItem>
    </Nav>
  );
};

UserRoomStatus.propTypes = {
  user: PropTypes.string.isRequired,
  currentRoom: PropTypes.shape({ name: PropTypes.string }).isRequired
};

export default UserRoomStatus;
