/**
 * Created by Freddy on 05/02/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                      = window.__VI__ || window;

    var _                       = NS.utils;
    var _l                      = NS.logger;
    var Class                   = window.jsface.Class;

    /**
     *
     * TODO : ADD PATCH HTTP METHOD
     *
     * A mixin, intended to be used with ResourceManager sub-classes, that adds helper functions
     * to interact with a RESTful HTTP API.
     *
     * Choices are made, limiting the way you can make requests, staying close to a RESTful API design.
     *
     * The mixin assumes that the HTTP API client instance is available as this.httpAPI.
     * This client instance must expose a request() method with the following signature:
     *
     * request(method, resourcePath, data, responseCb)
     *
     *
     * @class           SpeaksREST
     * @module          M*C
     *
     * @for             ResourceManager
     *
     */
    NS.SpeaksREST = Class({

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        /**
         *
         * Get resource data
         *
         * Multiple calling conventions:
         *
         * _get(resultCb):
         * Get list of resources
         * e.g. GET /users
         *
         * _get(options, resultCb):
         * Get list of resources based options send as query params
         * e.g. GET /users?name=sara
         *
         * _get(resourceID, resultCb):
         * Get the resource with ID <resourceID>
         * e.g. GET /users/42
         *
         * _get(resourceID, relatedResourcePath, resultCb):
         * Get related resource data, at <relatedResourcePath>,of resource with ID <resourceID>
         * e.g. GET /users/42/locations or GET /users/42/locations/7
         *
         * _get(resourceID, relatedResourcePath, options, resultCb):
         * Using options as query params to get related resource data, at <relatedResourcePath>, of
         * resource with ID <resourceID>,
         * e.g. GET /users/42/locations?city=amsterdam
         *
         * @method _get
         *
         * @param {string|number} [resourceID]      ID of resource to get
         * @param {string} [relatedResourcePath]    Sub-path to related resource of the relevant resource
         *                                          e.g. 'locations' or 'locations/7'
         * @param {object} [options]                Object with options to serialize as query parameters
         * @param {function} resultCb               function(data, err) request result callback
         *
         * @returns {boolean}                       True if initiation of request was successful, else false
         *
         * @protected
         *
         */
        _get : function(resourceID, relatedResourcePath, options, resultCb) {
            var callError = false;
            if (arguments.length == 1) {
                if (_.func(resourceID)) {                                               //_get(resultCb)
                    resultCb    = resourceID;
                    resourceID  = undefined;
                } else {
                    callError = true;
                }
            } else if (arguments.length == 2) {
                if (_.obj(resourceID) && _.func(relatedResourcePath)) {                 //_get(options, resultCb)
                    options             = resourceID;
                    resourceID          = undefined;

                    resultCb            = relatedResourcePath;
                    relatedResourcePath = undefined;
                } else if (_.string(resourceID) && _.func(relatedResourcePath)) {       //_get(resourceID, resultCb)
                    resultCb            = relatedResourcePath;
                    relatedResourcePath = undefined;
                } else {
                    callError = true;
                }
            } else if (arguments.length == 3) {
                if (
                        _.string(resourceID) &&
                        _.string(relatedResourcePath) &&
                        _.func(options)
                   )
                {                                                                       //_get(resourceID, relatedResourcePath, resultCb)
                    resultCb = options;
                    options = undefined;
                } else {
                    callError = true;
                }
            }

            if (callError) {
                var me = "{0}::SimpleResourceManager::_get".fmt(this.getIName());
                _l.error(me, "Calling convention not recognized, unable to fulfill the request");
                return false;
            }

            return this._request("get", resourceID, relatedResourcePath, options, resultCb);
        },

        /**
         *
         * Post resource data
         *
         * * Multiple calling conventions:
         *
         * _post(data, resultCb):
         * Post data directly to the resource endpoint to create new resource object
         * e.g. POST /users
         *
         * _post(resourceID, relatedResourcePath, data, resultCb):
         * Post data to related resource of resource with ID <resourceID>, to create new related resource
         * e.g. POST /users/42/locations

         * @method _post
         *
         * @param {string|number} [resourceID]      ID of resource to get
         * @param {string} [relatedResourcePath]    Sub-path to related resource of the relevant resource
         *                                          e.g. 'locations' or 'locations/7'
         * @param {object} data                     New resource data to post
         * @param {function} resultCb               function(data, err) request result callback
         *
         * @returns {boolean}                       True if initiation of request was successful, else false
         *
         * @protected
         *
         */
        _post: function(resourceID, relatedResourcePath, data, resultCb) {
            var callError = false;
            if (arguments.length == 1) {
                callError = true;
            } else if (arguments.length == 2) {
                if (_.obj(resourceID) && _.func(relatedResourcePath)) {
                    data = resourceID;
                    resourceID = undefined;

                    resultCb            = relatedResourcePath;
                    relatedResourcePath = undefined;
                } else {
                    callError = true;
                }
            }

            if (callError) {
                var me = "{0}::SimpleResourceManager::_post".fmt(this.getIName());
                _l.error(me, "Calling convention not recognized, unable to fulfill the request");
                return false;
            }

            return this._request("post", resourceID, relatedResourcePath, data, resultCb);
        },

        /**
         *
         * Put resource data
         *
         * _put(resourceID, data, resultCb):
         * Put resource data to resource with ID <resourceID>
         * e.g. PUT /users/42
         *
         * _put(resourceID, relatedResourcePath, data, resultCb):
         * Put resource data to related resource, at <relatedResourcePath>, of resource with ID <resourceID>
         * e.g. PUT /users/42/location/7

         * @method _put
         *
         * @param {string|number} resourceID        ID of resource to put
         * @param {string} [relatedResourcePath]    Sub-path to related resource of the relevant resource
         *                                          e.g. 'locations' or 'locations/7'
         * @param {object} data                     New resource data to put
         * @param {function} resultCb               function(data, err) request result callback
         *
         * @returns {boolean}                       True if initiation of request was successful, else false
         *
         * @protected
         *
         */
        _put : function(resourceID, relatedResourcePath, data, resultCb) {
            var callError = false;
            if (arguments.length < 3) {
                callError = true;
            } else if (arguments.length == 3) {
                if (
                        _.string(resourceID) &&
                        _.obj(relatedResourcePath) &&
                        _.func(data)
                   )
                {                                                                       //_put(resourceID, data, resultCb):
                    resultCb = data;

                    data = relatedResourcePath;
                    relatedResourcePath = undefined;
                } else {
                    callError = true;
                }
            }

            if (callError) {
                var me = "{0}::SimpleResourceManager::_put".fmt(this.getIName());
                _l.error(me, "Calling convention not recognized, unable to fulfill the request");
                return false;
            }

            return this._request("put", resourceID, relatedResourcePath, data, resultCb);
        },

        /**
         *
         * Delete resource
         *
         * _del(options, resultCb):
         * Delete resources adhering to the options send as the request body
         * e.g. DELETE /users with options as body
         *
         * _del(resourceID, resultCb):
         * Delete resource with ID <resourceID>
         * e.g. DELETE /users/42
         *
         * _del(resourceID, relatedResourcePath, resultCb):
         * Delete related resource, at <relatedResourcePath>, of resource with ID <resourceID>
         * e.g. DELETE /users/42/locations/7
         *
         * _del(resourceID, relatedResourcePath, options, resultCb):
         * Delete related resource, at <relatedResourcePath>, of resource with ID <resourceID> using given <options>
         * e.g. DELETE /users/42/locations with options as body
         *
         * @method _delete
         *
         * @param {string|number} [resourceID]      ID of resource to get
         * @param {string} [relatedResourcePath]    Sub-path to related resource of the relevant resource
         *                                          e.g. 'locations' or 'locations/7'
         * @param {object} [options]                New resource data to put

         * @param {function} resultCb               function(data, err) request result callback
         *
         * @returns {boolean}                       True if initiation of request was successful, else false
         *
         * @protected
         *
         */
        _del : function(resourceID, relatedResourcePath, options, resultCb) {
            var callError = false;
            if (arguments.length == 1) {
                callError = true;
            } else if (arguments.length == 2) {
                if (_.obj(resourceID) && _.func(relatedResourcePath)) {                 //_delete(options, resultCb)
                    options             = resourceID;
                    resourceID          = undefined;

                    resultCb            = relatedResourcePath;
                    relatedResourcePath = undefined;
                } else if (_.string(resourceID) && _.func(relatedResourcePath)) {       //_delete(resourceID, resultCb)
                    resultCb            = relatedResourcePath;
                    relatedResourcePath = undefined;
                } else {
                    callError = true;
                }
            } else if (arguments.length == 3) {
                if (
                        _.string(resourceID) &&
                        _.string(relatedResourcePath) &&
                        _.func(options)
                   )
                {                                                                       //_delete(resourceID, relatedResourcePath, resultCb):
                    resultCb = options;
                    options = undefined;
                } else {
                    callError = true;
                }
            }

            if (callError) {
                var me = "{0}::SimpleResourceManager::_get".fmt(this.getIName());
                _l.error(me, "Calling convention not recognized, unable to fulfill the request");
                return false;
            }

            return this._request("delete", resourceID, relatedResourcePath, options, resultCb);
        },

        _request : function(action, resourceID, propPath, data, resultCb) {
            var me      = "{0}::SimpleResourceManager::_request".fmt(this.getIName());
            var success = false;

            var path    = this._getAPIPath(resourceID, propPath);

            if (!this.isValid()) {
                _l.error(me, "Resource manager not valid, unable to {0} {1}".fmt(action, path));
                return success;
            }

            return this.httpAPI.request(action, path, data, resultCb);
        },

        _getAPIPath : function(resourceID, relatedResourcePath) {
            resourceID              = resourceID + "";
            relatedResourcePath     = relatedResourcePath + "";

            var __valid = function(path) {
                return !_.empty(path);
            };

            var path    = _.joinPaths([this.resourceName, "/"]);

            path        = _.joinPaths([path, (__valid(resourceID) ? _.joinPaths([resourceID, "/"]) : "")]);
            path        = _.joinPaths([path, (__valid(relatedResourcePath) ? relatedResourcePath : "")]);

            return path;
        }

    });
})();

