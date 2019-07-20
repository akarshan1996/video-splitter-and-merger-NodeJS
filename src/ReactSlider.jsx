import React, { Component } from 'react';
import styles from './styles';
import { RangeSlider } from 'reactrangeslider'; // eslint-disable-line import/no-unresolved

export default class SliderControlled extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: {
        start: -10,
        end: 10,
      }
    }
  }

  onChange = (value) => {
    this.setState({ value });
  }

  render() {
    const { value } = this.state;
    return (
      <div style={styles.root}>
         <div style={styles.sliderWrapper}>
         <RangeSlider
            step={1}
            value={value}
            min={-10}
            max={10}
            onChange={this.onChange}
            wrapperStyle={styles.slider}
            trackStyle={styles.trackStyle}
            highlightedTrackStyle={styles.highlightedTrackStyle}
            handleStyle={styles.handleStyle}
            hoveredHandleStyle={styles.hoveredHandleStyle}
            focusedHandleStyle={styles.focusedHandleStyle}
            activeHandleStyle={styles.activeHandleStyle}
          />
        </div>
        <div>
          <span style={styles.valueText}>Start value: {value.start}</span>
          <span style={styles.valueText}>End value: {value.end}</span>
        </div>
      </div>
    )
  }
}