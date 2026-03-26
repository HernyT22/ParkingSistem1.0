import type { ParkingState, Vehicle, VehicleType } from "../models/parking";
import { rates } from "../models/parking";

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
    paymentMethod: null,
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

  let totalCharged = 0;
  let cashTotal = 0;
  let transferTotal = 0;

  for (const v of state.history) {
    const amount = v.amountCharged || 0;
    totalCharged += amount;

    if (v.paymentMethod === "cash") {
      cashTotal += amount;
    } else if (v.paymentMethod === "transfer") {
      transferTotal += amount;
    }
  }

  return {
    totalVehicles,
    totalCharged,
    cashTotal,
    transferTotal,
  };
}
