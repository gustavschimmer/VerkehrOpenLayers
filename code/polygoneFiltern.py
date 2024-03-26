import json
from shapely.geometry import shape

def polygoneFiltern():
    # Einlesen der GeoJSON-Datei
    input_geojson = '../masterBoundary.geojson'
    with open(input_geojson, encoding='utf-8') as f:
        data = json.load(f)

    # Erstelle eine Liste von Tupeln (Polygon, Daten) für jedes Feature
    polygons_with_data = []
    for feature in data['features']:
        geom = shape(feature['geometry'])
        if geom.geom_type == 'MultiPolygon':
            largest_polygon = max(geom.geoms, key=lambda polygon: polygon.area)
        else:
            largest_polygon = geom
        polygons_with_data.append((largest_polygon, feature['properties']))

    # Sortiere die Polygone nach ihrer Fläche (größtes zuerst)
    sorted_polygons_with_data = sorted(polygons_with_data, key=lambda item: item[0].area, reverse=True)

    # Aktualisiere die GeoJSON-Features mit den sortierten Polygonen und Daten
    for i, (polygon, properties) in enumerate(sorted_polygons_with_data):
        data['features'][i]['geometry'] = polygon.__geo_interface__
        data['features'][i]['properties'] = properties

    # Speichern der aktualisierten GeoJSON-Datei
    with open(input_geojson, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

    # Speichern der GeoJSON-Datei als .js-Datei
    output_js = '../masterBoundary_1.js'
    with open(output_js, 'w', encoding='utf-8') as f:
        f.write(f"const masterBoundaryData = {json.dumps(data)};")

if __name__ == "__main__":
    polygoneFiltern()
