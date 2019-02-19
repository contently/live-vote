import React from 'react';
import PropTypes from 'prop-types';
import {
  Navbar, NavbarBrand, NavItem, Button, Nav
} from 'reactstrap';
import UsersListDropDown from './UsersListDropDown';

const TopNav = (props) => {
  const { itemClicked, currentRoom } = props;
  return (
    <Navbar color="light" light expand="md" sticky="top">
      <NavbarBrand onClick={() => { itemClicked('/'); }} style={{ cursor: 'pointer' }}>
        Live-Vote
      </NavbarBrand>
      <Nav>
        <UsersListDropDown users={currentRoom ? currentRoom.users : []} />
        <NavItem style={{ marginRight: '10px' }}>
          <Button type="button" name="admin" onClick={() => { itemClicked('/'); }}>Rooms</Button>
        </NavItem>
        <NavItem>
          <Button
            type="button"
            name="admin"
            onClick={() => { itemClicked('admin'); }}
            disabled={!currentRoom || currentRoom.name === 'Loading'}
          >
            Admin
          </Button>
        </NavItem>
      </Nav>
    </Navbar>
  );
};

TopNav.propTypes = {
  itemClicked: PropTypes.func.isRequired,
  currentRoom: PropTypes.shape({ name: PropTypes.string }).isRequired,
  //  users: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired
};

export default TopNav;
