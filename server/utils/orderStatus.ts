export const ORDER_STATUSES = [
    "Placed", "Confirmed", "Assigned", "Packed",
    "Out for Delivery", "Delivered", "Cancelled",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
    Placed: ["Confirmed", "Assigned", "Cancelled"],
    Confirmed: ["Assigned", "Cancelled"],
    Assigned: ["Packed", "Cancelled"],
    Packed: ["Out for Delivery", "Cancelled"],
    "Out for Delivery": ["Delivered", "Cancelled"],
    Delivered: [],
    Cancelled: [],
}

export const isOrderStatus = (value: unknown): value is OrderStatus =>
    typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus)

export const canTransitionOrder = (from: string, to: OrderStatus) =>
    isOrderStatus(from) && transitions[from].includes(to)
