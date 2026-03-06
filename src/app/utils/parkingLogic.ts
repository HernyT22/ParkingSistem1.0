// src/app/utils/parkingLogic.ts
export type VehicleType = "Car/SUV" | "Pickup" | "Motorcycle";

export interface Vehicle {
  id: string;
  originalPlate: string;
  type: VehicleType;
  entryTimestamp: number;
  exitTimestamp: number | null;
  totalMinutes: number | null;
  hoursCharged: number | null;
  amountCharged: number | null;
}

export interface ParkingState {
  activeVehicles: Vehicle[];
  history: Vehicle[];
}

export const rates: Record<VehicleType, number> = {
  "Car/SUV": 2500,
  Pickup: 3000,
  Motorcycle: 1000,
};

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

function getTodayWithTime(time: string | null): number {
  if (!time) {
    return Date.now();
  }

  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return Date.now();
  }

  const now = new Date();
  const custom = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0
  );

  return custom.getTime();
}

export function createVehicle(
  plate: string,
  type: VehicleType,
  existing: Vehicle[],
  entryTime?: string | null
): Vehicle {
  const entryTimestamp = getTodayWithTime(entryTime ?? null);

  // lógica de sufijos (123, 123(2), etc.)
  const samePlates = existing.filter((v) =>
    v.originalPlate.startsWith(plate)
  );
  let finalPlate = plate;
  if (samePlates.length > 0) {
    finalPlate += `(${samePlates.length + 1})`;
  }

  return {
    id: String(entryTimestamp),
    originalPlate: finalPlate,
    type,
    entryTimestamp,
    exitTimestamp: null,
    totalMinutes: null,
    hoursCharged: null,
    amountCharged: null,
  };
}

export function checkoutVehicle(
  vehicle: Vehicle,
  exitTime?: string | null
): Vehicle {
  const exitTimestamp = getTodayWithTime(exitTime ?? null);

  const diffMs = exitTimestamp - vehicle.entryTimestamp;
  const totalMinutes = Math.ceil(diffMs / 60000);

  const minutesPerTurn = 60;
  const tolerance = 10;
  let hoursCharged = Math.ceil((totalMinutes - tolerance) / minutesPerTurn);
  if (hoursCharged < 1) hoursCharged = 1;

  const amountCharged =
    hoursCharged * (rates[vehicle.type] || 0);

  return {
    ...vehicle,
    exitTimestamp,
    totalMinutes,
    hoursCharged,
    amountCharged,
  };
}

export function calculateSummary(state: ParkingState) {
  const totalVehicles =
    state.activeVehicles.length + state.history.length;

  const totalCharged = state.history.reduce((sum, v) => {
    return sum + (v.amountCharged || 0);
  }, 0);

  return {
    totalVehicles,
    totalCharged,
  };
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