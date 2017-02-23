import React, { Component } from 'react'
import WorldChat from './WorldChat'
import ApolloClient, { createNetworkInterface } from 'apollo-client'
import { ApolloProvider } from 'react-apollo'
import generateStupidName from 'sillyname'
import {SubscriptionClient, addGraphQLSubscriptions} from 'subscriptions-transport-ws'


// Create WebSocket client
// wss://dev.subscriptions.graph.cool/
const wsClient = new SubscriptionClient(`wss://dev.subscriptions.graph.cool/v1/cizihyyf606qo01370lwki4k8`, {
// const wsClient = new SubscriptionClient(`wss://subscriptions.graph.cool/cizfapt9y2jca01393hzx96w9`, {
  reconnect: true,
  connectionParams: {
    // Pass any arguments you want for initialization
  }
})

// const networkInterface = createNetworkInterface({ uri: 'https://api.graph.cool/simple/v1/cizfapt9y2jca01393hzx96w9' })
const networkInterface = createNetworkInterface({ uri: 'https://dev.api.graph.cool/simple/v1/cizihyyf606qo01370lwki4k8' })


// Extend the network interface with the WebSocket
const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
  networkInterface,
  wsClient
)

const client = new ApolloClient({
  networkInterface: networkInterfaceWithSubscriptions,
})

class App extends Component {

  componentWillMount() {
    let name
    if (!Boolean(localStorage.name)) {
      name = generateStupidName()
      localStorage.setItem('name', name)
    } else {
      name = localStorage.name
    }

  }

  render() {
    return (
      <ApolloProvider client={client}>
        <WorldChat
          name={localStorage.name}
        />
      </ApolloProvider>
    )
  }
}

export default App
