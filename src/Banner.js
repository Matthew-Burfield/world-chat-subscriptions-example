import React, {Component} from 'react'
import './Banner.css'

export default class Banner extends Component {

  render() {
    return (
      <div className='Banner'>
        <img src={require('./assets/info.svg')} alt="info"/>
        <div className='InfoText'>This app is using <b>GraphQL Subscriptions</b> with <b>Apollo Client</b></div>
        <div className='ReadTutorialButton'>Read Tutorial</div>
      </div>
    )
  }

}