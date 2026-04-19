export type VehicleType = "Car/SUV" | "Pickup" | "Motorcycle";
export type PaymentMethod = "cash" | "transfer";

export interface Vehicle {
  id: string;
  originalPlate: string;
  type: VehicleType;
  entryTimestamp: number;
  exitTimestamp: number | null;
  totalMinutes: number | null;
  hoursCharged: number | null;
  amountCharged: number | null;
  paymentMethod?: PaymentMethod | null;
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
