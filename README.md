# vbb-rest-2-ngsi

[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](https://spdx.org/licenses/MIT.html)
[![SOF support badge](https://nexus.lab.fiware.org/repository/raw/public/badges/stackoverflow/orion.svg)](http://stackoverflow.com/questions/tagged/fiware-orion)
[![NGSI v2](https://nexus.lab.fiware.org/repository/raw/public/badges/specifications/ngsiv2.svg)](http://fiware-ges.github.io/orion/api/v2/stable/)
[![NGSI-LD badge](https://img.shields.io/badge/NGSI-LD-red.svg)](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.02.01_60/gs_cim009v010201p.pdf)

Node.js application that uses the [vbb-rest](https://github.com/derhuerst/vbb-rest) API to read public transport data of the Verkehrsverbund Berlin-Brandenburg (VBB) and transform it from [FTPF](https://github.com/public-transport/friendly-public-transport-format) into a NGSI-compliant data format (NGSI v2 and NGSI-LD) for subsequent storage in FIWARE NGSI Context Brokers. Applied [FIWARE data models](https://fiware-datamodels.readthedocs.io/en/latest/UrbanMobility/doc/introduction/index.html) implement the [General Transit Feed Specification (GTFS)](https://developers.google.com/transit/gtfs/reference).

## Content

-   [Current limitations](#current-limitations)
-   [Prerequisites](#prerequisites)
-   [Operation modes](#operation-modes)
-   [Configuration](#configuration)
-   [Starting Docker containers](#starting-docker-containers)
-   [NGSI data models](#ngsi-data-models)
-   [Reading data from context brokers](#reading-data-from-context-brokers)
-   [History data](#history-data)
-   [Troubleshooting](#troubleshooting)
-   [License](#license)

## Current limitations ## 

* `GtfsShape` entites in the NGSI-LD format can't currently be created because of some server-side processing issues with used geometry type `LineString`.

* The NGSI data model types `GtfsService` and `GtfsTrip` are not considered yet. Although with regard to the relationship model these types should be harmonised, it's due to the implementation of the REST API that some information is not available or suitable for transformation into context data.
  
  * A `GtfsService` should reference a `GtfsAgency` but various defined service times for routes are not known or cannot be queried via API.
  
  * A `GtfsTrip` may reference a `GtfsShape`, should reference a `GtfsService` and a `GtfsRoute`, but a trip ID always includes date of the day and is often regenerated. Therefore its form is not suitable for transformation into a NGSI entity with fixed ID.

* Instead of querying all stations (~ 13000) from the vbb-rest API only a small subset of 10 selected stations are processed for now. The code still needs some throttling mechanism to handle the actual amount of API data in parallel.<br>
Furthermore just one possible journey of some selected connections (station A -> station B) are picked. It is planned to include all journeys at some point.


## Prerequisites ##

[Docker](https://www.docker.com/) and [Docker Compose](https://github.com/docker/compose) must be installed on your system in order to run the services defined in the multi-container file.


## Operation modes ##

The project offers two different compose files. The first variant starts the Node.js script, the context broker and components for persisting data. In this mode (client-server mode), the retrieved public transport data is stored in the context broker of the local Docker container and, if configured, persisted in the local CrateDB instance.<br>

The second variant comprises a single service for the Node.js script. It acts as a client to a context broker running elsewhere (client mode).


## Configuration ##

There is a configuration file `.env` containing environment variables used by the Node.js script. Some of the variables values have to be modified prior to initial startup, as the script uses those variables for connection management and data processing.<br>

A list with a summary of currently supported variables will follow. In the meantime please check the content of the `.env` file.


## Starting Docker containers ##

Depending on what operation mode is preferred, pull/create the images and start containers by running `./services create && ./services start` (client-server mode) or simply `./services-app-only start` (client mode) from the project root folder.<br>
To stop the containers run `./services[-app-only] stop`.<br>
If you encounter problems executing the service scripts, add the missing permission with `chmod +x services*`.


## NGSI data models ##

Read data from the vbb-rest API is harmonised for transformation into applicable FIWARE NGSI data models of the domain Urban Mobility.  
Entites of the following types are sent to the context brokers:

* `GtfsStop` - A stop where vehicles pick up or drop off riders
* `GtfsStation` - A physical structure or area that contains one or more stops
* `GtfsAgency` - 	Transit agency (transportation operator) that offers services at particular times
* `GtfsRoute` - A (transit) route is a group of trips (sequences of two or more stops that occur during a specific time period) that are displayed to riders as a single service.
* `GtfsShape` - Describes the path that a vehicle travels along a route alignment (consists of a sequence of points)

### Entity IDs use the following format: ###
<table>
  <tbody>
    <tr>
      <th>Entity Type</th>
      <th>Entity ID format</th>
    </tr>
    <tr>
      <td>
        <code>GtfsStop</code>
      </td>
      <td>
        <p><code>GtfsStop:&lt;STOP_ID&gt;[:&lt;ENTITY_ID_SUFFIX&gt;]</code></p>
        <p>e.g. <i>GtfsStop:000008012713:XY</i></p>
      </td>
    </tr>
    <tr>
      <td>
        <code>GtfsStation</code>
      </td>
      <td>
        <p><code>GtfsStation:&lt;STATION_ID&gt;[:&lt;ENTITY_ID_SUFFIX&gt;]</code></p>
        <p>e.g. <i>GtfsStation:900000245025:XY</i></p>
      </td>
    </tr>
    <tr>
      <td>
        <code>GtfsAgency</code>
      </td>
      <td>
        <p><code>GtfsAgency:&lt;AGENCY_ID&gt;[:&lt;ENTITY_ID_SUFFIX&gt;]</code></p>
        <p>e.g. <i>GtfsAgency:berliner-verkehrsbetriebe:XY</i></p>
      </td>
    </tr>
    <tr>
      <td>
        <code>GtfsRoute</code>
      </td>
      <td>
        <p><code>GtfsRoute:&lt;ORIGIN_STATION_ID&gt;-&lt;DESTINATION_STATION_ID&gt;[:&lt;ENTITY_ID_SUFFIX&gt;]</code></p>
        <p>e.g. <i>GtfsRoute:900000044201-900000009202:XY</i></p>
      </td>
    </tr>
    <tr>
      <td>
        <code>GtfsShape</code>
      </td>
      <td>
        <p><code>GtfsShape:&lt;ORIGIN_STATION_ID&gt;-&lt;DESTINATION_STATION_ID&gt;[:&lt;ENTITY_ID_SUFFIX&gt;]</code></p>
        <p>e.g. <i>GtfsShape:900000044201-900000009202:XY</i></p>
      </td>
    </tr>
  </tbody>
</table>

<i>Notes:</i> 
* `<ENTITY_ID_SUFFIX>` is an optional ID suffix that will be appended to each entity ID (preceded by a colon '`:`') if configured in the [configuration](#configuration).
* The same rules apply to NGSI-LD entities. The only difference: `urn:ngsi-ld:` is prepended to the entity ID, e.g. <p><i>`urn:ngsi-ld:`GtfsStop:000008012713:XY`</i></p>


## Reading data from context brokers ##

You can GET a list of all entities using the following cURL commands. Don't forget to replace the `<DOCKER_HOST>` placeholders with the hostname / IP of your Docker host.<br>
`<DOCKER_HOST>` assumes that you are running your own context brokers on the Docker host. If you are connecting to context brokers located elsewhere, use their hostname / IP address accordingly.


### Orion v2 ###
List all `GtfsStation` entities containing only the 'id' attribute:  

``` bash
curl -X GET '<DOCKER_HOST>:1026/v2/entities?type=GtfsStation&attrs=id&options=keyValues' \
  -H 'Accept: application/json'
```
  
List all `GtfsStation` entities containing all attributes:  

``` bash
curl -X GET '<DOCKER_HOST>:1026/v2/entities?type=GtfsStation&options=keyValues' \
  -H 'Accept: application/json'
```


## History data ##

If historic data persistence was enabled, the Node.js script sends subscriptions for attribute changes of all known entities to the NGSI v2 context broker. QuantumLeap, a REST service for storing, querying and retrieving spatial-temporal data, will receive a notification every time a status changes and stores its current value in a CrateDB database. With this data collected over time, statistical evaluations and data visualisation will be possible, e.g. building histograms with [Grafana](https://grafana.com/) or UI widgets using [WireCloud](https://github.com/Wirecloud/wirecloud).<br>

As QuantumLeap has no support for NGSI-LD yet, storage of historic data is supported for NGSI v2 data only.<br>

The Docker container of CrateDB exposes 4200 as the default port for data queries and access to the web-based admin UI.<br>
You can reach it at `<DOCKER_HOST>:4200`.


## Troubleshooting ##

CrateDB service might crash shortly after startup due to incompatible memory settings.<br>
With `docker ps -a` you can check whether its container is running or has already exited. In the latter case, inspecting the container log file with 

``` bash
sudo vi `docker inspect --format='{{.LogPath}}' kipark-db-crate`
```

should give you an output saying something like<br>
`max virtual memory areas vm.max_map_count [65530] likely too low, increase to at least [262144]`.<br><br>

In order to avoid this, increase maximum number of memory map areas before starting:

``` bash
sudo sysctl -w vm.max_map_count=262144
```


## License ##

This project is licensed under [MIT License](./LICENSE).
