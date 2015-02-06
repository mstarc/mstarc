/**
 * Created by Freddy Snijder on 13/01/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;
    var Class               = window.jsface.Class;
    var MVCComponent        = NS.MVCComponent;

    NS.Model = Class(MVCComponent, {

        _resourceManagerTable : null,

        /**
         *
         * An abstract Model class, representing the ground truth for a View.
         * Although a model is in principle for one MVC combination, multiple controllers can be
         * connected to one model. This allows secondary controllers to listen to specific details in
         * a model that is of interest to them.
         *
         *
         * DON'T FORGET:
         *
         * * When the component is ready to process events you need to call this._readyToProcessEvents()
         * in your subclass
         *
         *
         * Methods you need to override in subclasses :
         *
         *  - _setup()                              Sets up the model using the given resource managers and
         *                                          configuration properties. This is also the place where you validate
         *                                          your resource managers and configuration properties.
         *
         *                                          Returns true on success else false
         *
         *
         * @class           Model
         * @module          M*C
         *
         * @extends         MVCComponent
         *
         * @constructor
         *
         * @param {String} modelName                name of model
         * @param {Object} resourceManagerTable     Hash table of resourceManagers that the model needs to
         *                                          get (new) data from, and provide updated data to.
         *                                          Usually a model only deals with one type of resource, however this
         *                                          setup allows for more complex MVCs dealing with multiple resource
         *                                          types
         *
         * @param {Object} [config]                 Object containing additional properties the model needs to
         *                                          know about. The properties in the config are added to the Model
         *                                          instance if they not already exist. Also see Configurable mixin.
         *
         */
        constructor: function(modelName, resourceManagerTable, config) {
            NS.Model.$super.call(this, modelName, config);

            var me = "{0}::Model::constructor".fmt(this.getIName());

            this._resourceManagerTable  = resourceManagerTable;

            this._valid = true;
            if (!this._setup()) {
                _l.error(me, "Model setup failed, model wil not function properly");
                this._valid = false;
            }
        },

        allowedToRegister : function(component) {
            var compName = _.call(component, 'getIName') || "[UNKNOWN]";

            return (_.call(component, 'isController', compName) === true);
        },

        /**
         *
         * Returns if instance is a model
         *
         * @returns {boolean}
         */
        isModel : function() {
            return true;
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _setup : function() {
            var me      = "{0}::Model::_setup".fmt(this.getIName());
            var success = false;

            _l.error(me, "No implementation given, don't know how to setup this model");
            _l.info(me, "If you don't need to do any set up, just override this method by simply returning true");
            return success;
        },

        _dispatchToControllers : function(eventName, eventData, eventProcessedCb, throttle, throttleDelay) {
            var success = false;

            if (!_.bool(throttle)) {
                throttle = false;
            }

            if (!throttle) {
                success = this._dispatch(eventName, eventData, eventProcessedCb);
            } else {
                success = this._dispatchThrottled(eventName, eventData, eventProcessedCb, throttleDelay);
            }

            return success;
        }
    });
})();
