import React, { Component} from 'react'
import './ChatMessage.css'
import {timeDifference} from './utils'

class ChatMessage extends Component {

  render() {

    const createdAtTimestamp = new Date(this.props.time).getTime()
    const nowTimestamp = new Date().getTime()
    const ago = timeDifference(nowTimestamp, createdAtTimestamp)

    return (
      <div className='ChatMessage'>
        <div className='MessageHeader'>
          <div className='Username'>{this.props.username}</div>
          <div className='Time'>({ago})</div>
        </div>
        <div className='Message'>{this.props.message}</div>
      </div>
    )
  }

}

export default ChatMessage

ChatMessage.propTypes = {
  message: React.PropTypes.string.isRequired,
  username: React.PropTypes.string.isRequired,
  time: React.PropTypes.string.isRequired,
}
