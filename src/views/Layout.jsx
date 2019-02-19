import React from 'react';
import PropTypes from 'prop-types';
import {
  Container, Row, Col
} from 'reactstrap';
import TopNav from '../components/TopNav';

const Layout = (props) => {
  const { currentRoom, children, onNavClick } = props;
  const handleNavClick = (item) => {
    onNavClick(item);
  };

  return (
    <>
      <TopNav
        itemClicked={handleNavClick}
        currentRoom={currentRoom}
        users={currentRoom ? currentRoom.users : []}
      />
      <Container fluid>
        <Row>
          <Col xs={12}>
            {children}
          </Col>
        </Row>
      </Container>
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  currentRoom: PropTypes.shape({ name: PropTypes.string }).isRequired,
  onNavClick: PropTypes.func.isRequired
};

export default Layout;
