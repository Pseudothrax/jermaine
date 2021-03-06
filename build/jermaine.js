if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this == null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }
}
/*global describe, it, beforeEach, expect, xit, jasmine */

(function (ns) {
    "use strict";

    var namespace = function (ns, aliases, func) {
        var nsRegExp = /^([a-zA-Z]+)(\.[a-zA-Z]*)*$/,
            nsArray,
            currentNS,
            i;

        //check to assure ns is a properly formatted namespace string
        if (ns.match(nsRegExp) === null || ns === "window") {
            throw new Error("namespace: " + ns + " is a malformed namespace string");
        }

        //check to assure that if alias is defined that func is defined
        if (aliases !== undefined && func === undefined) {
            if (typeof (aliases) === "function") {
                func = aliases;
                aliases = undefined;
            } else if (typeof (aliases) === "object") {
                throw new Error("namespace: if second argument exists, final function argument must exist");
            } else if (typeof (aliases) !== "object") {
                throw new Error("namespace: second argument must be an object of aliased local namespaces");
            }
        } else if (typeof (aliases) !== "object" && typeof (func) === "function") {
            throw new Error("namespace: second argument must be an object of aliased local namespaces");
        }

        //parse namespace string
        nsArray = ns.split(".");

        //set the root namespace to window (if it's not explictly stated)
        if (nsArray[0] === "window") {
            currentNS = window;
        } else {
            currentNS = (window[nsArray[0]] === undefined) ? window[nsArray[0]] = {} : window[nsArray[0]];
        }

        //confirm func is actually a function
        if (func !== undefined && typeof (func) !== "function") {
            throw new Error("namespace: last parameter must be a function that accepts a namespace parameter");
        }

        //build namespace
        for (i = 1; i < nsArray.length; i = i + 1) {
            if (currentNS[nsArray[i]] === undefined) {
                currentNS[nsArray[i]] = {};
            }
            currentNS = currentNS[nsArray[i]];
        }

        //namespaces.push(currentNS);
        //namespace = currentNS;

        //if the function was defined, but no aliases run it on the current namespace
        if (aliases === undefined && func) {
            func(currentNS);
        } else if (func) {
            for (i in aliases) {
                if (aliases.hasOwnProperty(i)) {
                    aliases[i] = namespace(aliases[i]);
                }
            }
            func.call(aliases, currentNS);
        }

        //return namespace
        return currentNS;
    };

    return namespace(ns, function (exports) {
        exports.namespace = namespace;
    });
}("window.jermaine.util"));
window.jermaine.util.namespace("window.jermaine.util", function (ns) {
    "use strict";
    var EventEmitter = function () {
        var that = this,
            listeners = {};

        //an registers event and a listener
        this.on = function (event, listener) {
            if (typeof(event) !== "string") {
                throw new Error("EventEmitter: first argument to 'on' should be a string");
            }
            if (typeof(listener) !== "function") {
                throw new Error("EventEmitter: second argument to 'on' should be a function");
            }
            if (!listeners[event]) {
                listeners[event] = [];
            }
            listeners[event].push(listener);
            return that;
        };

        //alias addListener
        this.addListener = this.on;
    
        this.once = function (event, listener) {
            var f = function () {
                listener(arguments);
                that.removeListener(event, f);
            };

            that.on(event, f);
            return that;
        };

        this.removeListener = function (event, listener) {
            var index;

            if (typeof(event) !== "string") {
                throw new Error("EventEmitter: first parameter to removeListener method must be a string representing an event");
            }
            if (typeof(listener) !== "function") {
                throw new Error("EventEmitter: second parameter must be a function to remove as an event listener");
            }
            if (listeners[event] === undefined || listeners[event].length === 0) {
                throw new Error("EventEmitter: there are no listeners registered for the '" + event + "' event");
            }

            index = listeners[event].indexOf(listener);

            if (index !== -1) {
                //remove it from the list
                listeners[event].splice(index,1);
            }

            return that;
        };

        this.removeAllListeners = function (event) {
            if (typeof(event) !== "string") {
                throw new Error("EventEmitter: parameter to removeAllListeners should be a string representing an event");
            }

            if (listeners[event] !== undefined) {
                listeners[event] = [];
            }
            
            return that;
        };
    
        this.setMaxListeners = function (number) {
            return that;
        };

        //get the listeners for an event
        this.listeners = function (event) {
            if (typeof(event) !== 'string') {
                throw new Error("EventEmitter: listeners method must be called with the name of an event");
            } else if (listeners[event] === undefined) {
                return [];
            }
            return listeners[event];
        };

        //execute each of the listeners in order with the specified arguments
        this.emit = function (event, data) {
            var i,
                params;


            if (arguments.length > 1) {
                params = [];
            }

            for (i = 1; i < arguments.length; ++i) {
                params.push(arguments[i]);
            }

            if (listeners[event] !== undefined) {
                for (i = 0; i < listeners[event].length; i=i+1) {
                    listeners[event][i].apply(this, params);
                }
            }
        };

        return that;
    }; //end EventEmitter

    ns.EventEmitter = EventEmitter;
});
window.jermaine.util.namespace("window.jermaine", function (ns) {
    "use strict";
    var that = this,
        Validator,
        validators = {};

    Validator = function (spec) {
        var validatorFunction = function (arg) {
            var result, 
                resultObject = {},
                errorMessage;
            result = spec.call(resultObject, arg);
            if (!result) {
                errorMessage = resultObject.message || "validator failed with parameter " + arg;
                throw new Error(errorMessage);
            }
            return result;
        };
        return validatorFunction;
    };

    Validator.addValidator = function (name, v) {
        if (name === undefined || typeof(name) !== "string") {
            throw new Error("addValidator requires a name to be specified as the first parameter");
        }

        if (v === undefined || typeof(v) !== "function") {
            throw new Error("addValidator requires a function as the second parameter");
        }

        if (validators[name] === undefined) {
            validators[name] = function (expected) {
                return new Validator(function (val) {
                    var resultObject = {"actual":val, "param":val},
                        result = v.call(resultObject, expected);
                    this.message = resultObject.message;
                    return result;
                });
            };
        } else {
            throw new Error("Validator '" + name +"' already defined");
        }
    };

    Validator.getValidator = function (name) {
        var result;

        if (name === undefined) {
            throw new Error("Validator: getValidator method requires a string parameter");
        } else if (typeof (name) !== "string") {
            throw new Error("Validator: parameter to getValidator method must be a string");
        }

        result = validators[name];

        if (result === undefined) {
            throw new Error("Validator: '" + name + "' does not exist");
        }

        return result;
    };


    Validator.validators = function () {
        var prop,
            result = [];
        for (prop in validators) {
            if (validators.hasOwnProperty(prop)) {
                result.push(prop);
            }
        }

        return result;
    };

    Validator.addValidator("isGreaterThan", function (val) {
        this.message = this.param + " should be greater than " + val;
        return this.param > val;
    });

    Validator.addValidator("isLessThan", function (val) {
        this.message = this.param + " should be less than " + val;
        return this.param < val;
    });

    Validator.addValidator("isA", function (val) {
        var types = ["string", "number", "boolean", "function", "object"];
        if (typeof(val) === "string" && types.indexOf(val) > -1) {
            this.message = this.param + " should be a " + val;
            return typeof(this.param) === val;
        } else if (val === 'integer') {
            // special case for 'integer'; since javascript has no integer type,
            // just check for number type and check that it's numerically an int
            if (this.param.toString !== undefined)  {
                this.message = this.param.toString() + " should be an integer";
            } else {
                this.message = "parameter should be an integer";
            }
            return (typeof(this.param) === 'number') && (parseInt(this.param,10) === this.param);
        } else if (typeof(val) === "string") {
            throw new Error("Validator: isA accepts a string which is one of " + types);
        } else {
            throw new Error("Validator: isA only accepts a string for a primitive types for the time being");
        }
    });

    validators.isAn = validators.isA;

    Validator.addValidator("isOneOf", function (val) {
        this.message = this.param + " should be one of the set: " + val;
        return val.indexOf(this.param) > -1;
    });

    ns.Validator = Validator;
});
/*
  + what about isNotGreaterThan()?, isNotLessThan()?  Or, better still: a general 'not' operator, as in jasmine?
*/

window.jermaine.util.namespace("window.jermaine", function (ns) {
    "use strict";

    var staticValidators = {};

    var Attr = function (name) {
        var validators = [],
            that = this,
            errorMessage = "invalid setter call for " + name,
            defaultValueOrFunction,
            getDefaultValue,
            i,
            prop,
            addValidator,
            immutable = false,
            validator,
            delegate,
            listeners = {},
            AttrList = window.jermaine.AttrList,
            Validator = window.jermaine.Validator,
            EventEmitter = window.jermaine.util.EventEmitter;


        listeners.set = function () {};
        listeners.get = function () {};


        /* This is the validator that combines all the specified validators */
        validator = function (thingBeingValidated) {
            for (i = 0; i < validators.length; ++i) {
                validators[i](thingBeingValidated);
            }
            return true;
        };

        getDefaultValue = function() {
            return (typeof(defaultValueOrFunction) === 'function') ? defaultValueOrFunction() : defaultValueOrFunction;
        };

        if (name === undefined || typeof(name) !== 'string') {
            throw new Error("Attr: constructor requires a name parameter which must be a string");
        }

        this.validatesWith = function (v) {
            if (typeof(v) === 'function') {
                validators.push(new Validator(v));
                return this;
            } else {
                throw new Error("Attr: validator must be a function");
            }
        };

        this.defaultsTo = function (value) {
            defaultValueOrFunction = value;
            return this;
        };

        this.isImmutable = function () {
            immutable = true;
            return this;
        };

        this.isMutable = function () {
            immutable = false;
            return this;
        };

        this.name = function () {
            return name;
        };

        this.clone = function () {
            var result = (this instanceof AttrList)?new AttrList(name):new Attr(name),
                i;

            for (i = 0; i < validators.length; ++i) {
                result.validatesWith(validators[i]);
            }

            result.defaultsTo(defaultValueOrFunction);
            if (immutable) {
                result.isImmutable();
            }

            return result;
        };

        //syntactic sugar
        this.and = this;
        this.which = this;

        this.validator = function () {
            return validator;
        };


        this.on = function (event, listener) {
            if (event !== "set" && event !== "get") {
                throw new Error("Attr: first argument to the 'on' method should be 'set' or 'get'");
            } else if (typeof(listener) !== "function") {
                throw new Error("Attr: second argument to the 'on' method should be a function");
            } else {
                listeners[event] = listener;
            }
        };

        this.addTo = function (obj) {
            var attribute,
                listener,
                defaultValue;

            if (!obj || typeof(obj) !== 'object') {
                throw new Error("Attr: addAttr method requires an object parameter");
            }

            /*defaultValue = getDefaultValue();

            if (defaultValue !== undefined && validator(defaultValue)) {
                attribute = defaultValue;
            } else if (defaultValue !== undefined && !validator(defaultValue)) {
                throw new Error("Attr: Default value of " + defaultValue + " does not pass validation for " + name);
            }*/

            obj[name] = function (newValue) {
                var preValue;

                if (newValue !== undefined) {
                    //setter
                    if (immutable && attribute !== undefined) {
                        throw new Error("cannot set the immutable property " + name + " after it has been set");
                    } else
                    if (!validator(newValue)) {
                        throw new Error(errorMessage);
                    } else {
                        //get the oldValue
                        preValue = attribute;

                        //first set the value
                        attribute = newValue;

                        //call the set listener
                        listeners.set.call(obj, newValue, preValue);
                    }
                    return obj;
                } else {
                    listeners.get.call(obj, attribute);
                    return attribute;
                }
            };

            defaultValue = getDefaultValue();

            if (defaultValue !== undefined && validator(defaultValue)) {
                obj[name](defaultValue);
            } else if (defaultValue !== undefined && !validator(defaultValue)) {
                throw new Error("Attr: Default value of " + defaultValue + " does not pass validation for " + name);
            }

        };

        //add a single validator object to the attribute
        addValidator = function (name) {
            that[name] = function (param) {
                validators.push(Validator.getValidator(name)(param));
                return that;
            };
        };

        //add the validators to the attribute
        for (i = 0; i < Validator.validators().length; ++i) {
            addValidator(Validator.validators()[i]);
        }
    };

    ns.Attr = Attr;
});
window.jermaine.util.namespace("window.jermaine", function (ns) {
    "use strict";

    function AttrList(name) {
        var that = this,
            Collection = ns.util.Collection;

        //this is where the inheritance happens now
        ns.Attr.call(this, name);

        //syntactic sugar to keep things grammatically correct
        this.validateWith = this.validatesWith;

        //disable defaultsTo and isImmutable until we figure out how to make it make sense
        this.defaultsTo = function () {
            //no op
        };

        this.isImmutable = function () {
            //no op
        };

        this.isMutable = function () {
            //no op
        };

        this.eachOfWhich = this;

        this.addTo = function (obj) {
            if(!obj || typeof(obj) !== 'object') {
                throw new Error("AttrList: addTo method requires an object parameter");                
            } else {
                var list = new Collection(that);
                obj[name] = function () {
                    return list.actualList;
                };
            }
        };
    }

    //this needs to stay if we're going to use instanceof
    //but note we override all of the methods via delegation
    //so it's not doing anything except for making an AttrList
    //an instance of Attr
    AttrList.prototype = new window.jermaine.Attr(name);

    ns.AttrList = AttrList;
});
window.jermaine.util.namespace("window.jermaine", function (ns) {
    "use strict";

    var Method = function (name, method) {
        if (!name || typeof(name) !== "string") { 
            throw new Error("Method: constructor requires a name parameter which must be a string");
        } else if (!method || typeof(method) !== "function") {
            throw new Error("Method: second parameter must be a function");
        }
        
        this.addTo = function (obj) {
            if (!obj || typeof(obj) !== 'object') {
                throw new Error("Method: addTo method requires an object parameter");
            }
            
            obj[name] = method;
        };
    };
    ns.Method = Method;
});
window.jermaine.util.namespace("window.jermaine", function (ns) {
    "use strict";
    function Model(specification) {
        var that = this,
            methods = {},
            attributes = {},
            pattern,
            getObserver,
            setObserver,
            modified = true,
            requiredConstructorArgs = [],
            optionalConstructorArgs = [],
            parents = [],
            Method = ns.Method,
            Attr = ns.Attr,
            AttrList = ns.AttrList,
            EventEmitter = ns.util.EventEmitter,
            property,
            listProperties,
            create,
            isImmutable,
            initializer = function () {},
            constructor = function () {},
            model = function () {
                if (modified) {
                    create();
                }
                return constructor.apply(this, arguments);
            };


        //make instances of models instances of eventemitters
        //model.prototype = new EventEmitter();

        //temporary fix so API stays the same
        if (arguments.length > 1) {
            specification = arguments[arguments.length-1];
        }

        //handle specification function
        if (specification && typeof(specification) === "function") {
            model = new Model();
            specification.call(model);
            return model;
        } else if (specification) {
            throw new Error("Model: specification parameter must be a function");
        }

        /********** BEGIN PRIVATE METHODS ****************/
        /* private method that abstracts hasA/hasMany */
        var hasAProperty = function (type, name) {
            var Property,
                methodName,
                attribute;

            //Property is one of Attr or AttrList
            Property = type==="Attr"?Attr:AttrList;

            //methodName is either hasA or hasMany
            methodName = type==="Attr"?"hasA":"hasMany";

            modified = true;
            
            if (typeof(name) === 'string') {
                attribute = new Property(name);
                attributes[name] = attribute;
                return attribute;
            } else {
                throw new Error("Model: " + methodName + " parameter must be a string");
            }
        };

        /* private method that abstracts attribute/method */
        property = function (type, name) {
            var result;

            if (typeof(name) !== "string") {
                throw new Error("Model: expected string argument to " + type + " method, but recieved " + name);
            }

            result = type==="attribute" ? attributes[name] : methods[name];

            if (result === undefined) {
                throw new Error("Model: " + type + " " + name  + " does not exist!");
            }

            return result;
        };

        /* private method that abstracts attributes/methods */
        listProperties = function (type) {
            var i,
            list = [],
            properties = type==="attributes"?attributes:methods;

            for (i in properties) {
                if (properties.hasOwnProperty(i)) {
                    list.push(i);
                }
            }

            return list;
        };

        /* private function that creates the constructor */
        create = function (name) {
            var that = this,
                i, j,
                err;

            //validate the model first
            model.validate();

            constructor = function () {
                var that = this,
                    i,
                    attribute,
                    emitter,
                    addProperties;

                if (!(this instanceof model)) {
                    throw new Error("Model: instances must be created using the new operator");
                }

                //utility function that adds methods and attributes
                addProperties = function (obj, type) {
                    var properties = type==="attributes" ? attributes : methods,
                    i;
                    for (i in properties) {
                        if (properties.hasOwnProperty(i)) {
                            //if the object is immutable, all attributes should be immutable
                            if(properties === attributes && isImmutable) {
                                properties[i].isImmutable();
                            }
                            properties[i].addTo(obj);
                        }
                    }
                };

                emitter = new EventEmitter();

                this.emitter = function () {
                    return emitter;
                };

                //expose the the on method
                this.on = function (event, listener) {
                    that.emitter().on(event, function (data) {
                        listener.call(that, data);
                    });
                };
                //this.on = this.emitter().on;

                var attr,
                    attrChangeListeners = {},
                    setHandler,
                    lastListener;

                setHandler = function (attr) {
                    //when set handler is called, this should be the current object
                    attr.on("set", function (newValue, preValue) {
                        var that = this;

                        if (attrChangeListeners[attr.name()] === undefined) {
                            attrChangeListeners[attr.name()] = function (data) {
                                var newData = [],
                                    emit = true;

                                for (i = 0; i < data.length && emit === true; ++i) {
                                    newData.push(data[i]);
                                    if (data[i].origin === this) {
                                        emit = false;
                                    }
                                }

                                if (emit) {
                                    //maybe we should manipulate the data directly? copy it and emit a new data object?
                                    newData.push({key:attr.name(), origin:this});
                                    this.emitter().emit("change", newData);
                                }
                            };
                        }
                        
                        //get current attribute
                        if (newValue !== null && typeof(newValue) === "object" && newValue.on !== undefined && newValue.emitter !== undefined) {
                            if (preValue !== undefined && preValue !== null)  {
                                preValue.emitter().removeListener("change", lastListener);
                            }
                            lastListener = function (data) {
                                attrChangeListeners[attr.name()].call(that, data);
                            };
                            newValue.emitter().on("change", lastListener);
                        }
                        that.emitter().emit("change", [{key:attr.name(), value:newValue, origin:that}]);
                    });
                };

                //set up event handling for sub objects
                for (i = 0; i < listProperties("attributes").length; ++i) {
                    attr = attributes[listProperties("attributes")[i]];

                    if (attr instanceof Attr) {
                        setHandler.call(this, attr);
                    }
                }

                this.toJSON = function (JSONreps) {
                    var attributeList = model.attributes(),
                        attributeValue,
                        i, j,
                        thisJSONrep = {},
                        attributeJSONrep;

                    if (JSONreps === undefined) {
                        /* first call */
                        JSONreps = [];
                        JSONreps.push({object:this, JSONrep:thisJSONrep});
                    } else if (typeof(JSONreps) !== "object") {
                        /* error condition */
                        throw new Error("Instance: toJSON should not take a parameter (unless called recursively)");
                    } else {
                        /* find the current JSON representation of this object, if it exists */
                        for (i = 0; i < JSONreps.length; ++i) {
                            if (JSONreps[i].object === this) {
                                thisJSONrep = JSONreps[i].JSONrep;
                            }
                        }
                    }

                    for (i = 0; i < attributeList.length; ++i) {
                        attributeJSONrep = null;
                        /* get the attribute */
                        attributeValue = this[attributeList[i]]();
                        
                        /* find the current JSON representation for the attribute, if it exists */
                        for (j = 0; j < JSONreps.length; ++j) {
                            if (JSONreps[j].object === attributeValue) {
                                attributeJSONrep = JSONreps[j].JSONrep;
                            }
                        }

                        if (attributeValue !== undefined && attributeValue.toJSON !== undefined && attributeJSONrep === null) {
                            /* create a new entry for the attribute */
                            attributeJSONrep = (attributes[attributeList[i]] instanceof AttrList)?[]:{};
                            JSONreps.push({object:attributeValue, JSONrep:attributeJSONrep});
                            JSONreps[JSONreps.length-1].JSONrep = attributeValue.toJSON(JSONreps);

                            /* this works */
                            /*attributeJSONrep = {object:attributeValue, JSONrep:attributeJSONrep};
                            JSONreps.push({object:attributeValue, JSONrep:attributeJSONrep});
                            attributeJSONrep.JSONrep = attributeValue.toJSON(JSONreps);
                            attributeJSONrep = attributeJSONrep.JSONrep;*/
                        }

                        /* fill out the JSON representation for this object */
                        if(attributeJSONrep === null) {
                            thisJSONrep[attributeList[i]] = attributeValue;
                        } else {
                            //console.log("adding " + attributeList[i] + " json rep for " + thisJSONrep.name);
                            //console.log(attributeJSONrep);
                            thisJSONrep[attributeList[i]] = attributeJSONrep;
                        }
                    }
                    return thisJSONrep;
                    
                };

                //add attributes
                addProperties(this, "attributes");
                addProperties(this, "methods");

                if (pattern !== undefined) {
                    this.toString = pattern;
                }

                //use constructor args to build object
                if(arguments.length > 0) {
                    if (arguments.length < requiredConstructorArgs.length) {
                        //construct and throw error
                        err = "Constructor requires ";
                        for(i = 0; i < requiredConstructorArgs.length; ++i) {
                            err += requiredConstructorArgs[i];
                            err += i===requiredConstructorArgs.length-1?"":", ";
                        }
                        err += " to be specified";
                        throw new Error(err);
                    } else {
                        for (i = 0; i < arguments.length; ++i) {
                            attribute = i < requiredConstructorArgs.length?
                                requiredConstructorArgs[i]:
                                optionalConstructorArgs[i-requiredConstructorArgs.length];


                            if (model.attribute(attribute) instanceof AttrList) {
                                //make sure that arguments[i] is an array
                                if (Object.prototype.toString.call(arguments[i]) !== "[object Array]") {
                                    throw new Error("Model: Constructor requires 'names' attribute to be set with an Array");
                                } else {
                                    //iterate over the array adding the elements
                                    for (j = 0; j < arguments[i].length; ++j) {
                                        this[attribute]().add(arguments[i][j]);
                                    }
                                }
                            } else {
                                //go ahead and set it like normal
                                this[attribute](arguments[i]);
                            }
                        }
                    }
                }
                initializer.call(this);
            };
            return constructor;
        };
        /*********** END PRIVATE METHODS **************/


        /*********** BEGIN PUBLIC API *****************/
        model.hasA = function (attr) {
            return hasAProperty("Attr", attr);
        };
        
        model.hasAn = model.hasA;
        model.hasSome = model.hasA;
        
        model.hasMany = function (attrs) {
            return hasAProperty("AttrList", attrs);
        };

        model.isA = function (parent) {
            var i,
                parentAttributes,
                parentMethods,
                isAModel;

            modified = true;

            //checks to make sure a potentialModel has all attributes of a model
            isAModel = function (potentialModel) {
                var i,
                    M = new Model();
                for (i in M) {
                    if (M.hasOwnProperty(i) && typeof(potentialModel[i]) !== typeof(M[i])) {
                        return false;
                    }
                }
                return true;
            };

            //confirm parent is a model via duck-typing
            if (typeof (parent) !== "function" || !isAModel(parent)) {
                throw new Error("Model: parameter sent to isA function must be a Model");
            }

            //only allow single inheritance for now
            if (parents.length === 0) {
                parents.push(parent);
            } else {
                throw new Error("Model: Model only supports single inheritance at this time");
            }

            //add attributes and methods to current model
            parentAttributes = parents[0].attributes();
            for (i = 0; i < parentAttributes.length; ++i) {
                if (attributes[parentAttributes[i]] === undefined) {
                    attributes[parentAttributes[i]] = parents[0].attribute(parentAttributes[i]).clone();
                    //subclass attributes are mutable by default
                    attributes[parentAttributes[i]].isMutable();
                }
            }

            parentMethods = parents[0].methods();
            for (i = 0; i < parentMethods.length; ++i) {
                if (methods[parentMethods[i]] === undefined) {
                    methods[parentMethods[i]] = parents[0].method(parentMethods[i]);
                }
            }            

            for (i = 0; i < parents.length; i++) {
                model.prototype = new parents[i]();
            }
        };

        model.isAn = model.isA;

        model.parent = function () {
            return parents[0].apply(this, arguments);
        };

        model.attribute = function (attr) {
            return property("attribute", attr);
        };

        model.attributes = function () {
            return listProperties("attributes");
        };

        model.method = function (m) {
            return property("method", m);
        };
        
        model.methods = function () {
            return listProperties("methods");
        };

        model.isBuiltWith = function () {
            var optionalParamFlag = false,
            i;

            modified = true;
            requiredConstructorArgs = [];
            optionalConstructorArgs = [];

            for (i = 0; i < arguments.length; ++i) {
                if (typeof(arguments[i]) === "string" && arguments[i].charAt(0) !== '%') {
                    //in required parms
                    if (optionalParamFlag) {
                        //throw error
                        throw new Error("Model: isBuiltWith requires parameters preceded with a % to be the final parameters before the optional function");
                    } else {
                        //insert into required array
                        requiredConstructorArgs.push(arguments[i]);
                    }
                } else if(typeof(arguments[i]) === "string" && arguments[i].charAt(0) === '%') {
                    //in optional parms
                    optionalParamFlag = true;
                    //insert into optional array
                    optionalConstructorArgs.push(arguments[i].slice(1));
                } else if(typeof(arguments[i]) === "function" && i === arguments.length - 1) {
                    //init function
                    initializer = arguments[i];
                } else {
                    throw new Error("Model: isBuiltWith parameters must be strings except for a function as the optional final parameter");
                }
            }
        };
        
        model.isImmutable = function () {
            isImmutable = true;
        };

        model.looksLike = function (p) {
            modified = true;
            pattern = p;
        };

        model.respondsTo = function (methodName, methodBody) {
            var m = new Method(methodName, methodBody);
            modified = true;
            methods[methodName] = m;
        };
        
        model.validate = function () {
            var i,
            attributes = this.attributes(),
            methods = this.methods();

            //check to make sure that isBuiltWith has actual attributes
            for (i = 0; i < requiredConstructorArgs.length; ++i) {
                try {
                    this.attribute(requiredConstructorArgs[i]);
                } catch (e) {
                    throw new Error(requiredConstructorArgs[i] + ", specified in the isBuiltWith method, is not an attribute");
                }
            }

            for (i = 0; i < optionalConstructorArgs.length; ++i) {
                try {
                    this.attribute(optionalConstructorArgs[i]);
                } catch (e) {
                    throw new Error(optionalConstructorArgs[i] + ", specified in the isBuiltWith method, is not an attribute");
                }
            }

            //check for method/attribute collisions
            for (i = 0; i < attributes.length; i++) {
                if (methods.indexOf(attributes[i]) > -1) {
                    throw new Error("Model: invalid model specification to " + attributes[i] + " being both an attribute and method");
                }
            }

            //check to make sure that all attributes are requiredConstructorArgs if the object is immutable
            if (isImmutable) {
                for (i = 0; i < attributes.length; i++) {
                    if (requiredConstructorArgs.indexOf(attributes[i]) < 0) {
                        throw new Error("immutable objects must have all attributes required in a call to isBuiltWith");
                    }
                }
            }

            //set modifiedSinceLastValidation to false
            modified = false;
        };
        /************** END PUBLIC API ****************/


        
        //here we are returning our model object
        //which is a function with a bunch of methods that
        //manipulate how the function behaves
        return model;
    }

    ns.Model = Model;
});
window.jermaine.util.namespace("window.jermaine.util", function (ns) {
    "use strict";

    var Collection = function(attrlist) {
        var that = this;
        this.arr = [];
        this.actualList = {};

        this.delegate = function (obj, func) {
            return function () { return obj[func].apply(obj, arguments); };
        };

        this.actualList.add = function (obj) {
            if ((attrlist.validator())(obj)) {
                that.arr.push(obj);
                return this;         
            } else {
                throw new Error(that.errorMessage());
            }
        };

        this.actualList.pop = this.delegate(this.arr, "pop");

        this.actualList.size = function () {
            return that.arr.length;
        };

        this.actualList.contains = function(obj) {
            for(var i in that.arr) {
                if(obj === that.arr[i]) {
                    return true;
                }
            }
            return false;
        };
        
        this.actualList.replace = function (index, obj) {
            if ((typeof(index) !== 'number') || (parseInt(index, 10) !== index)) {
                throw new Error("AttrList: replace method requires index parameter to be an integer");
            }

            if (index < 0 || index >= this.size()) {
                throw new Error("AttrList: replace method index parameter out of bounds");
            }

            if (!(attrlist.validator())(obj)) {
                throw new Error(that.errorMessage());
            }

            that.arr[index] = obj;
            return this;
        };
        
        this.actualList.at = function (index) {
            if (index < 0 || index >= this.size()) {
                throw new Error("AttrList: Index out of bounds");
            }
            return that.arr[index];
        };

        //to keep things more java-y
        this.actualList.get = this.actualList.at;
        
        this.actualList.toJSON = function (JSONreps) {
            var result = [], 
            i, j;

            //check to make sure the current list is not in JSONreps
            for (i = 0;i < JSONreps.length; ++i) {
                if (JSONreps[i].object === this) {
                    result = JSONreps[i].JSONrep;
                }
            }
            
            for (i = 0; i < that.arr.length; ++i) {
                if (that.arr[i].toJSON) {
                    result.push(that.arr[i].toJSON(JSONreps));
                } else {
                    result.push(that.arr[i]);
                }
            }
            return result;
        };

    };

    ns.Collection = Collection;
});
