if(jQuery === undefined) throw 'dropmvc requires jQuery';

(function($){
    // The primary object everything else derives from
    function DropObject() { }
    // Simplified inheritance. Merge given object into a prototype of a 
    // new function and return the result that can be used with the 'new' 
    // keyword
    DropObject.breed = function(o) {
        var newobj = function(){ 
            // supply an init() or _init() method, and it'll get called
            // on new object creation
            ( this.init || this._init ).apply( this, arguments );
        };
        newobj.prototype = $.extend( o, this.prototype );
        newobj.breed = this.breed;
        return newobj;
    }

    // Controls are buttons, checkboxes, anything that could emit events.
    // They are a basic unit of UI, and are grouped together with a View.
    var Control = DropObject.breed({
        _init: function(elmt) {
            this._elmt = false;
            this._view = undefined;
            this._selector = undefined;
            if(typeof elmt == 'string') {
                if(elmt.length == 0) throw('Can\'t accept empty selector.');
                this._selector = elmt;
            } else {
                $.extend(this, elmt);
                if(this.selector === undefined) throw('The "selector" property is required.');
                    this._selector = this.selector;
                delete this.selector;
            }
        },
        // Initialize the jQuery selector within scope of context. Run upon
        // assigning this controler to a view to speed things up.
        _initSelector: function(context){ 
            this._elmt = $(this._selector, context);
            delete this._selector;
        },
        // Bind this control to a given function. The function is always 
        // run in the context of the Controller this controler belongs to.
        bind: function(eventType, handler){
            this._view.bind(this, eventType, handler);
        }
    });

    // Views are a generic 'container' that contains Control objects, 
    // listens for bubbling events, and calls corresponding controller 
    // methods if the events are emitted from one of its controls.
    var View = DropObject.breed({
        // View's contructor takes in a jQuery selector and an optional object
        // filled with controls to assign to this view
        _init: function(selector) {
            var controls = arguments[1];
            this._container = $(selector);
            this._controller = undefined;
            this._controls = []; // keep array of all controls as well

            // wrap control in jQuery object if necessary
            for(var c in controls) this.control(c, controls[c]);
        },
        // Add a Control object to this view. Takes in a name of the
        // control and an object filled out with methods for this control.
        control: function(name,control) {
            if(this[name] !== undefined) throw(name+" is already defined.");
                this[name] = (control instanceof Control) ? control : new Control(control);
            this._controls.push({control: this[name]});
            this[name]._view = this;
            this[name]._initSelector(this._container);
        },
        // Bind a handler (most often a controller method) to a given control
        // and event type.
        bind: function(control, eventType, handler) {
            var c = 0;
            while(this._controls[c].control != control) {
                if(c > this._controls.length) throw 'No such control in this view.';
                c++; // aa-haha
            }
            this._controls[c].handler = handler;
            // only bind if we're not already
            var events = this._container.data().events;
            if(typeof events == 'undefined' || typeof events[eventType] == 'undefined')
                this._container.bind(eventType, $.proxy( this._eventHandler, this ) );
        },
        // Handle DOM events from controls and redirect them to the appropriate
        // controller methods.
        _eventHandler: function(e){
            for(var i=0; i < this._controls.length; i++) 
                // call the handler if one is assigned for this control
                if (this._controls[i].control._elmt.get(0) == e.target
                    && typeof this._controls[i].handler != 'undefined') {
                    // easy access to the control the event was triggered on
                    e.targetControl = this._controls[i].control;
                    this._controls[i].handler.call(this._controller, e); 
                    e.preventDefault();
                    return false;
                }
        }
    });


    // Controllers connect views, controls and models together. E.g. a control 
    // is typically assigned to a controller method.
    var Controller = DropObject.breed({ 
        _init: function(o){
            this._views = {}; 
            $.extend(this, o); 
            var init = (o.init || o._init);
            var bindings = (o.bindings || o._bindings);
            // run the initializer and add bindings if present
            if(init !== undefined) init.apply(this);
            if(bindings !== undefined) bindings.apply(this);
        },

        // add a view to the controller
        view: function(name, view) {
            this[name] = this._views[name] = view;
            view._controller = this;
        }
    });
    
    // finally, announce self to the world
    window.drop = { view: View, co: Controller, ctrl: Control, obj: DropObject};
})(jQuery);


