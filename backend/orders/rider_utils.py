import math
import re


def extract_delivery_region(address: str) -> str:
    """Public region label — never exposes full street-level detail."""
    if not address or not str(address).strip():
        return "Service area"
    cleaned = str(address).strip()
    parts = [p.strip() for p in cleaned.split(",") if p.strip()]
    if len(parts) >= 2:
        return f"{parts[0]}, {parts[-1]}"
    return parts[0] if parts else "Service area"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(p1) * math.cos(p2) * math.sin(d_lon / 2) ** 2
    )
    return radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# Approximate centroids for common Addis sub-cities (fallback when no geocode)
REGION_CENTROIDS = {
    "center": (8.541, 39.269),
    "station": (8.549, 39.261),
    "kebele_01": (8.536, 39.255),
    "bole": (8.562, 39.284),
    "aba_gada": (8.528, 39.289),
    "franco": (8.544, 39.273),
}



def approximate_region_centroid(region: str) -> tuple[float, float] | None:
    key = re.sub(r"[^a-z]", "", (region or "").lower())
    for name, coords in REGION_CENTROIDS.items():
        if name in key:
            return coords
    return (8.562, 39.284)
