export const bikeSvgPath = `<g><path d="M6 15h5.1l2.3-5.5h-4" fill="#fed7aa" stroke="#fff" stroke-width="1.4"/><path d="M13.4 9.5l3.1 5.5H19" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M10 7.4h4.5l1.3 2.1" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M8.8 7.4h2" stroke="#fff" stroke-width="1.4"/><circle cx="5.5" cy="16.2" r="3" fill="#111827" stroke="#fff" stroke-width="1.5"/><circle cx="18.5" cy="16.2" r="3" fill="#111827" stroke="#fff" stroke-width="1.5"/><circle cx="5.5" cy="16.2" r="1.1" fill="#f97316"/><circle cx="18.5" cy="16.2" r="1.1" fill="#f97316"/></g>`;
export const scooterSvgPath = `<g><path d="M7 15.4h7.5c1.4 0 2.3-.7 2.7-2.1l.9-3.6h2" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M8.4 10.4h6.4l-.9 5" fill="#fed7aa" stroke="#fff" stroke-width="1.4"/><path d="M18.2 6.8h2.2M17.8 6.8l.8 2.9" stroke="#fff" stroke-width="1.4"/><circle cx="6.3" cy="16.8" r="2.6" fill="#111827" stroke="#fff" stroke-width="1.5"/><circle cx="17.5" cy="16.8" r="2.6" fill="#111827" stroke="#fff" stroke-width="1.5"/><circle cx="6.3" cy="16.8" r="1" fill="#f97316"/><circle cx="17.5" cy="16.8" r="1" fill="#f97316"/></g>`;

export const getVehiclePresentation = (vehicleType?:string|null) => {
    const type=vehicleType?.toLowerCase()==="scooter"?"scooter":"bike"
    return {
        type,
        label: type==="scooter"?"Scooter":"Bike",
        path: type==="scooter"?scooterSvgPath:bikeSvgPath,
    };
};
