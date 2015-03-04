Peruse-a-Rue
============
A Street View implementation for Liquid Galaxy.

### Installing Node.js

The Peruse-a-Rue server requires Node.js and npm.  Instructions for installing
Node.js on all supported platforms can be found on their website:

    <http://nodejs.org/>

### Installing Peruse-a-Rue

Peruse-a-Rue can be installed from git:

    $ git clone https://code.google.com/p/liquid-galaxy.lg-peruse-a-rue/
    $ cd liquid-galaxy.lg-peruse-a-rue

### Installing Node deps

npm can read the dependency list from package.json in the current directory.
While in the Peruse-a-Rue git root:

    $ npm install

### Usage

The Peruse-a-Rue server can be started with the launcher script:

    $ bin/peruse-a-rue

##### TCP

Peruse-a-Rue serves all of its HTTP and WebSockets from a single socket.

The default port for this traffic is 8086.  To override it, launch with the
-p/--port option:

    $ bin/peruse-a-rue --port 9091

##### UDP

Peruse-a-Rue also receives UDP datagrams from input device listeners.  The
default port for this traffic is 8086.  To override it, launch with the
-u/--udp-port option:

    $ bin/peruse-a-rue --udp-port 7702

### Configuration

The default configuration is in `config_defaults.json`.  Any configuration key
may be overridden by creating a `config.json`, which is merged with the
defaults when the server starts.

##### Configuration Keys

- `config['port']` : TCP port

- `config['udp_port']` : UDP port

- `config['lg_iface_base']` : address of the lg master's http interface

- `config['earth_pos_url']` : json data representing Earth's last position

- `config['touchscreen']['poi_url']` : url to touchscreen locations, comma seperated values for multiple URL's.

- `config['touchscreen']['default_center']` : [lat,lng]

- `config['touchscreen']['activities']` : list of activities for relaunch

- `config['touchscreen']['show_photospheres']` : photosphere markers

- `config['touchscreen']['show_zoomctl']` : zoom buttons

- `config['touchscreen']['show_maptypectl']` : control for road/satellite map

- `config['touchscreen']['font_scale']` : scale fonts by this ratio

- `config['touchscreen']['default_maptype']` : sets the map imagery style
  - See the [MapTypeId][maptypeid] reference for supported map styles
  
- `config['touchscreen']['show_poi']` : Opens the "Points of Interest" Section

- `config['touchscreen']['show_other_activities']` : Opens the "Other Activities" Section

- `config['display']['default_pano']` : panoid to start with

- `config['display']['zoom']` : street view zoom level (Integer 0-4)

- `config['display']['mode']` : render mode ('html4', 'html5', 'webgl')

- `config['display']['show_links']` : show "chevron" links to neighboring panos

### Browser Interface

Chrome is the only browser supported by Peruse-a-Rue.  Chromium probably works
too.

##### Touchscreen Interface

    http://<server:port>/touchscreen/

##### Panorama Display

    http://<server:port>/display/

Arguments to display:

- yawoffset : The x index of the screen, 1.0 is one screen to the right.

- pitchoffset : The y index of the screen, 1.0 is up.

- master : If set to 'true', this is the master instance and other displays
will follow its point of view.  Typically this is the center display.

- pano : Load a Street View pano by panoid at startup.  Only accepted by the
master instance.

- heading : Specify a heading in degrees.  Only accepted by the master.

Examples:

    http://lg-head:8086/display/?master=true  # master
    http://lg-head:8086/display/?yawoffset=1  # one screen right
    http://lg-head:8086/display/?yawoffset=-1 # one screen left

### License

Copyright 2013 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License"):

    <http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[maptypeid]: https://developers.google.com/maps/documentation/javascript/reference#MapTypeId
