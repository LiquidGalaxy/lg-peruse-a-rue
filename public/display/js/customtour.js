/*
** Copyright 2013 Google Inc.
**
** Licensed under the Apache License, Version 2.0 (the "License");
** you may not use this file except in compliance with the License.
** You may obtain a copy of the License at
**
**    http://www.apache.org/licenses/LICENSE-2.0
**
** Unless required by applicable law or agreed to in writing, software
** distributed under the License is distributed on an "AS IS" BASIS,
** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
** See the License for the specific language governing permissions and
** limitations under the License.
*
* Valid Pano ID: ZphZajKeR_lJjBJftY0SYw
*/

define(
	['config', 'bigl', 'validate', 'stapes', 'googlemaps', 'sv_svc', 'immoviewertour'],
	function(config, L, validate, Stapes, GMaps, sv_svc, tour) {
		return Stapes.subclass({

			// street view horizontal field of view per zoom level
			// varies per render mode
			SV_HFOV_TABLES: {
				"webgl": [127, 90, 53.5, 28.125, 14.25],
				"html5": [127, 90, 53.5, 28.125, 14.25]
			},

			PANO_POV_DELAY_FRAMES: 20,

			constructor: function($canvas, master, zoom, panos) {
				this.$canvas               = $canvas;
				this.master                = master;
				this.map                   = null;
				this.streetview            = null;
				this.meta                  = null;
				this.pov                   = null;
				this.mode                  = config.display.mode;
				this.zoom                  = zoom;
				this.svPanoramas           = panos;
				this.fov_table             = this.SV_HFOV_TABLES[this.mode];
				this.hfov                  = this.fov_table[this.zoom];
				this.vfov                  = null;
				this.framesSincePanoChange = 0;
			},

			svCustomPanoProvider: function(svPanoramas) {
				var panos = svPanoramas;
				return function(panoId) {
					return panos.find(function(pano) {
						return pano.location.pano === panoId;
					});
				}
			},
			// PUBLIC

			// *** init()
			// should be called once when ready to set Maps API into motion
			init:     function() {
				console.debug('ImmoViewer: init');

				var self = this;

				// *** ensure success of Maps API load
				if(typeof GMaps === 'undefined') L.error('Maps API not loaded!');

				// *** initial field-of-view
				this._resize();

				// *** create a local streetview query object
				this.sv_svc = new GMaps.StreetViewService();

				// *** options for the map object
				// the map will never be seen, but we can still manipulate the experience
				// with these options.
				var mapOptions = {
					disableDefaultUI: true,
					center:           new GMaps.LatLng(45, 45),
					backgroundColor:  "black",
					zoom:             8
				};

				// *** options for the streetview object
				var svOptions = {
					visible:          true,
					disableDefaultUI: true,
					scrollwheel:      false
				};

				// *** only show links on the master display
				if(this.master && config.display.show_links) {
					svOptions.linksControl = true;
				}

				// *** init map object
				this.map = new GMaps.Map(
					this.$canvas,
					mapOptions
				);

				//create panoprovider for ImmoViewer Tours
				svOptions.panoProvider = this.svCustomPanoProvider(this.svPanoramas);

				this.streetview = new GMaps.StreetViewPanorama(
					this.$canvas,
					svOptions
				);

				// *** init streetview pov
				this.pov = {
					heading: 0,
					pitch:   0,
					zoom:    this.zoom
				};
				this.streetview.setPov(this.pov);

				// *** set the display mode as specified in global configuration
				this.streetview.setOptions({mode: this.mode});

				// *** apply the custom streetview object to the map
				this.map.setStreetView(this.streetview);

				// *** events for master only
				if(this.master) {
					// *** handle view change events from the streetview object
					GMaps.event.addListener(this.streetview, 'pov_changed', function() {
						var pov = self.streetview.getPov();

						self._broadcastPov(pov);
						self.pov = pov;
					});

					// *** handle pano change events from the streetview object
					GMaps.event.addListener(this.streetview, 'pano_changed', function() {
						var panoid = self.streetview.getPano();
						if(panoid != self.pano) {
							self._broadcastPano(panoid);
							self.pano = panoid;
							self.resetPov();
						}
					});
					if(this.tour) {
						this.setPano(this.tour.panoramas[0].filename);
					}
				}

				// *** disable <a> tags at the bottom of the canvas
				GMaps.event.addListenerOnce(this.map, 'idle', function() {
					var links = self.$canvas.getElementsByTagName("a");
					var len   = links.length;
					for(var i = 0; i < len; i++) {
						links[i].style.display = 'none';
						links[i].onclick       = function() {
							return (false);
						};
					}
				});

				// *** request the last known state from the server
				this.on('ready', function() {
					self.emit('refresh');
				});

				// *** wait for an idle event before reporting module readiness
				GMaps.event.addListenerOnce(this.map, 'idle', function() {
					console.debug('ImmoViewer: ready');
					self.emit('ready');
				});

				GMaps.event.addListener(this.streetview, 'status_changed', function() {
					this.framesSincePanoChange = this.PANO_POV_DELAY_FRAMES;
				});

				// *** handle window resizing
				window.addEventListener('resize', function() {
					self._resize();
				});

				// *** start collecting pov changes once per anim frame
				this._collectPov();
			},

			// *** setPano(panoid)
			// switch to the provided pano, immediately
			setPano: function(panoid) {
				if(panoid !== this.streetview.getPano()) {
					this.framesSincePanoChange = this.PANO_POV_DELAY_FRAMES;
					this.pano                  = panoid;
					this.streetview.setPano(panoid);
					this.resetPov();
				} else {
					console.warn('ImmoViewer: ignoring redundant setPano');
				}
			},


			// *** setPov(GMaps.StreetViewPov)
			// set the view to the provided pov, immediately
			setPov: function(pov) {
				//keep zoom for now
				pov.zoom = this.zoom;
				if(!validate.number(pov.heading) || !validate.number(pov.pitch)) {
					L.error('ImmoViewer: bad pov to setPov!');
					return;
				}

				this.pov = pov;
			},

			// *** restPov(Gmaps.StreetViewPov)
			// reset the pitch for the provided pov
			resetPov: function() {
				if(!this.master) {
					return;
				}
				var pov = {
					heading: this.pov.heading,
					pitch:   this.pov.pitch
				};
				if(pov.pitch != 0) {
					pov.pitch = 0;
					this.setPov(pov);
				}
				var zoom = this.streetview.getZoom();
				if(zoom != this.zoom) {
					this.streetview.setZoom(this.zoom);
				}
			},

			// *** setHdg(heading)
			// set just the heading of the POV, zero the pitch
			setHdg: function(heading) {
				if(!validate.number(heading)) {
					L.error('ImmoViewer: bad heading to setHdg!');
					return;
				}

				this.setPov({heading: heading, pitch: 0});
			},

			// *** translatePov({yaw, pitch})
			// translate the view by a relative pov
			translatePov: function(abs) {
				// prevent spacenav "jumping" after pano change
				if(this.framesSincePanoChange > 0) {
					return;
				}

				if(!validate.number(abs.yaw) || !validate.number(abs.pitch)) {
					L.error('ImmoViewer: bad abs to translatePov!');
					return;
				}

				var pov1 = {
					heading: this.pov.heading + abs.yaw,
					pitch:   this.pov.pitch + abs.pitch
				};
				this.setPov(pov1);
			},

			// *** moveForward()
			// move to the pano nearest the current heading
			moveForward: function() {
				console.log('moving forward');
				var forward = this._getForwardLink();
				if(forward) {
					this.setPano(forward.pano);
					this._broadcastPano(forward.pano);
				} else {
					console.log("can't move forward, no links!");
				}
			},

			// PRIVATE

			// *** _resize()
			// called when the canvas size has changed
			_resize: function() {
				var screenratio = window.innerHeight / window.innerWidth;
				this.vfov       = this.hfov * screenratio;
				this.emit('size_changed', {hfov: this.hfov, vfov: this.vfov});
				console.debug('ImmoViewer: resize', this.hfov, this.vfov);
			},

			// *** _broadcastPov(GMaps.StreetViewPov)
			// report a pov change to listeners
			_broadcastPov: function(pov) {
				this.emit('pov_changed', pov);
			},

			// *** _broadcastPano(panoid)
			// report a pano change to listeners
			_broadcastPano: function(panoid) {
				this.emit('pano_changed', panoid);

				var self = this;
				sv_svc.getPanoramaById(
					panoid,
					function(data, stat) {
						if(stat == GMaps.StreetViewStatus.OK) {
							sv_svc.serializePanoData(data);
							self.emit('meta', data);
						}
					}
				);
			},

			// *** _getLinkDifference(
			//                         GMaps.StreetViewPov,
			//                         GMaps.StreetViewLink
			//                       )
			// return the difference between the current heading and the provided link
			_getLinkDifference: function(pov, link) {
				var pov_heading  = pov.heading;
				var link_heading = link.heading;

				var diff = Math.abs(link_heading - pov_heading) % 360;

				return diff >= 180 ? diff - (diff - 180) * 2 : diff;
			},

			// *** _getForwardLink()
			// return the link nearest the current heading
			_getForwardLink: function() {
				var pov                = this.streetview.getPov();
				var links              = this.streetview.getLinks();
				var len                = links.length;
				var nearest            = null;
				var nearest_difference = 360;

				for(var i = 0; i < len; i++) {
					var link       = links[i];
					var difference = this._getLinkDifference(pov, link);
					console.log(difference, link);
					if(difference < nearest_difference) {
						nearest            = link;
						nearest_difference = difference;
					}
				}

				return nearest;
			},

			// *** _collectPov()
			// set the street view pov to match internal state
			_collectPov: function() {
				var self = this;
				requestAnimationFrame(function() {
					self._collectPov();
				});

				if(this.framesSincePanoChange > 0) {
					this.framesSincePanoChange--;
					return;
				}

				if(!this.pov) {
					return;
				}

				var pov1 = this.streetview.getPov();
				if(pov1 && this.pov.heading !== pov1.heading || this.pov.pitch !== pov1.pitch) {
					this.streetview.setPov(this.pov);
				}
			}
		});
	});
