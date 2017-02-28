import React, { Component } from 'react'
import './WorldChat.css'
import _ from 'lodash'
import { GoogleMap, withGoogleMap, Marker, InfoWindow } from 'react-google-maps'
import withScriptjs from "react-google-maps/lib/async/withScriptjs"
import Chat from './Chat'
import Banner from './Banner'
import gql from 'graphql-tag'
import { withApollo, graphql } from 'react-apollo'

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

const createLocationAndTraveller = gql`
    mutation createLocationAndTraveller($name: String!, $latitude: Float!, $longitude: Float!) {
        createLocation(latitude: $latitude, longitude: $longitude, traveller: {
            name: $name
        }) {
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

const updateLocation = gql`
    mutation updateLocation($locationId: ID!, $latitude: Float!, $longitude: Float!) {
        updateLocation(id: $locationId, latitude: $latitude, longitude: $longitude) {
            traveller {
                id
                name
            }
            id
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
      {Boolean(props.markers) && props.markers.map((marker , index) => (
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


class WorldChat extends Component {

  state = {
    markers: [],
    travellerId: undefined,
    location: undefined,
  }

  async componentDidMount() {

    this.locationSubscription = this.props.allLocationsQuery.subscribeToMore({
      document: gql`
          subscription {
              Location(filter: {
                mutation_in: [CREATED, UPDATED]
              }) {
                  mutation
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
        if (subscriptionData.data.Location.mutation === 'CREATED') {
          const newLocation = subscriptionData.data.Location.node
          const locations = previousState.allLocations.concat([newLocation])
          return {
            allLocations: locations,
          }
        }
        else if (subscriptionData.data.Location.mutation === 'UPDATED') {
          const locations = previousState.allLocations.slice()
          const updatedLocation = subscriptionData.data.Location.node
          const oldLocationIndex = locations.findIndex(location => {
            return updatedLocation.id === location.id
          })
          locations[oldLocationIndex] = updatedLocation
          return {
            allLocations: locations,
          }
        }

        return previousState
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

  _removeAllMarkers() {
    const newMarkers = this.state.markers.slice()
    newMarkers.forEach(marker => {
      marker.showInfo = false
    })
    this.setState({
      markers: newMarkers,
    })
  }

  _createNewTraveller = () => {

    if (navigator.geolocation) {
      // Retrieve location
      navigator.geolocation.getCurrentPosition(position => {
        this.props.createLocationAndTravellerMutation({
          variables: {
            name: this.props.name,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
        }).then(result => {
          const newMarkers = this.state.markers.concat[{
            travellerName: result.data.createLocation.traveller.name,
            position: {
              lat: result.data.createLocation.latitude,
              lng: result.data.createLocation.longitude,
            }
          }]
          this.setState({
            travellerId: result.data.createLocation.traveller.id,
            markers: newMarkers
          })
        })
      })
    } else {
      // Create fake location
      window.alert("We could not retrieve your location, so we're putting you close to Santa 🎅❄️")
      const nortpholeCoordinates = this._generateRandomNorthPolePosition()
      this.props.createLocationAndTravellerMutation({
        variables: {
          name: this.props.name,
          latitude: nortpholeCoordinates.latitude,
          longitude: nortpholeCoordinates.longitude,
        }
      }).then(result => {
        const newMarkers = this.state.markers.concat[{
          travellerName: result.data.createLocation.traveller.name,
          position: {
            lat: result.data.createLocation.latitude,
            lng: result.data.createLocation.longitude,
          }
        }]
        this.setState({
          travellerId: result.data.createLocation.traveller.id,
          markers: newMarkers
        })
      })
    }
  }

  _updateExistingTraveller = (existingTraveller) => {

    this.setState({
      travellerId: existingTraveller.id
    })

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        // Retrieve location
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

  handleMapLoad = this.handleMapLoad.bind(this)
  handleMapClick = this.handleMapClick.bind(this)
  handleMarkerClick = this.handleMarkerClick.bind(this)
  handleMarkerClose = this.handleMarkerClose.bind(this)

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

  _generateRandomNorthPolePosition = () => {
    const latitude = 64.7555869
    const longitude = -147.34432909999998
    const latitudeAdd = Math.random() > 0.5
    const longitudeAdd = Math.random() > 0.5
    const latitudeDelta = Math.random() * 3
    const longitudeDelta = Math.random() * 3
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
    graphql(createLocationAndTraveller, {name: 'createLocationAndTravellerMutation'})(
      graphql(updateLocation, {name: 'updateLocationMutation'})(WorldChat)
    )
  )
)

WorldChat.propTypes = {
  name: React.PropTypes.string.isRequired,
}