import { supabase } from "../../services/supabase.client"
import type { Vehicle, ParkingState } from "../models/parking"

const ACTIVE_KEY = "activeVehicles"
const HISTORY_KEY = "history"

/* ---------------- 1. LOCAL STORAGE ---------------- */

function loadLocalState(): ParkingState {
  if (typeof window === "undefined") {
    return { activeVehicles: [], history: [] }
  }

  const active = JSON.parse(localStorage.getItem(ACTIVE_KEY) || "[]") ?? []
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") ?? []

  return {
    activeVehicles: active,
    history: history,
  }
}

function saveLocalState(state: ParkingState) {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(state.activeVehicles))
  localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history))
}

/* ---------------- 2. MAPPER DB -> MODEL ---------------- */

function mapVehicle(v: any): Vehicle {
  return {
    id: v.id,
    originalPlate: v.original_plate,
    type: v.type,
    entryTimestamp: v.entry_timestamp,
    exitTimestamp: v.exit_timestamp,
    totalMinutes: v.total_minutes,
    hoursCharged: v.hours_charged,
    amountCharged: v.amount_charged,
    paymentMethod: v.payment_method,
  }
}

/* ---------------- 3. INITIAL LOAD ---------------- */

export async function loadInitialState(): Promise<ParkingState> {
  const local = loadLocalState()

  // Sincronización remota en segundo plano
  syncFromSupabase()

  return local
}

/* ---------------- 4. SYNC REMOTO (Corregido sin Merge) ---------------- */

export async function syncFromSupabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", user?.id)
      .order("entry_timestamp", { ascending: false })

    if (error || !data) return

    const mapped: Vehicle[] = data.map(mapVehicle)

    const remoteState: ParkingState = {
      // Filtrar usando la propiedad exit_timestamp directamente
      activeVehicles: mapped.filter((v) => v.exitTimestamp === null),
      history: mapped.filter((v) => v.exitTimestamp !== null),
    }

    // Guardamos directamente el estado de Supabase. La base de datos es la dueña de la verdad.
    saveLocalState(remoteState)

  } catch (err) {
    console.error("Supabase sync error", err)
  }
}

/* ---------------- 5. ESCUCHAR TIEMPO REAL (Nuevo) ---------------- */

export function subscribeToDatabaseChanges(onDataChange: () => void) {
  const channel = supabase
    .channel('parking_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vehicles' },
      () => {
        // Cuando cualquier dispositivo modifique la tabla, ejecutamos el callback
        onDataChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/* ---------------- 6. INSERT VEHICLE ---------------- */

export async function addVehicle(vehicle: Vehicle) {
  const local = loadLocalState()

  const newState: ParkingState = {
    ...local,
    activeVehicles: [...local.activeVehicles, vehicle],
  }

  saveLocalState(newState)

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from("vehicles").insert({
    id: vehicle.id,
    user_id: user?.id,
    original_plate: vehicle.originalPlate,
    type: vehicle.type,
    entry_timestamp: vehicle.entryTimestamp,
    is_active: true, // Aseguramos que entre activo
  })

  if (error) {
    console.error("SUPABASE INSERT ERROR:", error)
  }
}

/* ---------------- 7. UPDATE VEHICLE  ---------------- */

export async function updateVehicle(vehicle: Vehicle) {
  const local = loadLocalState()

  const active = local.activeVehicles.filter((v) => v.id !== vehicle.id)

  const newState: ParkingState = {
    activeVehicles: active,
    history: [vehicle, ...local.history],
  }

  saveLocalState(newState)

  // Agregado el await para asegurar que se complete el proceso
  const { error } = await supabase
    .from("vehicles")
    .update({
      exit_timestamp: vehicle.exitTimestamp,
      total_minutes: vehicle.totalMinutes,
      hours_charged: vehicle.hoursCharged,
      amount_charged: vehicle.amountCharged,
      payment_method: vehicle.paymentMethod,
      is_active: false, // Pasa a inactivo en la DB
    })
    .eq("id", vehicle.id)

  if (error) {
    console.error("SUPABASE UPDATE ERROR:", error)
  }
}

/* ---------------- 8. DELETE VEHICLE  ---------------- */

export async function deleteVehicle(id: string) {
  const local = loadLocalState()

  const newState: ParkingState = {
    ...local,
    activeVehicles: local.activeVehicles.filter((v) => v.id !== id),
    history: local.history.filter((v) => v.id !== id), // Por si borras del historial
  }

  saveLocalState(newState)

  // Agregado el await para asegurar que se complete el proceso
  const { error } = await supabase.from("vehicles").delete().eq("id", id)

  if (error) {
    console.error("SUPABASE DELETE ERROR:", error)
  }
}
