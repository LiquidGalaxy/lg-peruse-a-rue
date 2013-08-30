Peruse-a-Rue
============
A Street View implementation for Liquid Galaxy.

### Installing Peruse-a-Rue

    $ git clone https://code.google.com/p/liquid-galaxy.lg-peruse-a-rue/
    $ cd peruse-a-rue

### Installing Node deps

    $ npm install ### while in the peruse-a-rue git root

### Usage

    $ bin/peruse-a-rue

##### TCP

Peruse-a-Rue serves all of its HTTP and WebSockets from a single socket.

The default port for this traffic is 8086.  To override it, launch with the
-p/--port option:

    $ bin/peruse-a-rue --port 9091

##### UDP

Peruse-a-Rue also receives UDP datagrams from input device listeners.  These
datagrams are forwarded Linux input event structures, see:

    http://lxr.free-electrons.com/source/include/linux/input.h?v=3.2#L26

..with an appended device identifier string.

The default port for this traffic is 8086.  To override it, launch with the
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

- `config['touchscreen']['poi_url']` : url to touchscreen locations

- `config['touchscreen']['default_center']` : [lat,lng]

- `config['touchscreen']['activities']` : list of activities for relaunch

- `config['display']['default_pano']` : panoid to start with

- `config['display']['zoom']` : street view zoom level (Integer 0-4)

- `config['display']['mode']` : render mode ('html4', 'html5', 'webgl')

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

Examples:

    http://lg-head:8086/display/?master=true  # master
    http://lg-head:8086/display/?yawoffset=1  # one screen right
    http://lg-head:8086/display/?yawoffset=-1 # one screen left

### License

Copyright 2013 Google Inc.

Licensed under the [Apache License, Version 2.0][license] (the "License");

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[license]: <http://www.apache.org/licenses/LICENSE-2.0>
