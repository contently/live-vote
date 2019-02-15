import React from 'react';
import PropTypes from 'prop-types';
import {
  UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Badge
} from 'reactstrap';

const UsersListDropDown = (props) => {
  const { users } = props;
  return (
    <UncontrolledDropdown nav inNavbar>
      <DropdownToggle nav caret>
        <Badge color="success">
          <span>{(users || []).length}</span>
          <span> users</span>
        </Badge>
      </DropdownToggle>
      <DropdownMenu right>
        {(users || []).map(u => (
          <DropdownItem key={u.name}>
            {u.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
};

UsersListDropDown.propTypes = {
  users: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired
};

export default UsersListDropDown;
