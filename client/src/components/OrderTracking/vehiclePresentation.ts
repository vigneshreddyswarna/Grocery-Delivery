export const bikeSvgPath = `<g><path d="M6 15h5.1l2.3-5.5h-4" fill="#fed7aa" stroke="#fff" stroke-width="1.4"/><path d="M13.4 9.5l3.1 5.5H19" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M10 7.4h4.5l1.3 2.1" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M8.8 7.4h2" stroke="#fff" stroke-width="1.4"/><circle cx="5.5" cy="16.2" r="3" fill="#111827" stroke="#fff" stroke-width="1.5"/><circle cx="18.5" cy="16.2" r="3" fill="#111827" stroke="#fff" stroke-width="1.5"/><circle cx="5.5" cy="16.2" r="1.1" fill="#f97316"/><circle cx="18.5" cy="16.2" r="1.1" fill="#f97316"/></g>`;

export const getVehiclePresentation = () => {
    return {
        type: "bike" as const,
        label: "Bike",
        path: bikeSvgPath,
    };
};
