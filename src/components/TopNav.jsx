import React from 'react';
import PropTypes from 'prop-types';
import {
  Navbar, NavbarBrand, NavItem, Button, Nav
} from 'reactstrap';
import UsersListDropDown from './UsersListDropDown';

const TopNav = (props) => {
  const { itemClicked, users } = props;
  return (
    <Navbar color="light" light expand="md" sticky="top">
      <NavbarBrand>
        Live-Vote
      </NavbarBrand>
      <Nav>
        <UsersListDropDown users={users} />
        <NavItem>
          <Button type="button" name="admin" onClick={() => { itemClicked('admin'); }}>Admin</Button>
        </NavItem>
      </Nav>
    </Navbar>
  );
};

TopNav.propTypes = {
  itemClicked: PropTypes.func.isRequired,
  users: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired
};

export default TopNav;
