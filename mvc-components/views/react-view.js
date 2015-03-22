/**
 * Created by Freddy Snijder on 01/03/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;
    var Class               = window.jsface.Class;
    var React               = window.React;
    var View                = NS.View;

    var CanShowUI           = NS.CanShowUI;

    NS.ReactView = Class([View, CanShowUI], {

        $statics : {
            REQUIRED_REACT_API : {
                methods : ['createElement', 'render']
            },

            /*REQUIRED_REACT_CLASS_API : {
                methods : ['mountComponent', 'receiveComponent']
            },*/

            createReactElement : function(type, config, children) {
                return React.createElement(type, config, children);
            }
        },

        _state              : {},

        /**
         *
         * {
         *      scheduled : {true | false},
         *      callbacks : {array of callbacks to call when the state is set}
         * }
         *
         */
        _setStateScheduling : null,

        _reactUIClass       : null,
        _reactUIElement     : null,
        _reactUIInstance    : null,

        _DOMContainer       : null,

        /**
         *
         * Hooks up a React UI to a MVC combination. A react UI is a high-level React element that combines multiple
         * elements in to an UI.
         *
         *
         * IMPORTANT : Each ReactJS UI must implement the method componentDidMount, as follows:
         *
         * componentDidMount : function() {
         *
         *   ...
         *
         *   this.props.onComponentDidMount();
         *
         *   ...
         *
         * }
         *
         * This will call the _onComponentDidMount() of the ReactView, which controls when state updates can be
         * provided to the React UI, through .setState().
         *
         *
         * ** HOW THE REACT UI INSTANCE IS CREATED **
         * The ReactView renders the React UI, by first creating the _reactUIElement based on the _reactUIClass given
         * during construction of the view. _createReactUIElement() provides the implementation for creating the
         * _reactUIElement. This method calls the _extendReactUIProps(props) method that allows you to extend the
         * react UI properties object that is passed during construction of the react UI instance.
         *
         * For instance, you can extend this property object, props, with view methods that can process input
         * received by the react UI. So the _extendReactUIProps methods could look something like this:
         *
         * _extendReactUIProps : function(props) {
         *      var view = this; //The view instance
         *
         *      //Handling a onSubmit event from the ReactUI
         *      props.onSubmit = view.handleSubmit.bind(view);
         *
         *          ...
         *
         *      //Some property used in the ReactUI
         *      props.someProp = view.someProp;
         *
         *      return props;
         * }
         *
         *
         * ** HOW THE REACT UI IS RENDERED **
         * During _render() React.render() is called which returns a reference to the rendered React component:
         * _reactUIInstance. This instance is used to call setState(), allowing the view to pass state updates to
         * the React UI. In the callback if React.render() _onViewRendered() is called which subsequently calls
         * _onRendered(), which can optionally be implemented in your subclass.
         *
         *
         * NOTES:
         * - Before calling _onRendered(), the initialState, set by _state, is set in the ReactUI instance.
         *   This is done by calling the _renderState() method.
         *
         * - Every time you update the view _state object, call _renderState() afterwards to update the state in the
         *   React UI instance.
         *
         * - You can get the reactUI instance in your subclass using _getReactUIInstance()
         *
         * - This class has it's own base implementation of the _setup() method. You should call this implementation
         *   in your own implementation as follows:
         *
         *   success = MyReactView.$superp._setup.call(this);
         *
         *
         * Methods you need to override in subclasses :
         *
         *  - _setup()                          Sets up the view using the given configuration properties.
         *                                      This is also the place where you validate configuration properties.
         *
         *                                      Returns true on success else false
         *
         *                                      This method is called during construction.
         *
         *  - _extendReactUIProps               Extends the property object that is used during construction of
         *                                      the React UI. Through the properties object you can hook up
         *                                      view methods that need to handle user input.
         *
         * Methods you can OPTIONALLY override in subclasses :
         *
         *  - _onRendered                       Called after the view is rendered
         *
         *
         * @class           ReactView
         * @module          M*C
         *
         * @extends         View
         *
         * @constructor
         *
         * @param {String} viewName                 name of view
         * @param {ReactClass} reactUIClass         ReactClass object
         * @param {HTMLElement} DOMContainer        Container element in the DOM in which to render the view
         * @param {Object} [config]                 Not used by ReactView base class, but can be
         *                                          used by subclass
         *
         */
        constructor: function (viewName, reactUIClass, DOMContainer, config) {
            var me = "ReactView::constructor";

            this._reactUIClass = reactUIClass;
            this._DOMContainer = DOMContainer;

            this._setStateScheduling = {
                  scheduled : false,
                  callbacks : []
            };

            NS.ReactView.$super.call(this, viewName, config);
        },

        isRendered : function() {
            return this._didRender && _.object(this._reactUIInstance);
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _setup : function() {
            var me      = "{0}::ReactView::_setup".fmt(this.getIName());
            var success = false;

            var errorOccurred = false;
            if (!_.interfaceAdheres(React, NS.ReactView.REQUIRED_REACT_API)) {
                _l.error(me, "Unable to setup React view, " +
                             "no React component or does not adhere to required interface. " +
                             "Did you load the React library?");
                _l.info(me, "Required React API is : ", _.stringify(NS.ReactView.REQUIRED_REACT_API));

                errorOccurred = true;
            }

            if (!_.class(this._reactUIClass)) {
                _l.error(me, "Unable to setup React view, ReactClass is not a Class");
                errorOccurred = true;
            }

            if (!(this._DOMContainer instanceof window.HTMLElement)) {
                _l.error(me, "Unable to setup React view, " +
                             "Container DOM element is not a HTMLElement");

                errorOccurred = true;
            }

            return (success = !errorOccurred);
        },

        /**
         *
         * Renders the React UI element by creating it first using the _createReactUIElement() method
         *
         * @returns {boolean}
         *
         * @protected
         */
        _render : function() {
            var me      = "{0}::ReactView::_render".fmt(this.getIName());
            var self    = this;

            var success = false;

            this._reactUIElement = this._createReactUIElement(this._reactUIClass);
            if (!_.def(this._reactUIElement)) {
                _l.error(me, "Unable to create React UI element, will not render view");
                return success;
            }

            this._reactUIInstance = React.render(this._reactUIElement, this._DOMContainer, function() {
                //Make async because the rendering seems to be a synchronous process such that
                // this callback is called before returning the react UI instance
                setTimeout(function() {
                    self._renderState();
                    self._onViewRendered();
                }, 0);
            });

            return (success = true);
        },

        _scheduleRenderState : function(stateRenderedCb) {
            var me = "{0}::ReactView::_scheduleRenderState".fmt(this.getIName());

            var callbackGiven   = _.func(stateRenderedCb);

            var __returnError   = function(errStr) {
                callbackGiven ? stateRenderedCb({ message : errStr }) :  _l.error(me, errStr);
            };

            if (this._setStateScheduling.scheduled) {
                if (callbackGiven) { this._setStateScheduling.callbacks.push(stateRenderedCb) }
                _l.debug(me, "Setting state delayed, waiting for React UI to mount ...");
                return;
            }

            var ui = this._getReactUIInstance();
            if (_.hasMethod(ui, "isMounted", "React UI Instance")) {
                if (ui.isMounted()) {
                    if (callbackGiven) { this._setStateScheduling.callbacks.push(stateRenderedCb); }
                    this._renderState();
                } else {
                    _l.debug(me, "React UI not mounted, set state delayed, waiting for React UI to mount ...");
                    this._setStateScheduling.scheduled = true;
                    if (callbackGiven) { this._setStateScheduling.callbacks.push(stateRenderedCb); }
                }
            } else {
                __returnError("No valid React UI instance available, unable to render state");
            }
        },

        _renderState : function() {
            var me = "{0}::ReactView::_renderState".fmt(this.getIName());
            var self = this;

            var callbackGiven   = !_.empty(this._setStateScheduling.callbacks);

            var __return   = function(errStr) {
                if (callbackGiven) {
                    var cbs = self._setStateScheduling.callbacks;
                    var cb  = null;
                    while (!_.empty(cbs)) {
                        cb = cbs.shift();
                        cb(_.def(errStr) ? { message : errStr } : null);
                    }
                } else {
                    _.def(errStr) ? _l.error(me, errStr) : null;
                }
            };

            var ui = this._getReactUIInstance();
            if (_.hasMethod(ui, "setState", "React UI Instance")) {
                ui.setState(this._state);
                __return();
            } else {
                __return("No valid React UI instance available, unable to render state");
            }
        },

        _onComponentDidMount : function() {
            var me = "{0}::ReactView::_onComponentDidMount".fmt(this.getIName());

            _l.debug(me, "React UI mounted.");
            if (this._setStateScheduling.scheduled) {
                _l.debug(me, "Set state was scheduled, executing now ...");
                this._setStateScheduling.scheduled = false;
                this._renderState();
            }
        },

        _extendReactUIProps : function(props) {
            var me = "{0}::ReactView::_extendReactUIProps".fmt(this.getIName());

            _l.info(me, "No implementation, there are no properties to instantiate the React UI with?");
            _l.info(me, "Implement this method in your subclass in order to add React UI properties");
            _l.info(me, "This is the place to add hooks to receive input back from the UI.");

            return props;
        },

        _createReactUIElement : function(reactUIClass) {
            var me      = "{0}::ReactView::_createReactUIElement".fmt(this.getIName());
            var self    = this;

            var __createProps = function() {
                return {
                    onComponentDidMount : self._onComponentDidMount.bind(self)
                };
            };
            var props = this._extendReactUIProps(__createProps());
            if (!_.obj(props)) {
                _l.error(me, "Your _extendReactUIProps method did not return the " +
                             "(extended) property object provided, please return it!");
                _l.info(me, "For now the originally provided property object will be used." +
                            "Your React UI will likely not work properly, though ...");
                props = __createProps();
            }

            return ReactView.createReactElement(reactUIClass, props);
        },

        _getReactUIInstance : function() {
            return this._reactUIInstance;
        }
    });
})();
