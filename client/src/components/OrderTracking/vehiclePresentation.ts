export const vehicleSvgPaths = {
    bike: `<g><path d="M6 15h5.1l2.3-5.5h-4" fill="#fed7aa" stroke="#fff" stroke-width="1.4"/><path d="M13.4 9.5l3.1 5.5H19" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M10 7.4h4.5l1.3 2.1" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M8.8 7.4h2" stroke="#fff" stroke-width="1.4"/><circle cx="5.5" cy="16.2" r="3" fill="#111827" stroke="#fff" stroke-width="1.5"/><circle cx="18.5" cy="16.2" r="3" fill="#111827" stroke="#fff" stroke-width="1.5"/><circle cx="5.5" cy="16.2" r="1.1" fill="#f97316"/><circle cx="18.5" cy="16.2" r="1.1" fill="#f97316"/></g>`,
    scooter: `<g><path d="M7 15.4h7.5c1.4 0 2.3-.7 2.7-2.1l.9-3.6h2" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M8.4 10.4h6.4l-.9 5" fill="#fed7aa" stroke="#fff" stroke-width="1.4"/><path d="M18.2 6.8h2.2M17.8 6.8l.8 2.9" stroke="#fff" stroke-width="1.4"/><circle cx="6.3" cy="16.8" r="2.6" fill="#111827" stroke="#fff" stroke-width="1.5"/><circle cx="17.5" cy="16.8" r="2.6" fill="#111827" stroke="#fff" stroke-width="1.5"/><circle cx="6.3" cy="16.8" r="1" fill="#f97316"/><circle cx="17.5" cy="16.8" r="1" fill="#f97316"/></g>`,
    car: `<g><path d="M4 14.6l1.9-4.3A2.3 2.3 0 0 1 8 8.9h7.9c.9 0 1.7.5 2.1 1.3l2 4.4v2.1H4v-2.1Z" fill="#fb923c" stroke="#fff" stroke-width="1.4"/><path d="M7.3 12h9.4l-1.1-1.9H8.2L7.3 12Z" fill="#e0f2fe" stroke="#fff" stroke-width="1"/><path d="M4 14.5h16" stroke="#fff" stroke-width="1"/><circle cx="7" cy="17" r="2.2" fill="#111827" stroke="#fff" stroke-width="1.3"/><circle cx="17" cy="17" r="2.2" fill="#111827" stroke="#fff" stroke-width="1.3"/><circle cx="7" cy="17" r=".8" fill="#f97316"/><circle cx="17" cy="17" r=".8" fill="#f97316"/></g>`,
    van: `<g><path d="M3.8 16V8.6c0-1 .8-1.8 1.8-1.8H14l5.8 4.7V16h-16Z" fill="#fb923c" stroke="#fff" stroke-width="1.4"/><path d="M14 7v4.5h5.4M6.2 10h5" fill="none" stroke="#fff" stroke-width="1.2"/><path d="M6.2 12.5h4" stroke="#fff" stroke-width="1.2"/><circle cx="7.1" cy="16.8" r="2.3" fill="#111827" stroke="#fff" stroke-width="1.4"/><circle cx="17.3" cy="16.8" r="2.3" fill="#111827" stroke="#fff" stroke-width="1.4"/><circle cx="7.1" cy="16.8" r=".85" fill="#f97316"/><circle cx="17.3" cy="16.8" r=".85" fill="#f97316"/></g>`,
};

type VehicleType = keyof typeof vehicleSvgPaths;

const vehicleAliases: Record<string, VehicleType> = {
    bicycle: "bike",
    cycle: "bike",
    motorcycle: "bike",
    motorbike: "bike",
    scooty: "scooter",
    auto: "scooter",
    cab: "car",
    sedan: "car",
    suv: "car",
    truck: "van",
};

export const getVehiclePresentation = (vehicleType?: string | null) => {
    const rawType = String(vehicleType || "vehicle").toLowerCase().trim();
    const type = (rawType in vehicleSvgPaths ? rawType : vehicleAliases[rawType] || "car") as VehicleType;
    const labels: Record<VehicleType, string> = {
        bike: "Bike",
        scooter: "Scooter",
        car: "Car",
        van: "Van",
    };

    return {
        type,
        label: labels[type],
        path: vehicleSvgPaths[type],
    };
};
