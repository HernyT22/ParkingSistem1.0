import { supabase } from "../../services/supabase.client"
import type { Vehicle, ParkingState } from "../models/parking"

const ACTIVE_KEY = "activeVehicles"
const HISTORY_KEY = "history"

/* ---------------- LOCAL STORAGE ---------------- */

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

/* ---------------- MAPPER DB -> MODEL ---------------- */

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

/* ---------------- MERGE LOCAL + REMOTE ---------------- */

function mergeStates(local: ParkingState, remote: ParkingState): ParkingState {
  const mergedActive = [
    ...local.activeVehicles,
    ...remote.activeVehicles.filter(
      (r) => !local.activeVehicles.some((l) => l.id === r.id)
    ),
  ]

  const mergedHistory = [
    ...local.history,
    ...remote.history.filter(
      (r) => !local.history.some((l) => l.id === r.id)
    ),
  ]

  return {
    activeVehicles: mergedActive,
    history: mergedHistory,
  }
}

/* ---------------- INITIAL LOAD ---------------- */

export async function loadInitialState(): Promise<ParkingState> {

  const local = loadLocalState()

  // sync remoto en background
  syncFromSupabase()

  return local
}

/* ---------------- SYNC REMOTO ---------------- */

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
      activeVehicles: mapped.filter((v) => v.exitTimestamp === null),
      history: mapped.filter((v) => v.exitTimestamp !== null),
    }

    const local = loadLocalState()

    const merged = mergeStates(local, remoteState)

    saveLocalState(merged)

  } catch (err) {
    console.error("Supabase sync error", err)
  }
}

/* ---------------- INSERT VEHICLE ---------------- */

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
    is_active: true,
  })

  if (error) {
    console.error("SUPABASE INSERT ERROR:", error)
  }
}
/* ---------------- UPDATE VEHICLE ---------------- */

export function updateVehicle(vehicle: Vehicle) {

  const local = loadLocalState()

  const active = local.activeVehicles.filter((v) => v.id !== vehicle.id)

  const newState: ParkingState = {
    activeVehicles: active,
    history: [vehicle, ...local.history],
  }

  saveLocalState(newState)

  supabase
    .from("vehicles")
    .update({
      exit_timestamp: vehicle.exitTimestamp,
      total_minutes: vehicle.totalMinutes,
      hours_charged: vehicle.hoursCharged,
      amount_charged: vehicle.amountCharged,
      payment_method: vehicle.paymentMethod,
      is_active: false,
    })
    .eq("id", vehicle.id)
}

/* ---------------- DELETE VEHICLE ---------------- */

export function deleteVehicle(id: string) {

  const local = loadLocalState()

  const newState: ParkingState = {
    ...local,
    activeVehicles: local.activeVehicles.filter((v) => v.id !== id),
  }

  saveLocalState(newState)

  supabase.from("vehicles").delete().eq("id", id)
}