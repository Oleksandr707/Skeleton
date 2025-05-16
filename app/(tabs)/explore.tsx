import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Modal, Button, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

export default function TabTwoScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedDistance, setSelectedDistance] = useState('1km');
  const [selectedPosition, setSelectedPosition] = useState<{ latitude: number, longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const navigation = useNavigation();
  const [isMapReady, setIsMapReady] = useState(false);


  const mapRef = useRef<MapView>(null);
  const distances = ['500m', '1km', '5km'];

  const getDistanceInMeters = () => {
    switch (selectedDistance) {
      case '500m': return 500;
      case '1km': return 1000;
      case '5km': return 5000;
      default: return 1000;
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  useEffect(() => {
    const subscribeToLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        (loc) => {
          setLocation(loc);

          if (selectedPosition) {
            const dist = getDistanceFromLatLonInMeters(
              loc.coords.latitude,
              loc.coords.longitude,
              selectedPosition.latitude,
              selectedPosition.longitude
            );
            setDistanceToTarget(dist);
            // setShowArrivalModal(true);
            if (dist <= 10 && !hasArrived) {
              setHasArrived(true);
              if (placeName) {
                setShowArrivalModal(true);
              }
            } else if (dist > 10 && hasArrived) {
              setHasArrived(false);
            }
          }
        }
      );
    };

    subscribeToLocation();
  }, [selectedPosition, hasArrived, placeName]);

  const getDistanceFromLatLonInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const fetchRouteFromOSRM = async (from: { latitude: number, longitude: number }, to: { latitude: number, longitude: number }) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    try {
      const response = await fetch(url);
      const json = await response.json();

      const coords = json.routes[0].geometry.coordinates.map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0]
      }));
      setRouteCoords(coords);
    } catch (err) {
      Alert.alert("Routing Error", "Failed to fetch route from OSRM.");
    }
  };

  const fetchPlaceName = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'User-Agent': 'YourAppName/1.0 (your@email.com)',
            'Accept-Language': 'en',
          },
        }
      );

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      if (data?.display_name) {
        setPlaceName(data.display_name);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Error fetching place name:', error);
      Alert.alert('Error', 'Failed to fetch place name');
    }
  };

  const onMapPress = (e: any) => {
    if (!location) return;

    const { latitude, longitude } = e.nativeEvent.coordinate;
    const distance = getDistanceFromLatLonInMeters(
      location.coords.latitude,
      location.coords.longitude,
      latitude,
      longitude
    );

    if (distance <= getDistanceInMeters()) {
      const newPos = { latitude, longitude };
      setSelectedPosition(newPos);
      fetchRouteFromOSRM(
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        newPos
      );
      fetchPlaceName(latitude, longitude);
    } else {
      Alert.alert('Out of range', `Selected location is more than ${selectedDistance}.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.blueHeader} />

      {location ? (
        <>
        <MapView
          provider="google"
          ref={mapRef}
          style={styles.map}
          onMapReady={() => setIsMapReady(true)}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={onMapPress}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="You"
          />
          <Circle
            center={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            radius={getDistanceInMeters()}
            fillColor="rgba(83, 44, 203, 0.3)"
            strokeColor="rgba(114, 98, 193, 0.5)"
          />
          {selectedPosition && (
            <Marker coordinate={selectedPosition} title="Destination" />
          )}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#007AFF" />
          )}
        </MapView>

        {!isMapReady && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#532CCB" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#532CCB" />
            </View>
          )}

      <Modal
        visible={showArrivalModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowArrivalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 Congratulations! 🎉</Text>
            <Text style={styles.modalMessage}>You've arrived at:</Text>
            <Text style={styles.modalPlace}>{placeName}</Text>
            <View style={styles.buttonRow}>
              {/* <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  // TODO: Add your save logic here
                  setShowArrivalModal(false);
                }}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity> */}
              <TouchableOpacity
                style={styles.saveButton} // Add your styling
                onPress={() => {
                  setShowArrivalModal(false);
                  router.push('/SaveScreen');
                }}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowArrivalModal(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>


      <View style={styles.controls}>
        <View style={styles.buttonGroup}>
          {distances.map((distance) => (
            <TouchableOpacity
              key={distance}
              style={[
                styles.choiceButton,
                selectedDistance === distance && styles.selectedButton,
              ]}
              onPress={() => {
                setSelectedDistance(distance);
                setRouteCoords([]);
                setSelectedPosition(null);
                setDistanceToTarget(null);
              }}
            >
              <Text
                style={[
                  styles.choiceText,
                  selectedDistance === distance && styles.selectedText,
                ]}
              >
                {distance}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
{/* 
{
  distanceToTarget !== null && (
    <View style={styles.placeNameContainer}>
      <Text style={styles.placeNameText}>
        Distance to target: {distanceToTarget.toFixed(1)} meters
      </Text>
    </View>
  )
} */}
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blueHeader: {
    height: 42,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  map: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // optional transparency
  },
  
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  choiceButton: {
    paddingVertical: 8,
    paddingHorizontal: 30,
    backgroundColor: '#eee',
    borderRadius: 5,
  },
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  choiceText: {
    color: '#000',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  placeNameContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  placeNameText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalPlace: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#3b3bc3',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12, // works in React Native >=0.71; use margin if not
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },


});

const restoBrightMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f3f3f3" }]  // light soft gray background
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#5a5a5a" }]  // medium gray text for better readability
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#ffffff" }]  // white stroke to brighten text edges
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#d6d6d6" }]  // soft light gray boundaries
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#e8e8e8" }]  // light and clean points of interest
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.business",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]  // keep icons minimal and clean
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]  // bright white roads
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#fefefe" }]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#a0d8f0" }]  // soft, bright blue water
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#4d4d4d" }]
  }
];

