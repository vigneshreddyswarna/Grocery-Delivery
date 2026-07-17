import { useEffect } from "react"
import L from "leaflet"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type Point = { lat: number; lng: number }

const pinIcon = L.divIcon({
    className: "",
    html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:#166534;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 14px rgba(15,23,42,.35)"><div style="width:10px;height:10px;border-radius:50%;background:white;margin:9px auto"></div></div>`,
    iconSize: [34,34],
    iconAnchor: [17,34],
})

function Recenter({point}:{point:Point}){
    const map=useMap()
    useEffect(()=>{map.setView([point.lat,point.lng],17)},[map,point])
    return null
}

function ClickPicker({onPick}:{onPick:(point:Point)=>void}){
    useMapEvents({click:event=>onPick({lat:event.latlng.lat,lng:event.latlng.lng})})
    return null
}

export default function AddressMapPicker({point,onPick}:{point:Point;onPick:(point:Point)=>void}){
    return <div className="h-56 overflow-hidden rounded-xl border border-app-border">
        <MapContainer center={[point.lat,point.lng]} zoom={17} style={{height:"100%",width:"100%"}}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <Marker position={[point.lat,point.lng]} icon={pinIcon}/>
            <ClickPicker onPick={onPick}/>
            <Recenter point={point}/>
        </MapContainer>
    </div>
}
