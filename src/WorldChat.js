import React, { Component } from 'react'
import './WorldChat.css'
import _ from 'lodash'
import { GoogleMap, withGoogleMap, Marker, InfoWindow } from 'react-google-maps'
import withScriptjs from "react-google-maps/lib/async/withScriptjs"
import Chat from './Chat'
import Banner from './Banner'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { withApollo } from 'react-apollo'

const allLocations = gql`
    query allLocations {
        allLocations {
            id
            latitude
            longitude
            traveller {
                id
                name
            }
        }
    }
`

const travellerForName = gql`
    query travellerForName($name: String!) {
        allTravellers(filter: {
        name: $name,
        }) {
            id
            name
            location {
                id
                latitude
                longitude
            }
        }
    }
`

const createTraveller = gql`
    mutation createTraveller($name: String!) {
        createTraveller(name: $name) {
            id
            name
        }
    }
`

const createLocation = gql`
    mutation createLocation($travellerId: ID!, $latitude: Float!, $longitude: Float!) {
        createLocation(travellerId: $travellerId, latitude: $latitude, longitude: $longitude) {
            traveller {
                id
                name
            }
            latitude
            longitude
        }
    }
`

const updateLocation = gql`
    mutation updateLocation($locationId: ID!, $latitude: Float!, $longitude: Float!) {
        updateLocation(id: $locationId, latitude: $latitude, longitude: $longitude) {
            traveller {
                id
                name
            }
            latitude
            longitude
        }
    }
`

const WorldChatGoogleMap =  _.flowRight(
  withScriptjs,
  withGoogleMap,
)(props => (
    <GoogleMap
      ref={props.onMapLoad}
      defaultZoom={3}
      defaultCenter={{ lat: 52.53734, lng: 13.395 }}
      onClick={props.onMapClick}
    >
      {props.markers.map((marker , index) => (
        <Marker
          {...marker}
          showInfo={false}
          icon={require('./assets/marker.svg')}
          onClick={() => props.onMarkerClick(marker)}
          defaultAnimation={2}
          key={index}
        >
          {marker.showInfo && (
            <InfoWindow
              onCloseClick={() => props.onMarkerClose(marker)}>
              <div className=''>{marker.travellerName}</div>
            </InfoWindow>
          )}
        </Marker>
      ))}
    </GoogleMap>
  )
)

/*


 this.createLocationSubscription = this.props.allLocationsQuery.subscribeToMore({
 document: gql`
 subscription {
 Location(filter: {
 OR: [
 {
 mutation_in: [CREATED]
 },
 {
 mutation_in: [UPDATED]
 updatedFields_contains: "mymagicimportantfield"
 }
 ]

 }) {
 mutation # CREATED or UPDATED
 node {
 id
 latitude
 longitude
 traveller {
 id
 name
 }
 }

 }
 }
 `,
 variables: null,
 updateQuery: (previousState, {subscriptionData}) => {
 const newLocation = subscriptionData.data.createLocation
 const locations = previousState.allLocations.concat([newLocation])
 return {
 allLocations: locations,
 }
 }
 })

 */

class WorldChat extends Component {

  state = {
    markers: [],
    travellerId: undefined,
    location: undefined,
  }

  async componentDidMount() {

    this.subscriptionObserver = this.props.client.subscribe({
      query: gql`
          subscription {
              createTraveller {
                  id
                  name
              }
          }
      `,
    }).subscribe({
      next(data) {
        console.log('Subscription callback with new user: ', data)
      },
      error(err) {
        console.error('Subscription callback with error: ', err)
      },
    })

    this.createLocationSubscription = this.props.allLocationsQuery.subscribeToMore({
      document: gql`
          subscription {
              createLocation {
                  id
                  latitude
                  longitude
                  traveller {
                      id
                      name
                  }
              }
          }
      `,
      variables: null,
      updateQuery: (previousState, {subscriptionData}) => {
        const newLocation = subscriptionData.data.createLocation
        const locations = previousState.allLocations.concat([newLocation])
        return {
          allLocations: locations,
        }
      }
    })

    this.updateLocationSubscription = this.props.allLocationsQuery.subscribeToMore({
      document: gql`
          subscription {
              updateLocation {
                  id
                  latitude
                  longitude
                  traveller {
                      name
                      id
                  }
              }
          }
      `,
      variables: null,
      updateQuery: (previousState, {subscriptionData}) => {
        const locations = previousState.allLocations.slice()
        const updatedLocation = subscriptionData.data.updateLocation
        const oldLocationIndex = locations.findIndex(location => {
          return updatedLocation.id === location.id
        })
        locations[oldLocationIndex] = updatedLocation
        return {
          allLocations: locations,
        }
      }
    })

    // Check for traveller with this name
    const travellerForNameResponse = await this.props.client.query(
      {
        query: travellerForName,
        variables: {
          name: this.props.name,
        },
      }
    )

    // Create new traveller in backend
    if (travellerForNameResponse.data.allTravellers.length === 0) {
      this._createNewTraveller()
    }
    // Traveller already exists in backend
    else {
      const existingTraveller = travellerForNameResponse.data.allTravellers[0]
      this._updateExistingTraveller(existingTraveller)
    }

  }

  componentWillReceiveProps(nextProps) {

    console.log('WorldChat - componentWillReceiveProps - nextProps: ', nextProps)

    if (nextProps.allLocationsQuery.allLocations) {
      const newMarkers = nextProps.allLocationsQuery.allLocations.map(location => {
        return {
          travellerName: location.traveller.name,
          position: {
            lat: location.latitude,
            lng: location.longitude,
          }
        }
      })
      this.setState({
        markers: newMarkers,
      })
    }

  }

  handleMapLoad = this.handleMapLoad.bind(this)
  handleMapClick = this.handleMapClick.bind(this)
  handleMarkerClick = this.handleMarkerClick.bind(this)
  handleMarkerClose = this.handleMarkerClose.bind(this)

  // Toggle to 'true' to show InfoWindow and re-renders component
  handleMarkerClick(targetMarker) {
    this.setState({
      markers: this.state.markers.map(marker => {
        if (marker === targetMarker) {
          return {
            ...marker,
            showInfo: true,
          }
        }
        return marker
      }),
    })
  }

  handleMarkerClose(targetMarker) {
    this.setState({
      markers: this.state.markers.map(marker => {
        if (marker === targetMarker) {
          return {
            ...marker,
            showInfo: false,
          }
        }
        return marker
      }),
    })
  }

  handleMapLoad(map) {
    this._mapComponent = map
  }

  handleMapClick() {
    this._removeAllMarkers()
  }

  _removeAllMarkers() {
    const newMarkers = this.state.markers.slice()
    newMarkers.forEach(marker => {
      marker.showInfo = false
    })
    this.setState({
      markers: newMarkers,
    })
  }

  _createNewTraveller = async () => {
    const createTravellerResponse = await this.props.createTravellerMutation({
      variables: {
        name: this.props.name,
      }
    })
    const newTraveller = createTravellerResponse.data.createTraveller
    this.setState({
      travellerId: newTraveller.id
    })


    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        console.log('Create location: ', position)
        this.props.createLocationMutation({
          variables: {
            travellerId: newTraveller.id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
        })
      })
    } else {
      // Create fake location
      window.alert("We could not retrieve your location, so we're putting you right next to Santa 🎅❄️")
      const nortpholeCoordinates = this._generateRandomNorthPolePosition()
      this.props.createLocationMutation({
        variables: {
          travellerId: newTraveller.id,
          latitude: nortpholeCoordinates.latitude,
          longitude: nortpholeCoordinates.longitude,
        }
      })
    }
  }

  _updateExistingTraveller = (existingTraveller) => {

    this.setState({
      travellerId: existingTraveller.id
    })

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        console.log('Update location: ', position)

        this.props.updateLocationMutation({
          variables: {
            locationId: existingTraveller.location.id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
        })
      })
    } else {
      // Create fake location
      const nortpholeCoordinates = this._generateRandomNorthPolePosition()
      this.props.updateLocationMutation({
        variables: {
          locationId: existingTraveller.location.id,
          latitude: nortpholeCoordinates.latitude,
          longitude: nortpholeCoordinates.longitude,
        }
      })
    }
  }

  _generateRandomNorthPolePosition = () => {
    const latitude = 64.7555869
    const longitude = -147.34432909999998
    const latitudeAdd = Math.random() > 0.5
    const longitudeAdd = Math.random() > 0.5
    const latitudeDelta = Math.random()
    const longitudeDelta = Math.random()
    const newLatitude = latitudeAdd ? latitude + latitudeDelta : latitude - latitudeDelta
    const newLongitude = longitudeAdd ? longitude + longitudeDelta : longitude - longitudeDelta
    return {latitude: newLatitude, longitude: newLongitude}
  }

  render() {
    return (
      <div style={{height: `100%`}}>
        <WorldChatGoogleMap
          googleMapURL='https://maps.googleapis.com/maps/api/js?v=3.exp&key=AIzaSyCedl-z2FCu87QocGvWB_GW0mLBPiy7-Kg'
          loadingElement={
            <div style={{height: `100%`}}>
              Loading
            </div>
          }
          containerElement={
            <div style={{ height: `100%` }} />
          }
          mapElement={
            <div style={{ height: `100%` }} />
          }
          onMapLoad={this.handleMapLoad}
          onMapClick={this.handleMapClick}
          markers={this.state.markers}
          onMarkerClick={this.handleMarkerClick}
          onMarkerClose={this.handleMarkerClose}
        />
        <Banner />
        <Chat
          travellerId={this.state.travellerId}
        />
      </div>
    )
  }
}

export default withApollo(
  graphql(allLocations, {name: 'allLocationsQuery'})(
    graphql(createTraveller, {name: 'createTravellerMutation'})(
      graphql(createLocation, {name: 'createLocationMutation'})(
        graphql(updateLocation, {name: 'updateLocationMutation'})(WorldChat)
      )
    )
  )
)

WorldChat.propTypes = {
  name: React.PropTypes.string.isRequired,
}