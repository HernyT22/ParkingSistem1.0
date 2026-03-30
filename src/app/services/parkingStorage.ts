import { supabase } from "../../services/supabase.client"
import type { Vehicle, ParkingState } from "../models/parking"

const ACTIVE_KEY = "activeVehicles"
const HISTORY_KEY = "history"

/* ---------------- LOCAL STORAGE ---------------- */

function loadLocalState(): ParkingState {
  if (typeof window === "undefined") {
    return { activeVehicles: [], history: [] }
  }

  const active =
    JSON.parse(localStorage.getItem(ACTIVE_KEY) || "[]") ?? []

  const history =
    JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") ?? []

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

/* ---------------- INITIAL LOAD ---------------- */

export async function loadInitialState(): Promise<ParkingState> {

  // 1️⃣ primero mostrar lo local
  const local = loadLocalState()

  // 2️⃣ luego sincronizar con Supabase en segundo plano
  syncFromSupabase()

  return local
}

/* ---------------- SYNC REMOTO → LOCAL ---------------- */

export async function syncFromSupabase() {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("entry_timestamp", { ascending: false })

    if (error || !data) return

    const mapped: Vehicle[] = data.map(mapVehicle)

    const newState: ParkingState = {
      activeVehicles: mapped.filter((v) => v.exitTimestamp === null),
      history: mapped.filter((v) => v.exitTimestamp !== null),
    }

    saveLocalState(newState)
  } catch (err) {
    console.error("Supabase sync error", err)
  }
}

/* ---------------- INSERT VEHICLE ---------------- */

export async function addVehicle(vehicle: Vehicle) {

  const state = loadLocalState()

  const newState: ParkingState = {
    ...state,
    activeVehicles: [...state.activeVehicles, vehicle],
  }

  // UX instantánea
  saveLocalState(newState)

  // sync remoto async
  try {
    await supabase.from("vehicles").insert({
      original_plate: vehicle.originalPlate,
      type: vehicle.type,
      entry_timestamp: vehicle.entryTimestamp,
      is_active: true,
    })
  } catch (err) {
    console.error("Insert sync error", err)
  }
}

/* ---------------- UPDATE VEHICLE ---------------- */

export async function updateVehicle(vehicle: Vehicle) {

  const state = loadLocalState()

  const active = state.activeVehicles.filter((v) => v.id !== vehicle.id)

  const newState: ParkingState = {
    activeVehicles: active,
    history: [vehicle, ...state.history],
  }

  saveLocalState(newState)

  try {
    await supabase
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
  } catch (err) {
    console.error("Update sync error", err)
  }
}

/* ---------------- DELETE VEHICLE ---------------- */

export async function deleteVehicle(id: string) {

  const state = loadLocalState()

  const newState: ParkingState = {
    ...state,
    activeVehicles: state.activeVehicles.filter((v) => v.id !== id),
  }

  saveLocalState(newState)

  try {
    await supabase.from("vehicles").delete().eq("id", id)
  } catch (err) {
    console.error("Delete sync error", err)
  }
}