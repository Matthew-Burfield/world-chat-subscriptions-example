import React, { Component} from 'react'
import './ChatMessages.css'
import ChatMessage from './ChatMessage'

class ChatMessages extends Component {

  render() {
    return (
      <div className='ChatMessages'>
        {this.props.messages.map((message, i) => {
          return (<ChatMessage
            key={i}
            message={message.text}
            username={message.sentBy.name}
            time={message.createdAt}
          />)
        })}
      </div>
    )
  }

}

export default ChatMessages

ChatMessages.propTypes = {

}
