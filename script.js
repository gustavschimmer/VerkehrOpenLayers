// Vektorquelle erstellen
var vectorSource = new ol.source.Vector({
    url: 'masterBoundary.geojson',
    format: new ol.format.GeoJSON()
});

// JavaScript-Code, um das Wasserzeichen dynamisch zu aktualisieren
var watermark = document.getElementById('watermark');

// Zuordnungstabelle für Anzeigetexte und URLs der Hintergrundkarten
var basemapURLs = {
    'Dark map': 'basemaps.cartocdn.com/dark_all',
    'Light map': 'basemaps.cartocdn.com/light_all',
    'OpenStreetMap': 'tile.openstreetmap.org'
    // Weitere Hintergrundkarten hier hinzufügen
};

// Eventlistener für Änderungen im Dropdown-Menü für die Hintergrundkarten hinzufügen
document.getElementById('basemap-select').addEventListener('change', function() {
    // Wert der ausgewählten Hintergrundkarte abrufen
    var selectedBasemap = this.options[this.selectedIndex].text;
    
    // Wasserzeichen entsprechend aktualisieren, falls der Anzeigetext in der Zuordnungstabelle existiert
    if (selectedBasemap in basemapURLs) {
        watermark.innerHTML = 'Drawn by: Gustav Schimmer<br>Background map: ' + basemapURLs[selectedBasemap];
    } else {
        watermark.innerHTML = 'Drawn by: Gustav Schimmer<br>Background map: ' + selectedBasemap;
    }
});




// Vektorlayer für die GeoJSON-Datei
var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: function(feature, resolution) {
        var area = 0; // Fläche des Polygons
        var geometry = feature.getGeometry();
        
        // Fläche des Polygons berechnen
        if (geometry.getType() === 'MultiPolygon') {
            var polygons = geometry.getPolygons();
            polygons.forEach(function(polygon) {
                area += ol.sphere.getArea(polygon);
            });
        } else if (geometry.getType() === 'Polygon') {
            area = ol.sphere.getArea(geometry);
        }

        var strokeWidth = 2;

        // Z-Index basierend auf der Fläche festlegen
        var zIndex = area ? +area : 0; // Negativer Z-Index für größere Polygone

        // Hier wird der Status aus der GeoJSON-Datei gelesen
        var status = feature.get('Status');

        // Hier kannst du basierend auf dem Status die Style-Logik anpassen
        // Zum Beispiel könntest du verschiedene Farben für verschiedene Status verwenden
        var strokeColor;
        if (status === 'Currently Being Implemented') {
            strokeColor = '#f1eef6'; // Pink für "Currently Being Implemented"
        } else if (status === 'Planning') {
            strokeColor = '#d7b5d8'; // Pink für "Planning"
        } 
        else if (status === 'Implemented') {
            strokeColor = '#df65b0'; // Pink für "Planning"
        } else {
            strokeColor = '#dd1c77'; // Pink für andere Status
        }

        return new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(0, 0, 0, 0)' // Transparente Fläche
            }),
            stroke: new ol.style.Stroke({
                color: strokeColor, // Farbe für den Rand
                width: strokeWidth
            }),
            zIndex: zIndex // Z-Index basierend auf Fläche
        });
    }
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
        vectorLayer
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([9.075962, 52.8398531]), // Zentrierung auf Niedersachsen
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

// Eventlistener für Klick auf die Karte, um das Popup zu schließen
map.on('click', function (event) {
    var featureClicked = false;
    map.forEachFeatureAtPixel(event.pixel, function (feature) {
        featureClicked = true;
    });

    if (!featureClicked) {
        // Schließen des Popups
        popupOverlay.setPosition(undefined);
    }
});

// Eventlistener für Klick auf die Features im Vektorlayer hinzufügen
map.on('click', function (event) {
    map.forEachFeatureAtPixel(event.pixel, function (feature) {
        var name = feature.get('name').charAt(0).toUpperCase() + feature.get('name').slice(1).toLowerCase(); // Ersten Buchstaben groß, Rest klein
        var measures = feature.get('Measures');
        var status = feature.get('Status');

        var measuresArray = measures.split(', '); // Measures in ein Array aufteilen
        var statusArray = status.split(', '); // Status in ein Array aufteilen

        var content = '<ul>';
        content += '<strong>Name:</strong> ' + name + '</p>'; // Leerzeile nach dem Stadtname
        // Schleife durch alle Measures
        for (var i = 0; i < measuresArray.length; i++) {
            // Listenelement für jedes Measure-Status-Paar erstellen
            content += '<li><strong>Measure ' + (i + 1) + ':</strong> ' + measuresArray[i] + '</li>'; // Measures nummerieren
            content += '<li><strong>Status:</strong> ' + statusArray[i] + '</li>';
            // Falls es mehr als ein Measure gibt und es nicht das letzte Measure ist, füge eine Leerzeile hinzu
            if (i < measuresArray.length - 1) {
                content += '<p></p>'; // Leerzeile einfügen
            }
        }
        content += '</ul>';

        // Position des Popups relativ zur Mausposition einstellen
        popupOverlay.setPosition(event.coordinate);

        // Pfeil hinzufügen
        var arrow = document.createElement('div');
        arrow.classList.add('arrow');
        popupOverlay.getElement().appendChild(arrow);

        document.getElementById('popup-content').innerHTML = content;
        popupOverlay.getElement().style.display = 'block';
    });
});




// Eventlistener für Änderungen im Dropdown-Menü hinzufügen backgroundmap
document.getElementById('basemap-select').addEventListener('change', function() {
    // Wert des ausgewählten Elements abrufen
    var selectedBasemapUrl = this.value;
    
    // Basiskartenschicht aktualisieren
    map.getLayers().item(0).setSource(
        new ol.source.XYZ({
            url: selectedBasemapUrl
        })
    );
});

// Eventlistener für Änderungen im Dropdown-Menü für den Status
document.getElementById('status-select').addEventListener('change', function() {
    // Status des ausgewählten Elements im Dropdown-Menü erhalten
    var selectedStatus = this.value;

    // Den Vektorlayer dynamisch aktualisieren, um nur Polygone mit dem ausgewählten Status anzuzeigen
    vectorLayer.setStyle(function(feature, resolution) {
        // Hier wird der Status aus der GeoJSON-Datei gelesen
        var status = feature.get('Status');
        
        // "Show All" Option
        if (selectedStatus === 'all') {
            // Hier kannst du basierend auf dem Status die Style-Logik anpassen
            // Zum Beispiel könntest du verschiedene Farben für verschiedene Status verwenden
            var strokeColor;
            if (status === 'Currently Being Implemented') {
                strokeColor = '#f1eef6'; // Pink für "Currently Being Implemented"
            } else if (status === 'Planning') {
                strokeColor = '#d7b5d8'; // Pink für "Planning"
            } 
            else if (status === 'Implemented') {
                strokeColor = '#df65b0'; // Pink für "Planning"
            } else {
                strokeColor = '#dd1c77'; // Pink für andere Status
            }

            var area = 0; // Fläche des Polygons
            var geometry = feature.getGeometry();
            
            // Fläche des Polygons berechnen
            if (geometry.getType() === 'Polygon') {
                area = ol.sphere.getArea(geometry);
            }

            var strokeWidth = 2;

            // Z-Index basierend auf der Fläche festlegen
            var zIndex = area ? +area : 0; // Negativer Z-Index für größere Polygone

            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0)' // Transparente Fläche
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColor,
                    width: strokeWidth
                }),
                zIndex: zIndex // Z-Index basierend auf Fläche
            });
        }
        // Nur Polygone mit dem ausgewählten Status anzeigen
else if (status === selectedStatus) {
    var area = 0; // Fläche des Polygons
    var geometry = feature.getGeometry();
    
    // Fläche des Polygons berechnen
    if (geometry.getType() === 'Polygon') {
        area = ol.sphere.getArea(geometry);
    }

    var strokeWidth = 2;

    // Z-Index basierend auf der Fläche festlegen
    var zIndex = area ? -area : 0; // Negativer Z-Index für größere Polygone

    // Hier wird der Status aus der GeoJSON-Datei gelesen
    var strokeColor;
    if (status === 'Currently Being Implemented') {
        strokeColor = '#f1eef6'; // Pink für "Currently Being Implemented"
    } else if (status === 'Planning') {
        strokeColor = '#d7b5d8'; // Pink für "Planning"
    } else if (status === 'Implemented') {
        strokeColor = '#df65b0'; // Pink für "Implemented"
    } else {
        strokeColor = '#dd1c77'; // Pink für andere Status
    }

    return new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(0, 0, 0, 0)' 
        }),
        stroke: new ol.style.Stroke({
            color: strokeColor, // Farbe für den Rand
            width: strokeWidth
        }),
        zIndex: zIndex // Z-Index basierend auf Fläche
    });
} else {
    // Leerer Stil für Polygone mit anderen Status
    return null;
}

    });
});

// Eventlistener für Änderungen im Dropdown-Menü für die Measures
document.getElementById('measures-select').addEventListener('change', function() {
    // Measures des ausgewählten Elements im Dropdown-Menü erhalten
    var selectedMeasure = this.value;

    // Den Vektorlayer dynamisch aktualisieren, um nur Polygone mit der ausgewählten Measure anzuzeigen
    vectorLayer.setStyle(function(feature, resolution) {
        // Hier wird die Measures aus der GeoJSON-Datei gelesen
        var measures = feature.get('Measures');
        
        // "Show All" Option
        if (selectedMeasure === 'all') {
            // Hier kannst du basierend auf der Measures die Style-Logik anpassen
            // Zum Beispiel könntest du verschiedene Farben für verschiedene Measures verwenden
            var strokeColor;
            // Setze die Farben basierend auf der ausgewählten Measure
            switch (measures) {
                case 'Promoting Public Transit':
                    strokeColor = '#f1eef6'; // Pink für "Promoting Public Transit"
                    break;
                case 'Reducing CO2 Emissions':
                    strokeColor = '#d7b5d8'; // Pink für "Reducing CO2 Emissions"
                    break;
                case 'Promoting Pedestrian Traffic':
                    strokeColor = '#df65b0'; // Pink für "Promoting Pedestrian Traffic"
                    break;
                default:
                    strokeColor = '#dd1c77'; // Pink für andere Measures
            }

            var area = 0; // Fläche des Polygons
            var geometry = feature.getGeometry();
            
            // Fläche des Polygons berechnen
            if (geometry.getType() === 'Polygon') {
                area = ol.sphere.getArea(geometry);
            }

            var strokeWidth = 2;

            // Z-Index basierend auf der Fläche festlegen
            var zIndex = area ? +area : 0; // Negativer Z-Index für größere Polygone

            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0)' // Transparente Fläche
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColor,
                    width: strokeWidth
                }),
                zIndex: zIndex // Z-Index basierend auf Fläche
            });
        }
        // Nur Polygone mit der ausgewählten Measure anzeigen
        else if (measures === selectedMeasure) {
            var area = 0; // Fläche des Polygons
            var geometry = feature.getGeometry();
            
            // Fläche des Polygons berechnen
            if (geometry.getType() === 'Polygon') {
                area = ol.sphere.getArea(geometry);
            }

            var strokeWidth = 2;

            // Z-Index basierend auf der Fläche festlegen
            var zIndex = area ? -area : 0; // Negativer Z-Index für größere Polygone

            // Hier wird die Measures aus der GeoJSON-Datei gelesen
            var strokeColor;
            // Setze die Farben basierend auf der ausgewählten Measure
            switch (measures) {
                case 'Promoting Public Transit':
                    strokeColor = '#f1eef6'; // Pink für "Promoting Public Transit"
                    break;
                case 'Reducing CO2 Emissions':
                    strokeColor = '#d7b5d8'; // Pink für "Reducing CO2 Emissions"
                    break;
                case 'Promoting Pedestrian Traffic':
                    strokeColor = '#df65b0'; // Pink für "Promoting Pedestrian Traffic"
                    break;
                default:
                    strokeColor = '#dd1c77'; // Pink für andere Measures
            }

            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0)' 
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColor, // Farbe für den Rand
                    width: strokeWidth
                }),
                zIndex: zIndex // Z-Index basierend auf Fläche
            });
        } else {
            // Leerer Stil für Polygone mit anderen Measures
            return null;
        }
    });
});

