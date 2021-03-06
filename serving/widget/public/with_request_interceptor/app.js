/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// [START cloud_search_widget_on_load]
/**
 * Load the cloud search widget & auth libraries. Runs after
 * the initial gapi bootstrap library is ready.
 */
function onLoad() {
  gapi.load('client:auth2:cloudsearch-widget', initializeApp)
}
// [END cloud_search_widget_on_load]

// [START cloud_search_widget_config]
/**
 * Client ID from OAuth credentials.
 */
var clientId = "...apps.googleusercontent.com";

/**
 * Full resource name of the search application, such as
 * "searchapplications/<your-id>".
 */
var searchApplicationName = "searchapplications/...";
// [END cloud_search_widget_config]

/**
 * Initializes required config parameters from the config.json
 * file.
 * @returns Promise
 */
function loadConfiguration() {
  return fetch('/config.json').then(function(response) {
    return response.json();
  }).then(function(config) {
    this.clientId = config.clientId;
    this.searchApplicationName = config.searchAppId;
    return config;
  });
}

// [START cloud_search_widget_intercept_request]
/**
 * Results container adapter that intercepts requests to dynamically
 * change which sources are enabled based on user selection.
 */
function ResultsContainerAdapter() {
  this.selectedSource = null;
}
ResultsContainerAdapter.prototype.interceptSearchRequest = function(request) {
  if (!this.selectedSource || this.selectedSource == 'ALL') {
    // Everything selected, fall back to sources defined in the search
    // application.
    request.dataSourceRestrictions = null;
  } else {
    // Restrict to a single selected source.
    request.dataSourceRestrictions = [
      {
        source: {
          predefinedSource: this.selectedSource
        }
      }
    ];
  }
  return request;
}
// [END cloud_search_widget_intercept_request]

/**
 * Initialize the app after loading the Google API client &
 * Cloud Search widget.
 */
function initializeApp() {
  // Load client ID & search app.
  loadConfiguration().then(function() {
    // Set API version to v1.
    gapi.config.update('cloudsearch.config/apiVersion', 'v1');

    // [START cloud_search_widget_register_adapter]
    var resultsContainerAdapter = new ResultsContainerAdapter();
    // Build the result container and bind to DOM elements.
    var resultsContainer = new gapi.cloudsearch.widget.resultscontainer.Builder()
      .setAdapter(resultsContainerAdapter)
      // [START_EXCLUDE]
      .setSearchApplicationId(searchApplicationName)
      .setSearchResultsContainerElement(document.getElementById('search_results'))
      .setFacetResultsContainerElement(document.getElementById('facet_results'))
      // [END_EXCLUDE]
      .build();
      // [END cloud_search_widget_register_adapter]

    // Build the search box and bind to DOM elements.
    var searchBox = new gapi.cloudsearch.widget.searchbox.Builder()
      .setSearchApplicationId(searchApplicationName)
      .setInput(document.getElementById('search_input'))
      .setAnchor(document.getElementById('suggestions_anchor'))
      .setResultsContainer(resultsContainer)
      .build();


    // [START cloud_search_widget_source_select_event]
    // Handle source selection
    document.getElementById('sources').onchange = (e) => {
      resultsContainerAdapter.selectedSource = e.target.value;
      let request = resultsContainer.getCurrentRequest();
      if (request.query) {
        // Re-execute if there's a valid query. The source selection
        // will be applied in the interceptor.
        resultsContainer.resetState();
        resultsContainer.executeRequest(request);
      }
    }
    // [END cloud_search_widget_source_select_event]
  }).then(function() {
    // Init API/oauth client w/client ID.
    return gapi.auth2.init({
        'clientId': clientId,
        'scope': 'https://www.googleapis.com/auth/cloud_search.query'
    });
  });
}
