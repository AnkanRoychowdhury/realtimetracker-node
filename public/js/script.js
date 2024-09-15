const socket = io();

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

const map = L.map("map").setView([0, 0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Ankan"
}).addTo(map);

const markers = {};
const markerColors = {}; // To store colors for each marker by ID
let markerPositions = []; // Array to store marker positions
let polylines = []; // Array to store polylines

// Helper function to generate random colors
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Helper function to create custom marker icon (similar to default marker but with different color)
function createColoredMarkerIcon(color) {
    // Create an SVG marker icon with the desired color
    return L.icon({
        iconUrl: `https://img.icons8.com/?size=100&id=67384&format=png&color=${color}`,
        iconSize: [64, 64],
        iconAnchor: [16, 48], // Anchor the icon to the base for better positioning
        popupAnchor: [0, -48] // Adjust the tooltip position
    });
}

// When a new location is received
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    map.setView([latitude, longitude]);

    // If the marker already exists, update its position
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);

        // Update the position in the markerPositions array
        markerPositions = markerPositions.map((pos) =>
            pos.id === id ? { id, coords: [latitude, longitude] } : pos
        );
    } else {
        // Assign a random color for the new marker
        const markerColor = getRandomColor();
        markerColors[id] = markerColor;

        // Create a new custom marker icon with the unique color
        const customIcon = createColoredMarkerIcon(markerColor);

        // Add the new custom marker to the map
        markers[id] = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        // markers[id].bindTooltip("Ankan", { permanent: true, direction: 'top' }).openTooltip();

        // Add the new marker's position to the markerPositions array
        markerPositions.push({ id, coords: [latitude, longitude] });
    }

    // Clear existing polylines before updating them
    polylines.forEach((polyline) => map.removeLayer(polyline));
    polylines = [];

    // Loop through markers and draw lines with different colors
    for (let i = 1; i < markerPositions.length; i++) {
        const from = markerPositions[i - 1].coords;
        const to = markerPositions[i].coords;

        // Create a polyline with a random color for each segment
        const polylineColor = getRandomColor();
        const polyline = L.polyline([from, to], { color: polylineColor }).addTo(map);

        // Store the polyline in an array so it can be updated or removed
        polylines.push(polyline);
    }
});

// When a user disconnects
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];

        // Remove the marker from the markerPositions array
        markerPositions = markerPositions.filter((pos) => pos.id !== id);

        // Clear existing polylines and redraw them with new positions
        polylines.forEach((polyline) => map.removeLayer(polyline));
        polylines = [];

        // Loop through markers and draw lines with different colors
        for (let i = 1; i < markerPositions.length; i++) {
            const from = markerPositions[i - 1].coords;
            const to = markerPositions[i].coords;

            // Create a polyline with a random color for each segment
            const polylineColor = getRandomColor();
            const polyline = L.polyline([from, to], { color: polylineColor }).addTo(map);

            // Store the polyline in an array so it can be updated or removed
            polylines.push(polyline);
        }
    }
});
