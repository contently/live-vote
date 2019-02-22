import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';

class ConfirmButton extends Component {
  state = {
    confirm: false
  }

  handleClick = () => {
    const { confirm } = this.state;
    const { onClick, name } = this.props;
    if (confirm) {
      onClick(name);
      this.setState({ confirm: !confirm });
    } else {
      this.setState({ confirm: !confirm });
    }
  }

  render() {
    const {
      confirmText,
      cancelText,
      children,
      name,
      color,
      confirmColor,
      cancelColor,
      disabled
    } = this.props;
    const { confirm } = this.state;
    return (
      <>
        <Button
          name={name}
          type="button"
          color={confirm ? confirmColor : color}
          onClick={this.handleClick}
          disabled={disabled}
        >
          {confirm ? confirmText : children}
        </Button>
        {confirm ? (
          <Button type="button" color={cancelColor} onClick={() => { this.setState({ confirm: false }); }}>{cancelText}</Button>
        ) : <></>}
      </>
    );
  }
}

ConfirmButton.defaultProps = {
  cancelText: 'Cancel',
  confirmText: 'Are you sure?',
  color: 'primary',
  confirmColor: 'danger',
  cancelColor: 'secondary',
  disabled: false
};

ConfirmButton.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  cancelText: PropTypes.string,
  confirmText: PropTypes.string,
  name: PropTypes.string.isRequired,
  color: PropTypes.string,
  confirmColor: PropTypes.string,
  cancelColor: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default ConfirmButton;
