if(jQuery === undefined) throw 'dropjs requires jQuery';

(function($){
    // primary object everything else derives from
    function DropObject() { }
    // merges given object into a prototype of a new
    // function and returns the result that can be used
    // with the 'new' keyword
    DropObject.breed = function(o) {
        var newobj = function(){ 
            ( this.init || this._init ).apply( this, arguments );
        };
        // extend own prototype with provided object
        newobj.prototype = $.extend( o, this.prototype );
        newobj.breed = this.breed;
        return newobj;
    }

    // controls are buttons, checkboxes, anything that could react to actions
    var Control = DropObject.breed({
        init: function(elmt) {
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
        // initialize the jQuery selector within scope of context to speed things up.
        _initSelector: function(context){ 
            this._elmt = $(this._selector, context);
            delete this._selector;
        },
        bind: function(eventType, handler){
            this._view.bind(this, eventType, handler);
        },
        elmt: function(){ return this._elmt; }

    });

    var View = DropObject.breed({
        init: function(container, controls) {
            this._container = $(container);
            this._controller = undefined;
            this._controls = []; // keep array of all controls as well

            // wrap control in jQuery object if necessary
            for(var c in controls) this.addControl(c, controls[c]);
        },
        addControl: function(name,control) {
            if(this[name] !== undefined) throw(name+" is already defined.");
                this[name] = (control instanceof Control) ? control : new Control(control);
            this._controls.push({c: this[name]});
            this[name]._view = this;
            this[name]._initSelector(this._container);
        },
        bind: function(control, eventType, handler) {
            var c = 0;
            while(this._controls[c].c != control) c++; // aa-haha
                this._controls[c].h = handler;
            // only bind if we're not already
            var events = this._container.data().events;
            if(typeof events == 'undefined' || typeof events[eventType] == 'undefined')
                this._container.bind(eventType, $.proxy( this._eventHandler, this ) );
        },
        _eventHandler: function(e){
            var c;
            for(var i=0; i < this._controls.length; i++) 
                // call the handler if one is assigned for this control
                if (this._controls[i].c._elmt.get(0) == e.target
                    && typeof this._controls[i].h != 'undefined') {
                    // add control event was triggered on to the event obj
                    e.targetControl = this._controls[i].c;
                    this._controls[i].h.call(this._controller, e); 
                    e.preventDefault();
                }
        }
    });


    // controllers react to events and do stuff to views
    var Controller = DropObject.breed({ 
        init: function(o){
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


