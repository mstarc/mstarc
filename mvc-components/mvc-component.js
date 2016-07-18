/**
 * Created by Freddy Snijder on 13/01/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;
    var Class               = window.jsface.Class;
    var NamedBase           = NS.NamedBase;
    var Configurable        = NS.Configurable;
    var DispatchesEvents    = NS.DispatchesEvents;

    NS.MVCComponent = Class([NamedBase, Configurable, DispatchesEvents], {

        $statics : {
            REQUIRED_COMPONENT_CONNECT_API : {
                methods : ['getIName', 'register', 'isModel', 'isController', 'isView', 'processEvent']
            }
        },

        _isReady    : false,
        _eventQueue : null,

        _subComponents     : null,

        _subComponentName  : null,
        _parentComponent   : null,

        /**
         *
         * MVCComponent provides functionality shared by the Model, View and Controller classes.
         *
         * When the component is ready to process events you need to call this._readyToProcessEvents() in your subclass
         *
         *
         * When a MVCComponent receives an event it tries to process the event by calling a method called:
         *
         *      _<eventName>(origin, eventData, eventProcessedCb)
         *
         * Notice the underscore at the start of the method name.
         *
         *
         * Methods to override:
         * _componentIsReady
         *
         * @class           MVCComponent
         * @module          M*C
         *
         * @extends         NamedBase
         * @uses            Configurable
         * @uses            NotificationCapable
         *
         * @constructor
         *
         * @param {String} componentName            name of model
         *
         * @param {Object} [config]                 Object containing additional properties the model needs to
         *                                          know about. The properties in the config are added to the
         *                                          MVCComponent instance if they not already exist.
         *                                          Also see Configurable mixin.
         *
         */
        constructor: function (componentName, config) {
            var me = "{0}::MVCComponent::constructor".fmt(componentName);
            NS.MVCComponent.$super.call(this, componentName);

            this._eventQueue = [];
            this._subComponents = {};

            this._addConfigProperties(config);
        },

        connect: function(component) {
            var iName   = this.getIName();
            var me      = "{0}::MVCComponent::connect".fmt(iName);
            var success = false;

            if (!_.interfaceAdheres(component, MVCComponent.REQUIRED_COMPONENT_CONNECT_API)) {
                _l.error(me, "Component does not adhere to the required interface, unable to connect");
                return success;
            }

            if (!this.register(component.getIName(), component)) {
                _l.error(me, "A problem occurred registering component {0} with us, unable to connect".fmt(me));
                return success;
            }

            if (!component.register(iName, this)) {
                this.deregister(component);
                _l.error(me, "A problem occurred registering us with component {0}, unable to connect".fmt(me));
                return success;
            }

            return (success = true);
        },

        numberOfConnectedComponents : function() {
            this.numberOfProcessorsRegistered();
        },

        /**
         *
         *
         * @param {function} [filterFunc]   function(component) that returns true if the given component
         *                                  needs to be in the returned hash object, false otherwise.
         *
         * @returns {object}                Returns hash with registered components :
         *
         * {
         *
         *  <component name1> : <component instance1>,
         *
         *  ...
         *
         *  <component nameN> : <component instanceN>
         *
         * }
         *
         */
        getConnectedComponents : function(filterFunc) {
            var me      = "{0}::MVCComponent::getComponents".fmt(this.getIName());
            var comps   = {};

            if (!_.func(filterFunc)) {
                filterFunc = function(c) {
                    return true;
                }
            }

            var processors  = this.getRegisteredProcessors();
            var processor   = null;
            for (var processorName in processors) {
                if (!processors.hasOwnProperty(processorName)) {
                    continue;
                }

                processor = processors[processorName];

                if (filterFunc(processor)) {
                    comps[processorName] = processor;
                }
            }

            return comps;
        },

        allowedToRegister : function(component) {
            var me = "{0}::MVCComponent::allowedToRegister".fmt(this.getIName());
            _l.error(me, "No implementation provided, unable to assess if component is allowed to be registered");

            return false;
        },

        /**
         *
         * @param origin
         * @param eventName
         * @param eventData
         * @param eventProcessedCb      function(result, err)
         * @returns {boolean}
         */
        processEvent : function(origin, eventName, eventData, eventProcessedCb) {
            var me      = "{0}::MVCComponent::processEvent".fmt(this.getIName());
            var success = false;

            var eventMethodName = "_" + eventName;

            if (!this.isValid()) {
                var errMsg = ("MVC Component {0} is not valid, " +
                              "unable to process event {1}").fmt(this.getIName(), eventName);
                if (_.func(eventProcessedCb)) {
                    eventProcessedCb(null, {
                        message : errMsg
                    });
                } else {
                    _l.error(me, errMsg);
                }

                return success;
            }

            if (!_.hasMethod(this, eventMethodName)) {
                _l.debug(me, "No method available to process event {0}, not processing".fmt(eventName));
                return success;
            }

            if (this._componentIsReady()) {
                this[eventMethodName].call(this, origin, eventData, eventProcessedCb);
            } else {
                this._eventQueue.push({
                    origin      : origin,
                    name        : eventName,
                    data        : eventData,
                    callback    : eventProcessedCb
                });
            }

            return (success = true);
        },

        /**
         *
         * Returns if instance is a model
         * Override this function in model classes
         *
         * @returns {boolean}
         */
        isModel : function() {
            return false;
        },

        /**
         *
         * Returns if instance is a view
         * Override this function in view classes
         *
         * @returns {boolean}
         */
        isView : function() {
            return false;
        },

        /**
         *
         * Returns if instance is a controller
         * Override this function in controller classes
         *
         * @returns {boolean}
         */
        isController : function() {
            return false;
        },

        setSubComponent : function(name, component) {
            var me = this + "::_setSubComponent";
            var valid = _.validate(me, {
                name        : [name, 'string'],
                component  : [component, _.instanceof(NS.MVCComponent), "Invalid MVCComponent."]
            }, "Could not set subcomponent.");
            this._subComponents[name] = component;

            valid.component.setParentComponent(this, valid.name);
        },

        getSubComponents : function() {
            return this._subComponents;
        },

        setParentComponent : function(parent, subComponentName) {
            var me = this + "::setIsSubController";
            var valid = _.validate(me, {
                parent              : [parent, _.instanceof(NS.MVCComponent), "Invalid MVCComponent."],
                subComponentName    : [subComponentName, 'string']
            }, "Could not set parent controller.");
            if(!valid) return;

            this._parentComponent = valid.parent;
            this._subComponentName = valid.subComponentName;
        },

        isSubComponent : function() {
            return this._parentComponent !== null;
        },

        processSubComponentEvent : function(subComponentName, event, data) {
            var me = this + "::processSubComponentEvent";
            var valid = _.validate(me, {
                subControllerName   : [subComponentName, subComponentName in this._subComponents, "Subcomponent name not found."],
                event               : [event, 'string'],
                data                : [data, 'obj', {default: {}, warn: _.def(data)}]
            }, "Could not process subcomponent event.");
            if(!valid) return;

            // Call listener
            var customMethodName = '_{0}'.fmt(event);
            var handler = this[customMethodName];
            if(_.func(handler)) {
                handler.call(this, subComponentName, data);
            }
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _eventOut : function(event, data) {
            if(this.isSubComponent()) {
                this._parentComponent.processSubComponentEvent(this._subComponentName, event, data);
            } else {
                this._stateManager.sendEvent(event, data);
            }
        },

        _componentIsReady : function() {
            return this._isReady;
        },

        _processEventQueue : function() {
            var self    = this;
            var event   = null;

            var __scheduleEventProcessing = function(event) {
                //schedule in new run loop
                setTimeout(function() {
                    var eventMethodName = "_" + event.name;

                    if (_.hasMethod(self, eventMethodName)) {
                        self[eventMethodName].call(self, event.origin, event.data, event.callback);
                    } else {
                        var iName = self.getIName();

                        event.callback = _.ensureFunc(event.callback);
                        event.callback(null, {
                            message : "UNEXPECTED : MVC component {0} does not have a method to process {1} events"
                                    .fmt(iName, event.name)
                        });
                    }
                }, 0);
            };

            while (!_.empty(this._eventQueue)) {
                event = this._eventQueue.shift();

                if (!_.obj(event)) {
                    continue;
                }

                __scheduleEventProcessing(event);
            }
        },

        _readyToProcessEvents : function() {
            var iName   = this.getIName();
            var me      = "{0}::MVCComponent::_readyToProcessEvents".fmt(iName);

            if (this.isValid()) {
                this._processEventQueue();
                this._isReady = true;
            } else {
                _l.error(me, ("Component {0} is not valid, unable to go to ready state " +
                                "and process queued events").fmt(iName));
            }
        },

        _countRegisteredOfType : function(componentType) {
            var me = "{0}::MVCComponent::_countRegisteredOfType".fmt(this.getIName());
            var count = -1;

            if (!_.string(componentType)) {
                _l.error(me, "componentType is not a string, unable to count number of registered components");
                return count;
            }

            count = 0;
            var typeAssessor = "is" + _.capitaliseFirst(componentType);

            var processorNames = Object.getOwnPropertyNames(this._processors);

            var processorName = null;
            var processor = null;
            for (var idx in processorNames) {
                processorName = processorNames[idx];
                processor     = this._processors[processorName];

                count += ((_.exec(processor, typeAssessor, processorName) === true) ? 1 : 0);
            }

            return count;
        }

    });
})();
