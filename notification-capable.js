/**
 * Created by Freddy Snijder on 20/01/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS          = window.__VI__ || window;

    var _           = NS.utils;
    var _l          = NS.logger;
    var Class       = window.jsface.Class;

    NS.NotificationCapable = Class({

        _listeners      : {},
        _listenersIndex : {},

        /**
         *
         * NotificationCapable Mixin.
         * Adds functionality to register objects to an instance and allow this instance to notify the listeners.
         *
         * Notification works by calling _notify(eventName, eventData). To receive event data for 'eventName', the
         * registered listeners must have a method implemented with the following signature:
         *
         *  <eventName> : function(notifier, data) { ... }
         *
         * For example a receiving method in a controller listening to a model for dataUpdated events could
         * look like this:
         *
         *  dataUpdated : function(model, data) { ... }
         *
         *
         * A listener is registered through register(listenerName, listener)
         *
         *
         * You can control who is allowed to be registered by overriding:
         *  allowedToRegister(listenerName, listener)
         *
         * This method returns true by default
         *
         *
         * @module  M*C
         * @class   NotificationCapable
         *
         */

        /**
         *
         * Register listener with name listerName
         *
         * @method register
         *
         * @param {string} listenerName
         * @param {object} listener
         *
         * @returns {boolean}               True on success, else false
         *
         */
        register : function(listenerName, listener) {
            var instanceName = _.call(this, 'getIName') || '[UNKOWN]';
            var me = "[{0}]::NotificationCapable::register".fmt(instanceName);
            var success = false;

            if (!_.def(listenerName)) {
                _l.error(me, "No listener name given, unable to register");
                return success;
            }

            if (!_.obj(listener)) {
                _l.error(me, "No listener instance given, unable to register");
                return success;
            }

            if (_.def(this._listeners[listenerName])) {
                _l.error(me, "A listener with name [{0}] already registered, unable to register");
                return success;
            }

            if (!this.allowedToRegister(listener)) {
                _l.error(me, "It is not allowed to register listener [{0}], unable to register");
                return success;
            }

            _l.info("Registering [{0}]".fmt(listenerName));

            success = true;
            this._listeners[listenerName] = listener;
            this._listenersIndex[listener] = listenerName;
        },

        /**
         *
         * Deregisters the listener object
         *
         * @method deregister
         *
         * @param {object} listener
         *
         * @returns {boolean}
         *
         */
        deregister : function(listener) {
            var instanceName = _.call(this, 'getIName') || '[UNKOWN]';
            var me = "[{0}]::NotificationCapable::deregister".fmt(instanceName);
            var success = false;

            if (!_.obj(listener)) {
                _l.error(me, "No listener instance given, unable to deregister");
                return success;
            }

            var listenerName = this._listenersIndex[listener];
            if (!_.def(listenerName)) {
                _l.error(me, "Object not found as a registered listener, unable to deregister");
                return success;
            }

            _l.info("Deregistering [{0}]".fmt(listenerName));

            success = true;
            delete this._listeners[listenerName];

            return success;
        },

        allowedToRegister : function(listener) {
            return true;
        },

        destroy : function() {
            this._listeners = {};
            this._listenersIndex = {};
        },

        /***************************************************
         *
         * PROTECTED METHODS
         *
         **************************************************/

        /**
         *
         * Notifies registered listeners of event eventName with eventData.
         *
         * Also see NotificationCapable constructor for more info.
         *
         * @method _notify
         *
         * @param {string} eventName        Event name string
         * @param {object} eventData        Event data object
         *
         * @protected
         *
         */
        _notify : function(eventName, eventData) {
            var me      = "[{0}]::NotificationCapable::_notify".fmt(_.call(this, 'getIName') || '[UNKOWN]');

            if (!_.string(eventName)) {
                _l.error(me, "No valid event name given, unable to notify listeners");
                return;
            }

            var listenerNames = Object.getOwnPropertyNames(this._listeners);

            var listenerName    = null;
            var listener        = null;
            for (var idx in listenerNames) {
                listenerName    = listenerNames[idx];
                listener        = this._listeners[listenerName]

                if (!_.obj(listener)) {
                    continue;
                }

                if (!_.hasMethod(listener, eventName)) {
                    _l.debug(me, ("Listener {0} has no method named {1} " +
                                  "to process the event data, skipping").fmt(listenerName, eventName));
                    continue;
                }

                listener[eventName].call(listener, this, eventData);
            }
        }

    });
})();

