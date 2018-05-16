import React, { Component } from 'react';
import './App.css';
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
class App extends Component {
  mapDiv = undefined
  evaluate = (e) => {
    if(e.currentTarget.readyState === 4) {
      JSON.parse(e.currentTarget.responseText).forEach((station) => {
        // this.createSpot(station.gegrLat, station.gegrLon, station.stationName, station.id);
        new Spot(station.gegrLat, station.gegrLon, station.stationName, station.id, this.mapDiv);
      })
    }
  }
  componentDidMount() {
    mapboxgl.accessToken = "pk.eyJ1IjoibWlrYWlsdXMiLCJhIjoiY2poN3p6OXhyMGUxNzMzbnVqNW10YXNicCJ9.XpSmc3gSw8D77xCmU70_iA";
    this.mapDiv = new mapboxgl.Map({
      container: 'map', // HTML container id
      style: 'mapbox://styles/mapbox/streets-v9', // style URL
      center: [21.017532, 52.237049], // starting position as [lng, lat]
      zoom: 6
    });
    let xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', this.evaluate);
    xhr.open('GET', 'https://cors-anywhere.herokuapp.com/http://api.gios.gov.pl/pjp-api/rest/station/findAll');
    xhr.send();
  }
  render() {
    return (
      <div className="App" id="map">
      </div>
    );
  }
}

class Spot {
  constructor (latitude, longitude, stationName, stationId, mapDiv) {
    this.mapDiv = mapDiv;
    this.latitude = parseFloat(latitude);
    this.longitude = parseFloat(longitude);
    this.stationName = stationName;
    this.stationId = stationId;
    this.counter = 0;
    this.info = `<h3>${stationName}</h3>`;
    this.img = this.createMarkerDisplay();
    this.popup = new mapboxgl.Popup();
    this.popup.setHTML(this.info);
    this.marker = new mapboxgl.Marker({
      element: this.img
    });
    this.marker.setLngLat([this.longitude, this.latitude]).setPopup(this.popup).addTo(this.mapDiv);
  }
  createMarkerDisplay () {
    let img = document.createElement('img');
    img.src = "./water-drop.svg";
    img.classList.add('marker');
    img.setAttribute('data-id', this.stationId);
    img.addEventListener('click', this.showPopup, true);
    img.addEventListener('mousedown', function (e) {
      e.stopPropagation();
    })
    return img;
  }
  showPopup = (e) => {
    if(!this.counter) {
      this.counter = 1;
      this.img.removeEventListener('click', this.showPopup);
      this.info = `<h3>${this.stationName}</h3>`;
      this.popup.setHTML(this.info);
      let id = this.img.getAttribute('data-id');
      let xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://cors-anywhere.herokuapp.com/http://api.gios.gov.pl/pjp-api/rest/station/sensors/'+id);
      xhr.send();
      xhr.addEventListener('readystatechange', this.getStationData);
    }
  }
  fillPopup = (parameter, value)  => {
    this.info+=`<p>${parameter}: ${value}</p>`;
    this.popup.setHTML(this.info);
  }
  getStationData = (e) => {
    if(e.currentTarget.readyState === 4) {
      JSON.parse(e.currentTarget.responseText).forEach( (elem) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://cors-anywhere.herokuapp.com/http://api.gios.gov.pl/pjp-api/rest/data/getData/'+elem.id);
        xhr.send();
        xhr.addEventListener('readystatechange', this.getParameterData);
      })
    }
  }
  getParameterData = (ev) => {
    if(ev.currentTarget.readyState === 4) {
      let information = JSON.parse(ev.currentTarget.responseText);
      let parameter = information.key;
      let value;
      if(information.values[1] === undefined || information.values[1].value===null) {
        value = "N/A";
      } else {
        value = information.values[1].value;
      }
      this.fillPopup(parameter,value);
    }
  }
}
export default App;
