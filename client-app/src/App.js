import React from 'react';
import './App.css';
import {Button, Row, Col, Table} from "react-bootstrap";
// import L from 'leaflet';
import {Map, Polyline, ScaleControl, TileLayer} from 'react-leaflet'
import {makeid, polyline_decode, get_nearest_node} from "./helpers";
import {FaAngleDoubleRight, FaAngleDoubleLeft} from 'react-icons/fa';
import moment from "moment";
import 'leaflet-contextmenu';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css'

// import {gis} from "./gis";

const osrmEndpoint = 'http://127.0.0.1:5000';
const speedIncrements = [0, 1, 30, 60, 2 * 60, 4 * 60, 8 * 60, 15 * 60, 30 * 60, 60 * 60];

class App extends React.Component {
    state = {
        now: moment(),
        speed: 1,
        centerLat: 42.579377,
        centerLon: 25.197144,
        zoom: 9,
        buses: [],
        routeStart: {},
        routeEnd: {},
        currentRoute: [],
        currentBus: {}
    };

    tick = () => {
        let now = this.state.now.add(speedIncrements[this.state.speed], 'seconds');
        this.setState({now: now});
    };

    onSpeedUp = () => {
        let {speed} = this.state;
        if (speed < speedIncrements.length - 1) {
            speed++;
        }
        this.setState({speed: speed});
    };

    onSpeedDown = () => {
        let {speed} = this.state;
        if (speed > 0) {
            speed--;
        }
        this.setState({speed: speed});
    };

    componentDidMount() {
        // force HTTPS
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
        }

        setInterval(this.tick, 1000);
    }

    onNewGame = () => {
        this.setState({
            centerLat: 42.579377,
            centerLon: 25.197144,
            zoom: 9,
            buses: []
        })
    };

    selectBus = (item) => {
        this.setState({
            currentBus: item,
            currentRoute: item.currentRoute
        });
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

            if (this.state.currentBus) {
                let cb = this.state.currentBus;
                cb.currentRoute = currentRoute;
                cb.routeStartName = this.state.routeStart.tags['name'];
                cb.routeEndName = this.state.routeEnd.tags['name'];
                let buses = this.state.buses;
                for (let i in buses) {
                    if (buses[i]['id'] === cb['id']) {
                        buses[i]['currentRoute'] = currentRoute;
                    }
                }
                this.setState({currentBus: cb, buses: buses});
            }
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
                        <Button variant="primary" onClick={this.onSpeedDown}>
                            <FaAngleDoubleLeft/>
                        </Button>
                        {this.state.now.format('Y-MM-DD HH:mm:ss')} (x{this.state.speed})
                        <Button variant="primary" onClick={this.onSpeedUp}>
                            <FaAngleDoubleRight/>
                        </Button>
                        <h1>Buses</h1>
                        <Table striped bordered hover>
                            <thead>
                            <tr>
                                <td>#</td>
                                <td>ID</td>
                                <td>Route</td>
                                <td>Actions</td>
                            </tr>
                            </thead>
                            <tbody>
                            {this.state.buses.map((item, idx) => {
                                let className = '';
                                if (this.state.currentBus && this.state.currentBus.id === item.id) {
                                    className = 'selected';
                                }

                                let routeNames = [];
                                if (item.routeStartName) {
                                    routeNames.push(item.routeStartName);
                                }
                                if (item.routeEndName) {
                                    routeNames.push(item.routeEndName);
                                }

                                return <tr key={idx} className={className}>
                                    <td>{idx}</td>
                                    <td>{item.id}</td>
                                    <td>{routeNames.join(' - ')}</td>
                                    <td>
                                        <Button variant="danger" onClick={() => {
                                            this.deleteBus(item.id)
                                        }}>X</Button>
                                        <Button variant="success" onClick={() => {
                                            this.selectBus(item)
                                        }}>Select</Button>
                                    </td>
                                </tr>
                            })}
                            <tr>
                                <td colSpan={4}>
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
