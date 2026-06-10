#!/bin/bash
for file in RideHistory.tsx RideDetails.tsx DriverDashboard.tsx; do
  if [ -f "$file" ] && ! grep -q "AppHeader" "$file"; then
    # Add import
    sed -i '/import.*wouter/a import AppHeader from "@/components/AppHeader";' "$file"
    # Add header component (find first div with min-h-screen and add header after it)
    sed -i '/<div className="min-h-screen/a \      <AppHeader showBack={true} />\n      <div className="p-4">' "$file"
  fi
done
