if(jQuery === undefined) throw 'DropMVC requires jQuery';

(function($){
    Util = {
        /** extend prototype of b with a */
        ext: function(a, b) {
            b.prototype = $.extend(b.prototype, new a);
            b.prototype.constructor = b;
        }
    }

    // controls are buttons, checkboxes, anything that could react to actions
    function Control(elmt){ 
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
    }

    Control.prototype = {
        // initialize the jQuery selector within scope of context to speed things up.
        _initSelector: function(context){ 
            this._elmt = $(this._selector, context);
            delete this._selector;
        },
        bind: function(eventType, handler){
            this._view.bind(this, eventType, handler);
        },
        elmt: function(){ return this._elmt; }

    }

    function View(container, controls){
        this._container = $(container);
        this._controller = undefined;
		this._controls = []; // keep array of all controls as well

        // wrap control in jQuery object if necessary
        for(var c in controls) this.addCtrl(c, controls[c]);
    }

    View.prototype = {
        addCtrl: function(name,control) {
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
            this._container.bind(eventType, $.proxy( this._eventHandler, this) );
        },
        _eventHandler: function(e){
            var c;
            for(var i=0; i < this._controls.length; i++) 
                if (this._controls[i].c._elmt.get(0) == e.target)
                    this._controls[i].h.call(this._controller, e); 
        }
    }

    // controllers react to events and do stuff to views
    function Controller(o){ 
        this._views = {}; 
        $.extend(this, o); 
        var init = (o.init || o._init);
        if(init !== undefined) init.apply(this);
    }

    Controller.prototype = {
        // add a view to the controller
        view: function(name, view) {
            this[name] = this._views[name] = view;
            view._controller = this;
        }
    }
	
	// finally, announce self to the world
    window.drop = { view: View, co: Controller, ctrl: Control, u:Util };
})(jQuery);

