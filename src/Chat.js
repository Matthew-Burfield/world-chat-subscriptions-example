import React, { Component } from 'react'
import './Chat.css'
import ChatInput from './ChatInput'
import ChatMessages from './ChatMessages'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const createMessage = gql`
    mutation createMessage($text: String!, $sentById: ID!) {
        createMessage(text: $text, sentById: $sentById) {
            id
            text
        }
    }
`

const allMessages = gql`
    query allMessages {
        allMessages {
            text
            createdAt
            sentBy {
                name
                location {
                    latitude
                    longitude
                }
            }
        }
    }
`


class Chat extends Component {

  state = {
    message: '',
  }

  componentDidMount() {

    // Subscribe to new messages
    this.createMessageSubscription = this.props.allMessagesQuery.subscribeToMore({
      document: gql`
          subscription {
              createMessage {
                  text
                  createdAt
                  sentBy {
                      name
                      location {
                          latitude
                          longitude
                      }
                  }
              }
          }
      `,
      variables: null,
      updateQuery: (previousState, {subscriptionData}) => {
        const newMessage = subscriptionData.data.createMessage
        const messages = previousState.allMessages.concat([newMessage])

        return {
          allMessages: messages,
        }
      },
      onError: (err) => console.error(err),
    })

  }

  render() {
    return (
      <div className='Chat'>
        <ChatMessages
          messages={this.props.allMessagesQuery.allMessages || []}
        />
        <ChatInput
          message={this.state.message}
          onTextInput={(message) => this.setState({message})}
          onResetText={() => this.setState({message: ''})}
          onSend={this._onSend}
        />
      </div>
    )
  }

  _onSend = () => {
    console.log('Send message: ', this.state.message)
    this.props.createMessageMutation({
      variables: {
        text: this.state.message,
        sentById: this.props.travellerId,
      }
    })
  }

}

export default graphql(createMessage, {name : 'createMessageMutation'})(
  graphql(allMessages, {name: 'allMessagesQuery'})(Chat)
)

