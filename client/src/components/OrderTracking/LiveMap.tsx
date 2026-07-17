import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPinIcon } from "lucide-react";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Order } from "../../types";
import { getVehiclePresentation } from "./vehiclePresentation";
import { geocodeIndianAddress } from "../../utils/indiaGeocoding";

type MapPoint = { lat?: number | string | null; lng?: number | string | null };
type AddressLike = Order["shippingAddress"];

const isValidMapPoint = (point?: MapPoint | null) => (
    Number.isFinite(Number(point?.lat)) &&
    Number.isFinite(Number(point?.lng)) &&
    !(Number(point?.lat) === 0 && Number(point?.lng) === 0)
);

const buildDeliveryAddressQuery = (address: AddressLike) => (
    [address.address, address.city, address.state, address.zip]
        .filter(Boolean)
        .join(", ")
);

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

function MapBoundsUpdater({ points }: { points: Array<[number, number]> }) {
    const map = useMap();
    useEffect(() => {
        if (points.length > 1) {
            map.fitBounds(L.latLngBounds(points), { padding: [34, 34], maxZoom: 15 });
        } else if (points[0]) {
            map.setView(points[0], map.getZoom());
        }
    }, [map, points]);
    return null;
}

export default function LiveMap({ order, liveLocation }: { order: Order, liveLocation: MapPoint | null }) {
    const currentLocation = liveLocation || (order.liveLocation?.isSharing ? order.liveLocation : null);
    const hasLiveLocation = isValidMapPoint(currentLocation);
    const currentMapPoint = hasLiveLocation && currentLocation
        ? { lat: Number(currentLocation.lat), lng: Number(currentLocation.lng) }
        : null;
    const addressQuery = useMemo(() => buildDeliveryAddressQuery(order.shippingAddress), [order.shippingAddress]);
    const storedDestination = useMemo(() => isValidMapPoint(order.shippingAddress)
        ? { lat: Number(order.shippingAddress.lat), lng: Number(order.shippingAddress.lng) }
        : null, [order.shippingAddress]);
    const [resolvedDestination, setResolvedDestination] = useState<{ lat: number; lng: number } | null>(null);
    const [isResolvingDestination, setIsResolvingDestination] = useState(false);
    // Saved coordinates come from the customer's confirmed GPS/map point and are
    // more precise than geocoding the address text again during tracking.
    const destinationLocation = storedDestination || resolvedDestination;
    const hasDeliveryAddress = Boolean(destinationLocation);
    const vehicle = getVehiclePresentation(order.deliveryPartner?.vehicleType);

    const vehicleIcon = L.divIcon({
        className: "",
        html: `
            <div aria-label="Delivery partner on bike" style="position:relative;width:48px;height:48px;border-radius:50% 50% 50% 12px;transform:rotate(-45deg);background:linear-gradient(145deg,#0f5132,#1f7a4c);border:3px solid #fff;box-shadow:0 8px 24px rgba(15,23,42,.38);display:flex;align-items:center;justify-content:center;">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)">
                    ${vehicle.path}
                </svg>
                <span style="position:absolute;right:-3px;top:-3px;width:13px;height:13px;border-radius:999px;background:#22c55e;border:2px solid #fff;transform:rotate(45deg)"></span>
            </div>`,
        iconSize: [48, 48],
        iconAnchor: [12, 43],
        popupAnchor: [12, -40],
    });

    // Destination pin icon
    const destinationIcon = L.divIcon({
        className: "",
        html: `<div style="width:48px;height:48px;border-radius:50% 50% 50% 0;background:#1b3022;transform:rotate(-45deg);border:3px solid white;box-shadow:0 6px 18px rgba(0,0,0,.3);"><div style="width:14px;height:14px;border-radius:9999px;background:white;margin:14px auto;"></div></div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48],
    });

    useEffect(() => {
        if (storedDestination || !addressQuery) {
            queueMicrotask(() => {
                setIsResolvingDestination(false);
                setResolvedDestination(null);
            });
            return;
        }

        const controller = new AbortController();
        queueMicrotask(() => {
            if (!controller.signal.aborted) {
                setIsResolvingDestination(true);
                setResolvedDestination(null);
            }
        });

        geocodeIndianAddress(order.shippingAddress)
            .then(setResolvedDestination)
            .catch((error) => {
                if (error.name !== "AbortError") setResolvedDestination(null);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsResolvingDestination(false);
            });

        return () => controller.abort();
    }, [addressQuery, order.shippingAddress, storedDestination]);

    const mapPoints: Array<[number, number]> = [
        ...(currentMapPoint ? [[currentMapPoint.lat, currentMapPoint.lng] as [number, number]] : []),
        ...(destinationLocation ? [[destinationLocation.lat, destinationLocation.lng] as [number, number]] : []),
    ];
    const mapCenter: [number, number] = destinationLocation
        ? [destinationLocation.lat, destinationLocation.lng]
        : [currentMapPoint?.lat ?? 0, currentMapPoint?.lng ?? 0];

    return (
        <>
            {order.status !== "Delivered" && order.status !== "Cancelled" && (
                <div className="rounded-2xl overflow-hidden border border-app-border" style={{ height: 280 }}>
                    {currentMapPoint ? (
                        <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[currentMapPoint.lat, currentMapPoint.lng]} icon={vehicleIcon}>
                                <Popup>
                                    <div>
                                        <p className="font-semibold">{order.deliveryPartner?.name || "Delivery Partner"}</p>
                                        <p>{vehicle.label} location</p>
                                    </div>
                                </Popup>
                            </Marker>
                            {hasDeliveryAddress && (
                                <Marker position={[destinationLocation!.lat, destinationLocation!.lng]} icon={destinationIcon}>
                                    <Popup>
                                        <div>
                                            <p className="font-semibold">Delivery Address</p>
                                            <p>{addressQuery}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                            {isResolvingDestination && (
                                <div className="absolute left-3 right-3 bottom-3 z-[1000] rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-app-green shadow">
                                    Finding the delivery address on the map...
                                </div>
                            )}
                            <MapBoundsUpdater points={mapPoints} />
                        </MapContainer>
                    ) : hasDeliveryAddress ? (
                        <MapContainer center={[destinationLocation!.lat, destinationLocation!.lng]} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[destinationLocation!.lat, destinationLocation!.lng]} icon={destinationIcon}>
                                <Popup>
                                    <div>
                                        <p className="font-semibold">Delivery Address</p>
                                        <p>{addressQuery}</p>
                                    </div>
                                </Popup>
                            </Marker>
                            <MapUpdater center={[destinationLocation!.lat, destinationLocation!.lng]} />
                            <div className="absolute left-3 right-3 bottom-3 z-[1000] rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-app-green shadow">
                                Waiting for {order.deliveryPartner?.name || "delivery partner"} location...
                            </div>
                        </MapContainer>
                    ) : (
                        <div className="h-full bg-app-green/5 flex-center">
                            <div className="text-center">
                                <MapPinIcon className="size-8 text-app-green/40 mx-auto mb-2" />
                                <p className="text-sm text-app-green/50 font-medium">Waiting for delivery partner location...</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
