import React, { Component} from 'react'
import './TravellerCount.css'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const allTravellersCount = gql`
    query allTravellersCount {
        _allTravellersMeta {
            count
        }
    }
`

class TravellerCount extends Component {

  render() {

    console.log('TravellerCount - render:', this.props)

    if (this.props.allTravellersCountQuery.loading) {
      return <div className='TravellerCount'>Loading Travellers</div>
    }

    return (
      <div className='Container'>
        <div className='TravellerCount'>
          <img
            className='TravellerCountIcon'
            src={require('./assets/travellers.svg')}
          />
          <div className='TravellerCountNumber'>{this.props.allTravellersCountQuery._allTravellersMeta.count}</div>
          <div className='TravellerCountText'>travellers were here</div>
        </div>
      </div>
    )
  }

}

export default graphql(allTravellersCount, {name: "allTravellersCountQuery"}) (TravellerCount)
