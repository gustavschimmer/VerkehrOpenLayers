import json
from shapely.geometry import shape, mapping
from shapely.ops import transform
from functools import partial
import pyproj

# Funktion zur Vereinfachung der Geometrie um den gegebenen Toleranzwert
def simplify_geometry(geom, tolerance):
    simplified_geom = geom.simplify(tolerance)
    return simplified_geom

# Dateipfade
input_file = '../masterBoundary.geojson'
output_file = '../masterBoundary.geojson'

# Toleranz für die Vereinfachung (10 Meter)
tolerance = 10

# Projektionen definieren (WGS84 und UTM Zone 33N)
wgs84 = pyproj.CRS('EPSG:4326')
utm_33n = pyproj.CRS('EPSG:32633')

# Transformer erstellen
transformer_to_utm = pyproj.Transformer.from_crs(wgs84, utm_33n, always_xy=True).transform
transformer_to_wgs84 = pyproj.Transformer.from_crs(utm_33n, wgs84, always_xy=True).transform

# GeoJSON einlesen
with open(input_file, 'r') as f:
    data = json.load(f)

# Geometrien nach UTM 33N konvertieren und vereinfachen
for feature in data['features']:
    geom = shape(feature['geometry'])
    projected_geom = transform(transformer_to_utm, geom)
    simplified_geom = simplify_geometry(projected_geom, tolerance)
    wgs84_geom = transform(transformer_to_wgs84, simplified_geom)
    feature['geometry'] = mapping(wgs84_geom)

# GeoJSON mit vereinfachten Geometrien speichern
with open(output_file, 'w') as f:
    json.dump(data, f)

print("Vereinfachte und zurücktransformierte GeoJSON-Datei erfolgreich erstellt:", output_file)
