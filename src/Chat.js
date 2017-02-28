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
            createdAt
            sentBy {
                id
                name
            }
        }
    }
`

const allMessages = gql`
    query allMessages {
        allMessages {
            id
            text
            createdAt
            sentBy {
                id
                name
            }
        }
    }
`


class Chat extends Component {

  state = {
    message: '',
  }

  componentDidMount() {

    // Subscribe to `CREATED`-mutations
    this.createMessageSubscription = this.props.allMessagesQuery.subscribeToMore({
      document: gql`
          subscription {
              Message(filter: {
                  mutation_in: [CREATED]
              }) {
                  node {
                      id
                      text
                      createdAt
                      sentBy {
                          id
                          name
                      }
                  }
              }
          }
      `,
      updateQuery: (previousState, {subscriptionData}) => {
        // console.log('Chat - received subscription: ', previousState, subscriptionData)
        const newMessage = subscriptionData.data.Message.node
        const messages = previousState.allMessages.concat([newMessage])
        // console.log('Chat - new messages: ', messages.length, messages) // prints the correct array with the new message!!
        return {
          allMessages: messages
        }
      },
      onError: (err) => console.error(err),
    })

  }

  componentWillReceiveProps(nextProps) {
    // console.log('Chat - componentWillReceiveProps: ', nextProps)
  }

  render() {

    // console.log('Chat - render: ', this.props.allMessagesQuery)

    return (
      <div className='Chat'>
        <ChatMessages
          messages={this.props.allMessagesQuery.allMessages || []}
        />
        {Boolean(this.props.travellerId) &&
          <ChatInput
            message={this.state.message}
            onTextInput={(message) => this.setState({message})}
            onResetText={() => this.setState({message: ''})}
            onSend={this._onSend}
          />
        }
      </div>
    )
  }

  _onSend = () => {
    // console.log('Send message: ', this.state.message, this.props.travellerId)
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

