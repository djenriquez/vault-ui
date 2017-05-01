// Based on https://raw.githubusercontent.com/rogermarkussen/react.timer/master/src/countdown.js

import React, { PropTypes, Component } from 'react'

class CountDown extends Component {


    static propTypes = {
        countDown: PropTypes.number,
        retrigger: PropTypes.number,
        className: PropTypes.string
    }

    constructor(props) {
        super(props)
        this.state = { time: props.countDown * 10 }
        this.tick = this.tick.bind(this)
        this.splitTimeComponents = this.splitTimeComponents.bind(this)
        this.stopTime = Date.now() + (props.countDown * 1000)
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps !== this.props) {
            clearInterval(this.time);
            this.time = nextProps.countDown;
            this.stopTime = Date.now() + (nextProps.countDown * 1000)
            this.time = setInterval(this.tick, 100)
        }
    }

    componentDidMount() {
        this.time = setInterval(this.tick, 100)
    }

    componentWillUnmount() {
        clearInterval(this.time)
    }

    splitTimeComponents() {
        const time = this.state.time / 10
        var delta = Math.floor(time)
        var days = Math.floor(delta / 86400);
        delta -= days * 86400;
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;
        var seconds = delta % 60;

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    tick() {
        const now = Date.now()
        if (this.stopTime - now <= 0) {
            this.setState({ time: 0 })
            clearInterval(this.time)
        } else this.setState({ time: Math.round((this.stopTime - now) / 100) })
    }

    render() {
        return <span className={this.props.className}>{this.splitTimeComponents()}</span>
    }
}
CountDown.propTypes = {
    countDown: PropTypes.number.isRequired
}
export default CountDown
