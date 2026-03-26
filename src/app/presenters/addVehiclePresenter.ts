import type { VehicleType } from "../models/parking";

export const DEFAULT_VEHICLE_TYPE: VehicleType = "Car/SUV";

export function getAddVehicleFormResetValues() {
  return {
    patente: "",
    tipo: DEFAULT_VEHICLE_TYPE,
    horaIngreso: "",
  };
}

export function parseAddVehicleSubmit(
  patente: string,
  tipo: string,
  horaIngreso: string
): { patente: string; tipo: string; horaIngreso: string | null } | null {
  const trimmed = patente.trim();
  if (!trimmed) return null;
  return {
    patente: trimmed,
    tipo,
    horaIngreso: horaIngreso || null,
  };
}
