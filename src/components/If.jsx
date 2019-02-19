import React from 'react';
import PropTypes from 'prop-types';

const If = (props) => {
  const { condition, children } = props;
  return condition ? children : <></>;
};

If.propTypes = {
  condition: PropTypes.bool.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};

export default If;
