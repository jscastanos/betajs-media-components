Scoped.define("module:Common.Dynamics.Helperframe", [
    "dynamics:Dynamic",
    "base:Async",
    "base:Objs",
    "browser:Events"
], function(Class, Async, Objs, DomEvents, scoped) {
    return Class.extend({
            scoped: scoped
        }, function(inherited) {
            return {

                template: "<%= template(dirname + '/helperframe.html') %>",

                attrs: {
                    "css": "ba-videorecorder",
                    "framereversable": true,
                    "framedragable": true,
                    "frameresizeable": true,
                    "framewidth": 120,
                    "frameheight": 95,
                    "framepositionx": 5,
                    "framepositiony": 5,
                    "frameminwidth": 120,
                    "frameminheight": 95,
                    "framemainstyle": {
                        opacity: 0,
                        position: 'absolute',
                        cursor: 'pointer',
                        zIndex: 100
                    }
                },

                types: {
                    "framereversable": "boolean",
                    "framedragable": "boolean",
                    "frameresizeable": "boolean",
                    "framewidth": "int",
                    "frameheight": "int",
                    "framepositionx": "int",
                    "framepositiony": "int",
                    "frameminwidth": "int",
                    "frameminheight": "int"
                },

                computed: {},

                events: {
                    "change:framepositionx change:framepositiony change:framewidth change:frameheight": function(value) {
                        if (typeof this.recorder._recorder === 'object') {
                            this.recorder._recorder.updateMultiStreamPosition(
                                this.get("framepositionx"),
                                this.get("framepositiony"),
                                this.get("framewidth"),
                                this.get("frameheight")
                            );
                        }
                    }
                },

                create: function() {
                    var _frameClicksCount = 0;
                    var _interactionEvent, _isTouchDevice, _mouseDownEvent;

                    Objs.iter(this.get("framemainstyle"), function(value, index) {
                        this.activeElement().style[index] = value;
                    }, this);

                    // Create additional related elements after reverse element created
                    this.__setMultiStreamElementDimensions(this.activeElement());

                    _isTouchDevice = (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
                    _interactionEvent = _isTouchDevice ? 'touch' : 'click';

                    this._frameInteractionEventHandler = this.auto_destroy(new DomEvents());

                    this.recorder = this.parent().recorder;
                    this.player = this.parent().recorder;

                    if (this.recorder) {
                        // do recorder stuff
                        // If Reverse Cameras Settings is true
                        if (this.get("framereversable")) {
                            this._frameInteractionEventHandler.on(this.activeElement(), _interactionEvent, function(ev) {
                                _frameClicksCount++;
                                // because not enough info regarding supported versions also not be able to support mobile, avoided to use dblclick event
                                if (_frameClicksCount === 1)
                                    Async.eventually(function() {
                                        _frameClicksCount = 0;
                                    }, this, 200);

                                if (_frameClicksCount >= 2) {
                                    this.recorder.reverseCameraScreens();
                                }
                            }, this);
                        }
                    } else if (this.player) {
                        // do player stuff
                    }

                    // If Drag Settings is true
                    if (this.get("framedragable")) {
                        this.__addDragResizeOption(this.activeElement(), _isTouchDevice);
                    }

                    if (this.get("frameresizeable")) {
                        this.__addResizeElement(_isTouchDevice, null, {
                            width: '7px',
                            height: '7px',
                            borderRight: '2px solid white',
                            borderBottom: '2px solid white',
                            position: 'absolute',
                            right: '-9px',
                            bottom: '-9px',
                            cursor: 'nwse-resize'
                        });
                    }
                },

                functions: {},

                /**
                 * Will append DIV element which will affect as a button
                 * @param {Object} options
                 * @private
                 */
                appendMultiStreamHelperElement: function(options) {},

                /**
                 * Will add Drag
                 *
                 * @param {HTMLElement} draggedElement
                 * @param {Boolean} isTouchDevice
                 * @private
                 */
                __addDragResizeOption: function(draggedElement, isTouchDevice) {
                    var _pos1 = 0;
                    var _pos2 = 0;
                    var _pos3 = 0;
                    var _pos4 = 0;
                    var _self = this;
                    var _dragElement, _draggingEvent, _mouseMoveEvent, _mouseUpEvent, _mouseDownEvent, _isResizing;

                    _dragElement = draggedElement || this.activeElement();

                    this.__draggingEvent = this.auto_destroy(new DomEvents());

                    // switch to touch events if using a touch screen
                    _mouseDownEvent = isTouchDevice ? 'touchstart' : 'mousedown';

                    this.__draggingEvent.on(_dragElement, _mouseDownEvent, function(ev) {
                        ev.preventDefault();

                        _dragElement.style.cursor = 'move';

                        // get the mouse cursor position at startup:
                        _pos3 = ev.clientX;
                        _pos4 = ev.clientY;

                        if (isTouchDevice)
                            _dragElement.ontouchend = dragEndHandler;
                        else
                            _dragElement.onmouseup = dragEndHandler;

                        function dragEndHandler(ev) {
                            // stop moving when mouse button is released:
                            _dragElement.style.cursor = 'pointer';
                            _dragElement.onmouseup = null;
                            _dragElement.onmousemove = null;
                        }

                        // call a function whenever the cursor moves:
                        if (isTouchDevice)
                            _dragElement.ontouchmove = dragHandler;
                        else
                            _dragElement.onmousemove = dragHandler;

                        function dragHandler(mouseEv) {
                            mouseEv = mouseEv || window.event;
                            mouseEv.preventDefault();

                            // calculate the new cursor position:
                            _pos1 = _pos3 - mouseEv.clientX;
                            _pos2 = _pos4 - mouseEv.clientY;
                            _pos3 = mouseEv.clientX;
                            _pos4 = mouseEv.clientY;

                            // set the element's new position:
                            var _top = (_dragElement.offsetTop - _pos2);
                            var _left = (_dragElement.offsetLeft - _pos1);
                            _dragElement.style.top = _top + "px";
                            _dragElement.style.left = _left + "px";

                            _self.set("framepositionx", _left);
                            _self.set("framepositiony", _top);
                        }
                    }, this);
                },

                /**
                 *
                 *
                 * @param {Boolean} isTouchDevice
                 * @param {HTMLElement} parentElement
                 * @param {Object} options
                 * @private
                 */
                __addResizeElement: function(isTouchDevice, parentElement, options) {
                    parentElement = parentElement || this.activeElement();
                    var _minSize = 120;
                    var _self = this;
                    var _mouseDownEvent, _mouseUpEvent, _mouseMoveEvent;
                    this.__resizerElement = document.createElement('div');
                    var _resizeElement = this.__resizerElement;
                    Objs.iter(options, function(value, index) {
                        this.__resizerElement.style[index] = value;
                    }, this);

                    parentElement.append(this.__resizerElement);
                    this.__resizeEvent = this.auto_destroy(new DomEvents());

                    // switch to touch events if using a touch screen
                    _mouseDownEvent = isTouchDevice ? 'touchstart' : 'mousedown';
                    _mouseUpEvent = isTouchDevice ? 'touchend' : 'mouseup';
                    _mouseMoveEvent = isTouchDevice ? 'touchmove' : 'mousemove';

                    this.__resizeEvent.on(_resizeElement, _mouseDownEvent, function(e) {
                        e = e || window.event;
                        e.preventDefault();

                        var minimum_size = 120;
                        var original_width = this.get("framewidth");
                        var original_height = this.get("frameheight");

                        var original_mouse_x = e.pageX;
                        var original_mouse_y = e.pageY;

                        window.addEventListener(_mouseMoveEvent, resize);
                        window.addEventListener(_mouseUpEvent, stopResize);

                        //isTouchDevice ? _resizeElement.ontouchend : _resizeElement.onmouseup =
                        function stopResize(ev) {
                            // stop moving when mouse button is released:
                            // _resizeElement.onmouseup = null;
                            // _resizeElement.onmousemove = null;
                            window.removeEventListener('mousemove', resize);
                        }

                        //isTouchDevice ? _resizeElement.ontouchmove : _resizeElement.onmousemove =
                        function resize(mouseEv) {

                            var width = original_width + (mouseEv.pageX - original_mouse_x);
                            var height = original_height + (mouseEv.pageY - original_mouse_y);
                            if (width > _self.get("frameminwidth")) {
                                _self.activeElement().style.width = width + 'px';
                                _self.set("framewidth", width);
                            }
                            if (height > _self.get("frameheight")) {
                                _self.activeElement().style.height = height + 'px';
                                _self.set("frameheight", height);
                            }
                        }
                    }, this);
                },

                /**
                 * Helper method will set dimensions for multi-screen recorder related elements
                 *
                 * @param {HTMLElement} element
                 * @private
                 */
                __setMultiStreamElementDimensions: function(element) {
                    if (element) {
                        element.style.top = this.get("framepositionx") + 'px';
                        element.style.left = this.get("framepositiony") + 'px';
                        element.style.width = this.get("framewidth") + 'px';
                        element.style.height = this.get("frameheight") + 'px';
                    }
                }

            };
        })
        .registerFunctions({
            /*<%= template_function_cache(dirname + '/helperframe.html') %>*/
        })
        .register("ba-helperframe");
});