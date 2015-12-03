L.Draw.Popup = L.Control.extend({
    statics: {
        TYPE: 'popup'
    },

    options: {
        position: 'topleft',
        icon: new L.Icon.Default(),
        zIndexOffset: 2000 // This should be > than the highest z-index any markers
    },

    initialize: function (map, options) {
        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.Draw.Popup.TYPE;

        L.Draw.Feature.prototype.initialize.call(this, map, options);
    },

    onAdd: function (map) {
        this._map = map;

        var selectName = 'leaflet-ms-bar leaflet-control-drawpopup',
            barName = 'leaflet-bar',
            container = L.DomUtil.create('div', selectName + ' ' + barName);

        this._map = map;
        this._container = container;

        this._selectButton = this._createButton('<i class="fa fa-comment"/>', 'Add Notes',
                selectName + '-button',
                container, this._drawPopup, this);

        return container;
    },

    onRemove: function (map) {
        this._map.off('mousemove', this._onMouseMove, this);
        this._map = null;
    },

    _createButton: function (html, title, className, container, fn, context) {
        var link = L.DomUtil.create('a', className, container);
        link.innerHTML = html;
        link.href = '#';
        link.title = title;

        var stop = L.DomEvent.stopPropagation;

        L.DomEvent
            .on(link, 'click', stop)
            .on(link, 'mousedown', stop)
            .on(link, 'dblclick', stop)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn, context);

        return link;
    },

    _drawPopup: function () {
        this.addHooks();
    },

    _onMouseMove: function (e) {
        var latlng = e.latlng;

        // move point a little bit, so my mouse will be over popup not over selected item, which will stop propogation
        var point = this._map.latLngToContainerPoint(latlng); point.y += 3; point.x+=1;
        latlng = this._map.containerPointToLatLng(point);

        if (!this._popup) {
            this._popup = new L.Popup({ closeButton: true, autoPan: false }).setLatLng(latlng).setContent('Place me where you want.').on('click', this._onClick, this);
            this._map
                .on('click', this._onClick, this)
                .on('draw:drawstart', this.removeHooks, this)
                .addLayer(this._popup);
        }
        else {
            this._popup.setLatLng(latlng);
        }
    },

    _onClick: function () {
        this._fireCreatedEvent();
        this.removeHooks();
    },

    _fireCreatedEvent: function (ev) {

        // create popup and
        var popup = new L.Popup({ closeButton: true });
        popup.setLatLng(this._popup._latlng).setContent('...');

        // add to the map
        this._map.options.closePopupOnClick = false;
        this._map.addLayer(popup);
        this._map.options.closePopupOnClick = true;

        // added popups
        //L.Control.DrawSelect.Singleton.popups.push(popup);

        // get text and set
        var text = window.prompt('Write text to add', '');
        popup.setContent(text);
    },

    addHooks: function () {

        // if draw active, cancel it
	// commented out because it is using jquery right now to Cancel drawing, if we are in draw mode.
	// we don't need extra dependency	
        /*$(".leaflet-draw-actions a").filter(function () {
            return $(this).text() == 'Cancel';
        }).each(function (index, el) { el.click(); });*/

        // trigger draw controls event
        if (this._enabled) { return; }
        this._enabled = true;

        // map handler
        if (this._map) {
            this._map.on('mousemove', this._onMouseMove, this);
        };
    },

    removeHooks: function () {

        // trigger draw controls event
        if (!this._enabled) { return; }
        this._enabled = null;

        // map handler
        if (this._map) {
            this._map.off('mousemove', this._onMouseMove, this);
            this._map.off('click', this._onClick, this);
        }

        // remove popup reference
        this._map.removeLayer(this._popup);
        this._popup = null;
    }

});


L.Draw.Popup.Signleton = {

    // get from map popups and serialize them
    getSerialized: function () {
        // serialize
        var popups = _.map(L.Control.DrawSelect.Singleton.getPopups(), function (x) {
            return {
                latlng: x._latlng,
                text: x._contentNode.innerHTML
            };
        });
        return popups;
    },

    // adds to the map, serialized popups
    addSerialized: function (map, serialized) {

        // add to the map
        map.options.closePopupOnClick = false;

        _.each(serialized, function (x) {

            var popup = new L.Popup({ closeButton: true });
            popup.setLatLng(x.latlng).setContent(x.text);

            // save popup
            L.Control.DrawSelect.Singleton.popups.push(popup);

            map.addLayer(popup);
        });

        map.options.closePopupOnClick = true;
    },
    
    // remove all popups from the map, clear popups array
    clearResults: function () {

        // get popups
        var pps = L.Control.DrawSelect.Singleton.popups;

        // remove from the map
        for (var i = 0; i < pps.length; i++) {
            var p = pps[i];
            if (p._map) {
                p._map.removeLayer(p);
            }
        }

        // clear array
        L.Control.DrawSelect.Singleton.popups.length = 0;
    }
}