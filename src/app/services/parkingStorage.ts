import type { ParkingState } from "../models/parking";

export function loadInitialState(): ParkingState {
  if (typeof window === "undefined") {
    return { activeVehicles: [], history: [] };
  }

  const active =
    JSON.parse(localStorage.getItem("activeVehicles") || "[]") ?? [];
  const hist =
    JSON.parse(localStorage.getItem("history") || "[]") ?? [];

  return {
    activeVehicles: active,
    history: hist,
  };
}

export function persistState(state: ParkingState) {
  if (typeof window === "undefined") return;
  localStorage.setItem("activeVehicles", JSON.stringify(state.activeVehicles));
  localStorage.setItem("history", JSON.stringify(state.history));
}

export function shouldResetToday(): boolean {
  if (typeof window === "undefined") return false;
  const today = new Date().toLocaleDateString();
  const lastReset = localStorage.getItem("lastResetDate");
  return lastReset !== today;
}

export function markResetDone() {
  if (typeof window === "undefined") return;
  localStorage.setItem("lastResetDate", new Date().toLocaleDateString());
}
