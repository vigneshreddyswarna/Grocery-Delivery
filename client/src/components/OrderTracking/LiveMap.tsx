import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPinIcon } from "lucide-react";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Order } from "../../types";
import { getVehiclePresentation } from "./vehiclePresentation";

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
    const storedDestination = isValidMapPoint(order.shippingAddress)
        ? { lat: Number(order.shippingAddress.lat), lng: Number(order.shippingAddress.lng) }
        : null;
    const [resolvedDestination, setResolvedDestination] = useState<{ lat: number; lng: number } | null>(null);
    const [isResolvingDestination, setIsResolvingDestination] = useState(false);
    const [resolveFailed, setResolveFailed] = useState(false);
    const destinationLocation = resolvedDestination || (resolveFailed ? storedDestination : null);
    const hasDeliveryAddress = Boolean(destinationLocation);
    const vehicle = getVehiclePresentation(order.deliveryPartner?.vehicleType);

    const vehicleIcon = L.divIcon({
        className: "",
        html: `
            <div style="width:54px;height:54px;border-radius:18px;background:linear-gradient(135deg,#15803d,#f97316);border:3px solid #fff;box-shadow:0 8px 22px rgba(15,23,42,.35);display:flex;align-items:center;justify-content:center;">
                <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    ${vehicle.path}
                </svg>
            </div>`,
        iconSize: [54, 54],
        iconAnchor: [27, 27],
        popupAnchor: [0, -27],
    });

    // Destination pin icon
    const destinationIcon = L.divIcon({
        className: "",
        html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#1b3022;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25);"><div style="width:9px;height:9px;border-radius:9999px;background:white;margin:7px auto;"></div></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });

    useEffect(() => {
        if (!addressQuery) {
            queueMicrotask(() => {
                setResolveFailed(true);
                setIsResolvingDestination(false);
                setResolvedDestination(null);
            });
            return;
        }

        const controller = new AbortController();
        queueMicrotask(() => {
            if (!controller.signal.aborted) {
                setIsResolvingDestination(true);
                setResolveFailed(false);
                setResolvedDestination(null);
            }
        });

        fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(addressQuery)}`, {
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) throw new Error("Unable to resolve delivery address");
                return response.json();
            })
            .then((results) => {
                const match = Array.isArray(results) ? results[0] : null;
                if (!match?.lat || !match?.lon) throw new Error("Delivery address not found");
                setResolvedDestination({ lat: Number(match.lat), lng: Number(match.lon) });
            })
            .catch((error) => {
                if (error.name !== "AbortError") setResolveFailed(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsResolvingDestination(false);
            });

        return () => controller.abort();
    }, [addressQuery]);

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
