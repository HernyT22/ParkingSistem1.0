import type { Vehicle } from "../models/parking";
import type { HistoryEntryUi } from "../models/parkingUi";

export function formatTime(timestamp: number | null): string {
  if (!timestamp) return "-";
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatHoursFromMinutes(totalMinutes: number | null): string {
  if (!totalMinutes || totalMinutes <= 0) {
    return "0 min";
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = totalMinutes / 60;
  return `${hours.toFixed(2)} h`;
}

export function mapHistoryToUi(history: Vehicle[]): HistoryEntryUi[] {
  return history.map((v) => ({
    patente: v.originalPlate,
    tipo: v.type,
    horaIngreso: formatTime(v.entryTimestamp),
    horaEgreso: formatTime(v.exitTimestamp),
    monto: v.amountCharged ?? 0,
    medioPago:
      v.paymentMethod === "cash"
        ? "Efectivo"
        : v.paymentMethod === "transfer"
          ? "Transferencia bancaria"
          : "-",
  }));
}
