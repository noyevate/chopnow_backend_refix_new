/**
 * Determines if a restaurant is currently open for a given order type.
 * Uses the restaurant's own timezone so the check is always local-time accurate.
 *
 * @param {object} restaurant - Sequelize Restaurant instance
 * @param {string} orderType  - "delivery" or "pickup"
 * @returns {{ isOpen: boolean, reason: string }}
 */
function isRestaurantOpen(restaurant, orderType) {
    // --- 1. Manual override check first ---
    if (!restaurant.isAvailabe) {
        return { isOpen: false, reason: "Restaurant is temporarily closed by the owner" };
    }

    const timeConfig = restaurant.time;

    // --- 2. Guard: no schedule configured yet ---
    if (!timeConfig) {
        return { isOpen: false, reason: "Restaurant has not configured its operating hours yet" };
    }

    const timezone = timeConfig.timezone || "Africa/Lagos"; // fallback to Lagos

    // --- 3. Get the current day + time in the restaurant's local timezone ---
    const now = new Date();

    // e.g. "monday", "tuesday" etc
    const dayName = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "long",
    }).format(now).toLowerCase();

    // e.g. "14:35"
    const currentTimeStr = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(now);

    // Convert "14:35" → minutes since midnight for easy comparison
    const toMinutes = (timeStr) => {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
    };

    const currentMinutes = toMinutes(currentTimeStr);

    const orderTypeLower = (orderType || "delivery").toLowerCase();

    let schedule;
    if (timeConfig[orderTypeLower] && typeof timeConfig[orderTypeLower] === "object" && !Array.isArray(timeConfig[orderTypeLower])) {
        schedule = timeConfig[orderTypeLower];
    } else {
        schedule = timeConfig;
    }

    const todaySlots = schedule[dayName];

    if (!todaySlots || todaySlots.length === 0) {
        return {
            isOpen: false,
            reason: `Restaurant does not accept ${orderTypeLower} orders on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`,
        };
    }

    for (const slot of todaySlots) {
        const openMinutes  = toMinutes(slot.open);
        const closeMinutes = toMinutes(slot.close);

        if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
            return { isOpen: true, reason: "Restaurant is open" };
        }
    }

    const slotDisplay = todaySlots
        .map((s) => `${s.open} – ${s.close}`)
        .join(", ");

    return {
        isOpen: false,
        reason: `Restaurant is currently outside its operating hours. Today's ${orderTypeLower} hours: ${slotDisplay}`,
    };
}

module.exports = { isRestaurantOpen };