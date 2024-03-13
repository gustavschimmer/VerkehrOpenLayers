// Benutzerdefinierter Stil für die Polygone
var polygonStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(255, 0, 255, 1)', // Pink
        width: 2
    })
});

// OpenLayers-Karte initialisieren
var map = new ol.Map({
    target: 'map',
    layers: [
        // Basiskarte (Dark Matter von CartoDB)
        new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            })
        }),
        // Vektorlayer für die GeoJSON-Datei
        new ol.layer.Vector({
            source: new ol.source.Vector({
                url: 'masterBoundary.geojson',
                format: new ol.format.GeoJSON()
            }),
            style: polygonStyle
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([8.8, 51.7]),
        zoom: 7
    })
});

// Overlay für Popups erstellen
var popupOverlay = new ol.Overlay({
    element: document.getElementById('popup'),
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    }
});
map.addOverlay(popupOverlay);

// Eventlistener für Klick auf die Polygone hinzufügen
map.on('click', function (event) {
    map.forEachFeatureAtPixel(event.pixel, function (feature) {
        var attributes = feature.getProperties();
        var content = '<ul>';
        for (var key in attributes) {
            content += '<li><strong>' + key + ':</strong> ' + attributes[key] + '</li>';
        }
        content += '</ul>';
        popupOverlay.setPosition(event.coordinate);
        document.getElementById('popup-content').innerHTML = content;
        popupOverlay.getElement().style.display = 'block';
    });
});
