/** place_id de geocoding real (OSM/Nominatim/GPS/Google), não do catálogo demo. */
export function isRealGeocodePlaceId(placeId: string | null | undefined): boolean {
  if (!placeId?.trim()) return false;
  if (placeId.startsWith("demo-")) return false;
  return (
    placeId.startsWith("osm:") ||
    placeId.startsWith("nominatim:") ||
    placeId.startsWith("coord:") ||
    placeId.startsWith("sergipe:") ||
    placeId.startsWith("ChI")
  );
}
