import overpy
from geopy.geocoders import Nominatim
import geojson


def download_street_data(street_name, city):
    # Finde Koordinaten der Straße
    geolocator = Nominatim(user_agent="street_downloader")
    location = geolocator.geocode(street_name + ", " + city)
    if not location:
        print("Die Adresse wurde nicht gefunden.")
        return

    # Verbindung zu OpenStreetMap API herstellen
    api = overpy.Overpass()

    # Erstelle eine Abfrage für die Straße
    query = f"""
    way["name"="{street_name}"](around:5000,{location.latitude},{location.longitude});
    (._;>;);
    out;
    """

    # Daten herunterladen
    result = api.query(query)
    return result


def create_geojson(result):
    features = []
    for way in result.ways:
        # Erstelle GeoJSON-Feature für jede Straße
        coordinates = [(float(node.lon), float(node.lat)) for node in way.nodes]
        feature = geojson.Feature(geometry=geojson.LineString(coordinates),
                                  properties={"name": way.tags.get("name", "N/A"), "id": way.id})
        features.append(feature)
    # Erstelle GeoJSON-Feature-Sammlung
    feature_collection = geojson.FeatureCollection(features)
    return feature_collection


if __name__ == "__main__":
    # Benutzereingabe für Stadt und Straße
    city = input("Bitte gib den Namen der Stadt ein: ")
    street_name = input("Bitte gib den Namen der Straße ein: ")

    result = download_street_data(street_name, city)

    # Erstelle GeoJSON-Feature-Sammlung
    feature_collection = create_geojson(result)

    # Speichere GeoJSON-Datei
    with open("mittelhafen.geojson", "w") as f:
        geojson.dump(feature_collection, f)

    print("GeoJSON-Datei erfolgreich erstellt: martinistrasse.geojson")
