"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ListingRecord = {
  id: string;
  make: string;
  model: string;
  year: string;
  operatingHours: string;
  location: string;
  latitude?: string;
  longitude?: string;
  askingPrice: string;
  description: string;
  photoPaths?: string[];
};

type DistanceListing = ListingRecord & { distanceMiles: number | null };

const rangeOptions = [25, 50, 100, 250, 500];

function toNumber(value?: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function distanceInMiles(
  originLat: number,
  originLon: number,
  targetLat: number,
  targetLon: number
): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const earthMiles = 3958.8;
  const dLat = toRadians(targetLat - originLat);
  const dLon = toRadians(targetLon - originLon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(originLat)) * Math.cos(toRadians(targetLat)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthMiles * c;
}

export default function ListingsPage() {
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [rangeMiles, setRangeMiles] = useState(100);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    async function verifyAndLoadListings() {
      try {
        const email = localStorage.getItem("soldiron_subscriber_email") ?? "";
        if (!email) {
          setHasAccess(false);
          setAccessChecked(true);
          setLoading(false);
          return;
        }

        const statusResponse = await fetch(`/api/billing/status?email=${encodeURIComponent(email)}`);
        const statusResult = (await statusResponse.json()) as { ok: boolean; active?: boolean };
        if (!statusResponse.ok || !statusResult.ok || !statusResult.active) {
          setHasAccess(false);
          setAccessChecked(true);
          setLoading(false);
          return;
        }

        setHasAccess(true);
        setAccessChecked(true);
      } catch {
        setHasAccess(false);
        setAccessChecked(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/listings");
        const result = (await response.json()) as {
          ok: boolean;
          listings: ListingRecord[];
        };
        if (!response.ok || !result.ok) {
          setLoadError("Could not load listings right now.");
          return;
        }
        setListings(result.listings ?? []);
      } catch {
        setLoadError("Could not load listings right now.");
      } finally {
        setLoading(false);
      }
    }

    void verifyAndLoadListings();
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setLocationError("Location access denied or unavailable.");
        setLocating(false);
      }
    );
  }

  const listingsWithDistance = useMemo<DistanceListing[]>(() => {
    return listings.map((listing) => {
      const lat = toNumber(listing.latitude);
      const lon = toNumber(listing.longitude);

      if (!userLocation || lat === null || lon === null) {
        return { ...listing, distanceMiles: null };
      }

      return {
        ...listing,
        distanceMiles: distanceInMiles(userLocation.lat, userLocation.lon, lat, lon),
      };
    });
  }, [listings, userLocation]);

  const visibleListings = useMemo(() => {
    if (!userLocation) return listingsWithDistance;
    return listingsWithDistance.filter(
      (listing) => listing.distanceMiles !== null && listing.distanceMiles <= rangeMiles
    );
  }, [listingsWithDistance, rangeMiles, userLocation]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Marketplace
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">Browse Equipment</h1>
          </div>
          <Link
            href="/"
            className="border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
          >
            Back Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10">
        {accessChecked && !hasAccess ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <h2 className="font-display text-3xl uppercase text-[var(--gold)]">
              Subscription Required
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              An active subscription is required to browse equipment listings.
            </p>
            <Link
              href="/subscribe"
              className="mt-6 inline-block border border-[var(--line-strong)] bg-[var(--gold)] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110"
            >
              Sign Up
            </Link>
          </section>
        ) : (
          <>
        <section className="mb-6 border border-[var(--line)] bg-[var(--panel)] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={requestLocation}
              disabled={locating}
              className="border border-[var(--line-strong)] bg-[var(--gold)] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              {locating ? "Locating..." : "Use My Location"}
            </button>

            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Mile Range
            </label>
            <select
              value={rangeMiles}
              onChange={(e) => setRangeMiles(Number(e.target.value))}
              className="h-10 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none focus:border-[var(--line-strong)]"
            >
              {rangeOptions.map((miles) => (
                <option key={miles} value={miles}>
                  {miles} miles
                </option>
              ))}
            </select>
          </div>

          {!userLocation && (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Enable location to filter listings by distance.
            </p>
          )}
          {locationError && <p className="mt-3 text-sm text-red-400">{locationError}</p>}
          {userLocation && (
            <p className="mt-3 text-sm text-[var(--gold)]">
              Showing equipment within {rangeMiles} miles of your current location.
            </p>
          )}
        </section>

        {loading ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <p className="text-sm text-[var(--muted)]">Loading listings...</p>
          </section>
        ) : loadError ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <p className="text-sm text-red-400">{loadError}</p>
          </section>
        ) : visibleListings.length === 0 ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <h2 className="font-display text-3xl uppercase text-[var(--gold)]">No Listings In Range</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Try increasing your mile range or list the first machine in your area.
            </p>
            <Link
              href="/list-machine"
              className="mt-6 inline-block border border-[var(--line-strong)] bg-[var(--gold)] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110"
            >
              List A Machine
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {visibleListings.map((listing) => (
              <article key={listing.id} className="border border-[var(--line)] bg-[var(--panel)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
                  {listing.make}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {listing.model} {listing.year ? `(${listing.year})` : ""}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">{listing.location}</p>
                {listing.distanceMiles !== null && (
                  <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[var(--gold)]">
                    {listing.distanceMiles.toFixed(1)} miles away
                  </p>
                )}
                <p className="mt-3 text-sm text-[var(--muted)] line-clamp-3">{listing.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
                  <p className="font-display text-3xl text-[var(--gold)]">{listing.askingPrice || "TBD"}</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                    {listing.operatingHours ? `${listing.operatingHours} hrs` : "Hours N/A"}
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
          </>
        )}
      </main>
    </div>
  );
}
