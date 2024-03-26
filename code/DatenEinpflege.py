import os
import osmnx as ox
import geopandas as gpd
import pandas as pd
import polygoneFiltern
import automatischenPushen
import test


def create_master_boundary_geojson(master_boundary_geojson_filepath):
    # Create an empty GeoDataFrame for the master file
    master_boundary_gdf = gpd.GeoDataFrame()

    # Check if the GeoDataFrame is empty
    if master_boundary_gdf.empty:
        print("The master GeoDataFrame is empty. No GeoJSON file will be created.")
        return

    # Save the GeoDataFrame as a GeoJSON file
    try:
        master_boundary_gdf.to_file(master_boundary_geojson_filepath, driver='GeoJSON')
        print("GeoJSON saved")
    except Exception as e:
        print("Error saving GeoJSON file:", e)
        return

    # Save the GeoDataFrame as a .js file with "var test =" added at the beginning
    js_output_filepath = os.path.join("../", "masterBoundary_1.js")
    try:
        with open(master_boundary_geojson_filepath, 'r') as geojson_file:
            geojson_data = geojson_file.read()
            with open(js_output_filepath, 'w') as js_file:
                js_file.write('json_masterBoundary_1 = ')
                js_file.write(geojson_data)
        print("JavaScript file saved")
    except Exception as e:
        print("Error saving JavaScript file:", e)
        return

    print("GeoJSON and JS files created successfully.")

def append_to_master_boundary_geojson(requested_city_boundary_gdf, master_boundary_geojson_filepath):
    # Convert the CRS of requested_city_boundary_gdf to WGS 84
    requested_city_boundary_gdf = requested_city_boundary_gdf.to_crs("EPSG:4326")

    # Check if the master GeoJSON file already exists
    if os.path.exists(master_boundary_geojson_filepath):
        # Load the master GeoDataFrame from the GeoJSON file
        master_boundary_gdf = gpd.read_file(master_boundary_geojson_filepath)
        # Convert the 'name' column to lowercase
        master_boundary_gdf['name'] = master_boundary_gdf['name'].str.lower()
        # Convert the CRS of master_boundary_gdf to WGS 84
        master_boundary_gdf = master_boundary_gdf.to_crs("EPSG:4326")
        # Append the requested city boundary GeoDataFrame to the master boundary GeoDataFrame
        master_boundary_gdf = pd.concat([master_boundary_gdf, requested_city_boundary_gdf], ignore_index=True)
    else:
        master_boundary_gdf = requested_city_boundary_gdf

    # Convert the CRS of master_boundary_gdf to a projected CRS (e.g., UTM)
    master_boundary_gdf = master_boundary_gdf.to_crs("EPSG:32632")  # Example: UTM Zone 32N

    # Calculate area for each feature and add it as a new column
    master_boundary_gdf['Area'] = master_boundary_gdf.geometry.area

    # Convert the CRS of master_boundary_gdf back to WGS 84
    master_boundary_gdf = master_boundary_gdf.to_crs("EPSG:4326")

    # Save the master GeoDataFrame as a GeoJSON file
    master_boundary_gdf.to_file(master_boundary_geojson_filepath, driver='GeoJSON')

    # Save the GeoDataFrame as a .js file with "var test =" added at the beginning
    js_output_filepath = os.path.join("../", "masterBoundary_1.js")
    with open(js_output_filepath, 'w') as js_file:
        js_file.write('var json_masterBoundary_1 =')
        js_file.write(master_boundary_gdf.to_json())

    print("GeoJSON and JS files created successfully.")

    polygoneFiltern.polygoneFiltern()
    automatischenPushen.git_push()


def download_requested_city(place_name, master_boundary_geojson_filepath):
    # Initialize master_boundary_gdf as None
    master_boundary_gdf = None

    # Check if the master GeoJSON file already exists
    if os.path.exists(master_boundary_geojson_filepath):
        # Load the master GeoDataFrame from the GeoJSON file
        master_boundary_gdf = gpd.read_file(master_boundary_geojson_filepath)

        # Convert the input place_name to lowercase
        place_name = place_name.lower()

        # Check if the requested city is already in the master GeoDataFrame
        if master_boundary_gdf is not None and place_name in master_boundary_gdf['name'].str.lower().values:
            # Extract measures and status for the requested city
            city_info = master_boundary_gdf[master_boundary_gdf['name'].str.lower() == place_name]
            print("Measures and status for the requested city:")
            print(city_info[['Measures', 'Status']])

            # Konvertiere das MultiPolygon in eine Liste von Polygons
            #polygons = list(city_info.iloc[0]['geometry'].geoms)  # Annahme: Es gibt nur ein MultiPolygon in city_info

            # Berechne und gib die Fläche jedes einzelnen Polygons aus
            #for i, polygon in enumerate(polygons):
            #    print(f"Area of polygon {i + 1}: {polygon.area} square units")

            #return

    # Get the city boundary GeoDataFrame
    requested_city_boundary_gdf = ox.geocode_to_gdf(place_name)

    # Convert the CRS of requested_city_boundary_gdf to match master_boundary_gdf if needed
    if master_boundary_gdf is not None and requested_city_boundary_gdf.crs != master_boundary_gdf.crs:
        requested_city_boundary_gdf = requested_city_boundary_gdf.to_crs(master_boundary_gdf.crs)

    # Prompt the user to add measures
    measures_taken = []
    status_of_measures = []

    while True:
        measure_input = input(
            "What measure has been taken in the entered region? (1: Promoting Pedestrian Traffic, 2: Promoting Public Transit, 3: Retrofitting Auto Infrastructure, 4: Reducing CO2 Emissions, 0: Finish): ")
        if measure_input == '0':
            break
        measures_mapping = {'1': 'Promoting Pedestrian Traffic', '2': 'Promoting Public Transit', '3': 'Retrofitting Auto Infrastructure',
                            '4': 'Reducing CO2 Emissions'}
        measure = measures_mapping.get(measure_input, 'Unknown')

        status_input = input(
            "Is the measure still active? (1: Planning, 2: Currently Being Implemented, 3: Implemented): ")
        status_mapping = {'1': 'Planning', '2': 'Currently Being Implemented', '3': 'Implemented'}
        status = status_mapping.get(status_input, 'Unknown')

        measures_taken.append(measure)
        status_of_measures.append(status)

    # Add measures and statuses to the GeoDataFrame
    requested_city_boundary_gdf['Measures'] = ", ".join(measures_taken)
    requested_city_boundary_gdf['Status'] = ", ".join(status_of_measures)

    # Append the city boundary to the master GeoJSON file
    append_to_master_boundary_geojson(requested_city_boundary_gdf, master_boundary_geojson_filepath)

    print("Done")

if __name__ == "__main__":
    place_name = input("Please enter the name of the city: ")
    master_boundary_geojson_filepath = os.path.join("../", "masterBoundary.geojson")

    # Create the master GeoJSON file if it doesn't exist
    if not os.path.exists(master_boundary_geojson_filepath):
        create_master_boundary_geojson(master_boundary_geojson_filepath)

    # Download the requested city and append it to the master GeoJSON file
    download_requested_city(place_name, master_boundary_geojson_filepath)


