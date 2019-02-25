import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Progress, Button, Row, Col, Card
} from 'reactstrap';
// import Container from 'reactstrap/lib/Container';
import CardBody from 'reactstrap/lib/CardBody';
import Sound from 'react-sound';
import Badge from 'reactstrap/lib/Badge';

class VotingView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeRemaining: -1,
      votingInterval: null
    };
  }

  componentDidMount() {
    this.startInterval();
  }

  componentDidUpdate() {
    const { votingOpen } = this.props;
    const { votingInterval } = this.state;
    if (votingOpen) {
      this.startInterval();
    } else if (votingInterval) {
      clearInterval(votingInterval);
    }
  }

  startInterval = () => {
    const { votingInterval } = this.state;
    if (votingInterval) {
      return;
    }

    const newInterval = setInterval(() => {
      const { votingOpen, votingEnds } = this.props;
      let timeRemaining = (new Date(votingEnds) - new Date()) / 1000;
      timeRemaining = timeRemaining < 0 ? 0 : timeRemaining;
      if (!votingOpen) {
        this.setState({ timeRemaining: 0 });
        return;
      }
      this.setState({ timeRemaining });
    }, 80);
    this.setState({ votingInterval: newInterval });
  }

  onVote = (name) => {
    const { onCastVote } = this.props;
    onCastVote(name);
  }

  canVote = (name, item) => {
    const { votingOpen } = this.props;
    if (!votingOpen) return false;
    if ((item.votes || []).find(s => s.toLowerCase() === name.toLowerCase())) {
      return false;
    }
    return true;
  }

  soundStatus = () => {
    const { votingOpen, soundEnabled } = this.props;
    return votingOpen && soundEnabled ? Sound.status.PLAYING : Sound.status.STOPPED;
  }

  progressColor = (val, max) => {
    const perc = val / max;
    if (perc > 0.5) return 'success';
    if (perc > 0.30) return 'warning';
    return 'danger';
  }


  render() {
    const {
      votables,
      votingOpen,
      name,
      voteDuration
    } = this.props;
    const { timeRemaining } = this.state;
    return (
      <div>
        <Row>
          <Col sm={12}>
            <h4>Time Remaining</h4>
            <Progress
              value={timeRemaining}
              max={voteDuration}
              color={this.progressColor(timeRemaining, voteDuration)}
            />
          </Col>
        </Row>
        <h4>Options</h4>
        <Row>
          <Col xs={12} md={{ size: 10, offset: 1 }}>
            <Row>
              {votables.map(v => (
                <Col xs={12} md={4} key={v.name}>
                  <Card style={{ marginBottom: '20px' }}>
                    <CardBody>
                      <h4 style={{ whiteSpace: 'nowrap', textOverflow: 'ellpisis' }}>{v.name}</h4>
                      <small style={{ whiteSpace: 'nowrap', textOverflow: 'ellpisis' }}>
                        {(v.votes || []).length}
                        <span> members</span>
                      </small>
                      <p>
                        {(v.votes || []).map(n => <Badge key={n} color="info" style={{ marginRight: '5px' }}>{n}</Badge>)}
                      </p>
                    </CardBody>
                    <Button
                      type="button"
                      onClick={() => this.onVote(v.name)}
                      color={!votingOpen ? 'secondary' : 'primary'}
                      disabled={!this.canVote(name, v)}
                    >
                      Vote
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </div>
    );
  }
}

VotingView.defaultProps = {
  soundEnabled: false
};

VotingView.propTypes = {
  /* eslint-disable-next-line */
  socket: PropTypes.object.isRequired,
  onCastVote: PropTypes.func.isRequired,
  votables: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
  votingOpen: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  voteDuration: PropTypes.number.isRequired,
  soundEnabled: PropTypes.bool,
  votingEnds: PropTypes.instanceOf(Date).isRequired
  // roomName: PropTypes.string.isRequired
};

export default VotingView;
