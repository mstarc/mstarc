/**
 * Created by Freddy Snijder on 13/01/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS              = window.__VI__ || window;

    var _               = NS.utils;
    var _l              = NS.logger;
    var Class           = window.jsface.Class;
    var NamedBase       = NS.NamedBase;
    var Configurable    = NS.Configurable;

    NS.Model = Class([NamedBase, Configurable], {

        _resourceManagerTable : null,

        /**
         *
         * An abstract Model class, representing the ground truth for a View.
         * Although a model is in principle for one MVC combination, multiple controllers can be
         * registered to one model. This allows secondary controllers to listen to specific details in
         * a model that is of interest to them.
         *
         * @class           Model
         * @module          M*C
         *
         * @extends         NamedBase
         * @uses            Configurable
         *
         * @constructor
         *
         * @param {String} modelName                name of model
         * @param {Object} resourceManagerTable     Hash table of resourceManagers that the model needs to
         *                                          get (new) data from, and provide updated data to.
         *                                          Usually a model only deals with one type of resource, however this
         *                                          setup allows for more complex MVC dealing with multiple resource
         *                                          types
         *
         * @param {Object} [config]                 Object containing additional properties the model needs to
         *                                          know about. The properties in the config are added to the Model
         *                                          instance if they not already exist. Also see Configurable mixin.
         *
         */
        constructor: function (modelName, resourceManagerTable, config) {
            var me = "HTTPAPIClient::constructor";
            NS.Model.$super.call(this, modelName);

            this._valid                 = true;
            this._resourceManagerTable  = resourceManagerTable;

            this._addConfigProperties(config);
        }

    });
})();
