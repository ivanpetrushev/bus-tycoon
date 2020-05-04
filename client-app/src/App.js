import React from 'react';
import './App.css';
import {Button, Row, Col, Table} from "react-bootstrap";
// import L from 'leaflet';
import {Map, Polyline, ScaleControl, TileLayer} from 'react-leaflet'
import {makeid, polyline_decode, get_nearest_node} from "./helpers";
import 'leaflet-contextmenu';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css'

// import {gis} from "./gis";

const osrmEndpoint = 'http://127.0.0.1:5000'

class App extends React.Component {
    state = {
        centerLat: 42.579377,
        centerLon: 25.197144,
        zoom: 9,
        buses: [],
        routeStart: {},
        routeEnd: {},
        currentRoute: [],
        currentBus: {}
    };

    componentDidMount() {
        // force HTTPS
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
        }

    }

    onNewGame = () => {
        this.setState({
            centerLat: 42.579377,
            centerLon: 25.197144,
            zoom: 9,
            buses: []
        })
    };

    deleteBus = (id) => {
        console.log('deleteBus', id)
    };

    addBus = () => {
        let bus = {
            id: makeid(5),
            currentRoute: [],
            defaultRoute: [],
            lat: null,
            lon: null
        };
        let buses = this.state.buses;
        buses.push(bus);
        this.setState({busses: buses});
    };

    selectRouteStart = (e) => {
        let nearest = get_nearest_node(e.latlng.lat, e.latlng.lng);
        this.setState({
            routeStart: nearest.node
        }, this.calculateRoute)
    };

    selectRouteEnd = (e) => {
        let nearest = get_nearest_node(e.latlng.lat, e.latlng.lng);
        this.setState({
            routeEnd: nearest.node
        }, this.calculateRoute)
    };

    calculateRoute = async () => {
        if (!this.state.routeStart.lat || !this.state.routeEnd.lat) {
            return;
        }
        let res = await fetch(osrmEndpoint + '/route/v1/driving/' + this.state.routeStart.lon + ',' + this.state.routeStart.lat + ';' +
            this.state.routeEnd.lon + ',' + this.state.routeEnd.lat + '?steps=true&overview=full');
        if (res.ok) {
            let resJson = await res.json();
            let currentRoute = [];
            let steps = resJson['routes'][0]['legs'][0]['steps'];
            for (let i in steps) {
                let geometry = polyline_decode(steps[i]['geometry']);
                for (let latlng of geometry) {
                    currentRoute.push([latlng[0], latlng[1]])
                }
            }
            this.setState({currentRoute: currentRoute});
        } else {
            console.log('fetch error', res.status)
        }
    };


    render() {
        // icons: https://github.com/pointhi/leaflet-color-markers
        // let targetIcon = new L.Icon({
        //     iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        //     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        //     iconSize: [25, 41],
        //     iconAnchor: [12, 41],
        //     popupAnchor: [1, -34],
        //     shadowSize: [41, 41]
        // });
        let contextMenuItems = [{
            text: 'Route Start',
            callback: this.selectRouteStart
        }, {
            text: 'Route End',
            callback: this.selectRouteEnd
        },'-', {
            text: 'Zoom in',
            icon: 'images/zoom-in.png',
            callback: function(x) { console.log('3', x)}
        }];

        return (
                <Row>
                    <Col>
                        <h1>Buses</h1>
                        <Table striped bordered hover>
                            <thead>
                            <tr>
                                <td>#</td>
                                <td>ID</td>
                                <td>Actions</td>
                            </tr>
                            </thead>
                            <tbody>
                            {this.state.buses.map((item, idx) => {
                                return <tr key={idx}>
                                    <td>{idx}</td>
                                    <td>{item.id}</td>
                                    <td>
                                        <Button variant="danger" onClick={() => {
                                            this.deleteBus(item.id)
                                        }}>X</Button>
                                    </td>
                                </tr>
                            })}
                            <tr>
                                <td colSpan={3}>
                                    <Button variant="success" onClick={this.addBus}>+</Button>
                                </td>
                            </tr>
                            </tbody>
                        </Table>
                    </Col>
                    <Col xs={8}>
                        <Map center={[this.state.centerLat, this.state.centerLon]} zoom={this.state.zoom} contextmenu= {true} contextmenuWidth={ 130} contextmenuItems={ contextMenuItems }>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                            />
                            {this.state.currentRoute && <Polyline positions={this.state.currentRoute} color="red"/>}

                            <ScaleControl/>
                        </Map>
                    </Col>
                </Row>
        );
    }
}

export default App;
