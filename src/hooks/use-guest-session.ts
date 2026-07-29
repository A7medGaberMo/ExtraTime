"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";

export function useGuestSession(redirectToHomeIfMissing = false) {
  const router = useRouter();
  const [guestId, setGuestId] = useState<Id<"guestUsers"> | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("extratime_guestId");
      return stored ? (stored as Id<"guestUsers">) : null;
    }
    return null;
  });

  useEffect(() => {
    if (redirectToHomeIfMissing && !guestId) {
      router.push("/");
    }
  }, [redirectToHomeIfMissing, guestId, router]);

  const saveGuestId = (id: Id<"guestUsers">) => {
    localStorage.setItem("extratime_guestId", id);
    setGuestId(id);
  };

  return { guestId, saveGuestId };
}
