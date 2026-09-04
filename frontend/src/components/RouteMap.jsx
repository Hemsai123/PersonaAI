import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;
const divIcon = (emoji) => L.divIcon({
    html: `<div style="font-size:20px;line-height:20px">${emoji}</div>`,
    className: 'emoji-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});
const hotelIcon = divIcon('🏨');
const foodIcon = divIcon('🍽️');
const attractionIcon = divIcon('✨');
const carIcon = divIcon('🚗');
const trainIcon = divIcon('🚆');
const planeIcon = divIcon('✈️');
/**
 * Inline routing — manages OSRM routing control.
 * Uses a stable string key so it only rebuilds when actual coordinates change.
 * Wrapped in try-catch + setTimeout to survive React re-render timing issues.
 */
const InlineRouting = ({ wpKey, origin, destinations, onRoute }) => {
    const map = useMap();
    const controlRef = useRef(null);
    const onRouteRef = useRef(onRoute);
    onRouteRef.current = onRoute;
    useEffect(() => {
        if (!map || !wpKey)
            return;
        // Clean up previous control
        const oldControl = controlRef.current;
        if (oldControl) {
            controlRef.current = null;
            try {
                map.removeControl(oldControl);
            }
            catch (_) { }
        }
        if (!origin)
            return;
        const valid = destinations.filter((d) => d !== null);
        if (valid.length === 0)
            return;
        const waypoints = [
            L.latLng(origin.lat, origin.lng),
            ...valid.map(d => L.latLng(d.lat, d.lng))
        ];
        // Defer control creation to let React finish rendering
        const timer = setTimeout(() => {
            try {
                if (!map || !map.getContainer())
                    return;
                const control = L.Routing.control({
                    waypoints,
                    routeWhileDragging: false,
                    fitSelectedRoutes: false,
                    show: false,
                    addWaypoints: false,
                    router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
                    lineOptions: {
                        styles: [{ color: '#4F46E5', weight: 5, opacity: 0.85 }],
                        extendToWaypoints: true,
                        missingRouteTolerance: 0,
                    },
                });
                control.addTo(map);
                // Hide the itinerary container
                const container = control.getContainer?.();
                if (container)
                    container.style.display = 'none';
                control.on('routesfound', (e) => {
                    const first = e.routes?.[0];
                    if (!first || !onRouteRef.current)
                        return;
                    onRouteRef.current({
                        distanceMeters: first.summary?.totalDistance ?? 0,
                        durationSeconds: first.summary?.totalTime ?? 0,
                        coordinates: (first.coordinates || []).map((c) => [c.lat, c.lng]),
                    });
                });
                controlRef.current = control;
            }
            catch (err) {
                console.warn('Routing control init failed (will retry on next change):', err);
            }
        }, 300);
        return () => {
            clearTimeout(timer);
            if (controlRef.current) {
                try {
                    map.removeControl(controlRef.current);
                }
                catch (_) { }
                controlRef.current = null;
            }
        };
    }, [map, wpKey]);
    return null;
};
/**
 * Fits map bounds to include all markers and POIs.
 */
const FitBounds = ({ boundsKey, origin, destinations, hotels, food, attractions }) => {
    const map = useMap();
    useEffect(() => {
        if (!boundsKey)
            return;
        const markers = [];
        if (origin)
            markers.push(L.latLng(origin.lat, origin.lng));
        destinations.filter((d) => d !== null).forEach(d => markers.push(L.latLng(d.lat, d.lng)));
        [...hotels, ...food, ...attractions].forEach(p => markers.push(L.latLng(p.lat, p.lng)));
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
            setTimeout(() => map.invalidateSize(), 200);
        }
    }, [map, boundsKey]);
    return null;
};
const RouteMap = ({ origin, destinations, hotels = [], food = [], attractions = [], onRoute, transportMode = 'car', routePath, }) => {
    const center = destinations.find(d => d !== null) ?? origin ?? { lat: 20.5937, lng: 78.9629 };
    // Stable string key for waypoints — prevents unnecessary rerenders
    const wpKey = useMemo(() => {
        if (!origin)
            return '';
        const valid = destinations.filter((d) => d !== null);
        if (valid.length === 0)
            return '';
        return [origin, ...valid].map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');
    }, [
        origin?.lat, origin?.lng,
        destinations.map(d => d ? `${d.lat.toFixed(5)},${d.lng.toFixed(5)}` : '').join('|'),
    ]);
    // Stable string key for bounds
    const boundsKey = useMemo(() => {
        const parts = [];
        if (origin)
            parts.push(`o:${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}`);
        destinations.forEach((d, i) => {
            if (d)
                parts.push(`d${i}:${d.lat.toFixed(4)},${d.lng.toFixed(4)}`);
        });
        parts.push(`p:${hotels.length},${food.length},${attractions.length}`);
        return parts.join('|');
    }, [
        origin?.lat, origin?.lng,
        destinations.map(d => d ? `${d.lat.toFixed(4)},${d.lng.toFixed(4)}` : '').join('|'),
        hotels.length, food.length, attractions.length,
    ]);
    const midPoint = useMemo(() => {
        if (!routePath?.length)
            return null;
        const idx = Math.floor(routePath.length / 2);
        return { lat: routePath[idx][0], lng: routePath[idx][1] };
    }, [routePath]);
    const modeIcon = useMemo(() => {
        if (transportMode === 'plane')
            return planeIcon;
        if (transportMode === 'train')
            return trainIcon;
        return carIcon;
    }, [transportMode]);
    return (React.createElement("div", { className: "relative" },
        React.createElement("div", { className: "absolute right-3 top-3 z-[1000] rounded-lg bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 shadow px-3 py-2 text-sm" },
            React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement("span", null, "\uD83D\uDE97/\uD83D\uDE86/\u2708\uFE0F Travel"),
                React.createElement("span", null, "\uD83C\uDFE8 Hotels"),
                React.createElement("span", null, "\uD83C\uDF7D\uFE0F Dining"),
                React.createElement("span", null, "\u2728 Sights"))),
        React.createElement(MapContainer, { center: [center.lat, center.lng], zoom: 6, style: { height: '70vh', width: '100%' }, scrollWheelZoom: true },
            React.createElement(TileLayer, { attribution: "\u00A9 OpenStreetMap contributors", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }),
            origin && React.createElement(Marker, { position: [origin.lat, origin.lng] },
                React.createElement(Popup, null, "\uD83D\uDCCD Origin")),
            destinations.map((d, idx) => d && (React.createElement(Marker, { key: `dest-${idx}`, position: [d.lat, d.lng] },
                React.createElement(Popup, null,
                    "\uD83D\uDCCD Stop ",
                    idx + 1)))),
            routePath && routePath.length > 1 && (React.createElement(Polyline, { positions: routePath, pathOptions: { color: '#6366f1', weight: 4, opacity: 0.4, dashArray: '10 6' } })),
            midPoint && React.createElement(Marker, { position: [midPoint.lat, midPoint.lng], icon: modeIcon }),
            hotels.map((h, i) => (React.createElement(Marker, { key: `h-${i}`, position: [h.lat, h.lng], icon: hotelIcon },
                React.createElement(Popup, null,
                    "\uD83C\uDFE8 ",
                    h.name)))),
            food.map((f, i) => (React.createElement(Marker, { key: `f-${i}`, position: [f.lat, f.lng], icon: foodIcon },
                React.createElement(Popup, null,
                    "\uD83C\uDF7D\uFE0F ",
                    f.name)))),
            attractions.map((a, i) => (React.createElement(Marker, { key: `a-${i}`, position: [a.lat, a.lng], icon: attractionIcon },
                React.createElement(Popup, null,
                    "\u2728 ",
                    a.name)))),
            React.createElement(InlineRouting, { wpKey: wpKey, origin: origin, destinations: destinations, onRoute: onRoute }),
            React.createElement(FitBounds, { boundsKey: boundsKey, origin: origin, destinations: destinations, hotels: hotels, food: food, attractions: attractions }))));
};
export default RouteMap;
