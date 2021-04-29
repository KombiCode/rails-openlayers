// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

require("@rails/ujs").start()
require("@rails/activestorage").start()
require("channels")
require("local-time").start()

window.Rails = Rails

import 'bootstrap'
import 'data-confirm-modal'

import "@hotwired/turbo-rails"

// import 'ol/ol.css';
// import '../libs/v6.5.0-dist/ol.css';
// import "ol-layerswitcher/src/ol-layerswitcher.css";

// internal imports
import { initOpenLayers } from '../plugins/init_openlayers'

$(document).on("turbo:load", () => {
  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();
  initOpenLayers();
})

import "controllers"
