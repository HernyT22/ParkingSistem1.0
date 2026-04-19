import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) throw new Error("No authorization header")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    )

    if (!user) throw new Error("Invalid token")

    const body = await req.json()
    const { parking_id, plate, vehicle_type } = body

    // VALIDACIONES INICIALES
    if (!plate) throw new Error("Plate is required")

    const cleanPlate = plate.trim().toUpperCase()

    if (!['car', 'motorcycle', 'truck'].includes(vehicle_type)) {
      throw new Error("Invalid vehicle type")
    }

    const plateRegex = /^[A-Z]{2,3}-?\d{3,4}$/
    if (!plateRegex.test(cleanPlate)) {
      throw new Error("Invalid plate format")
    }

    // Validar que parking pertenece al usuario
    const { data: parking } = await supabase
      .from("parkings")
      .select("id, user_id, total_spaces")
      .eq("id", parking_id)
      .eq("user_id", user.id)
      .single()

    if (!parking) {
      throw new Error("Parking not found or unauthorized")
    }

    // Validar que no esté duplicado en este parking
    const { data: existing } = await supabase
      .from("vehicles")
      .select("id")
      .eq("parking_id", parking_id)
      .eq("original_plate", cleanPlate)
      .eq("is_active", true)

    if (existing && existing.length > 0) {
      throw new Error("Vehicle already parked in this parking")
    }

    // Validar capacidad
    const { count: activeCount } = await supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("parking_id", parking_id)
      .eq("is_active", true)

    if ((activeCount || 0) >= parking.total_spaces) {
      throw new Error("Parking full")
    }

    // Insertar vehículo
    const { data: newVehicle, error: insertError } = await supabase
      .from("vehicles")
      .insert({
        parking_id,
        user_id: user.id,
        original_plate: cleanPlate,
        type: vehicle_type,
        entry_timestamp: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Auditoria
    await supabase.from("audit_log").insert({
      user_id: user.id,
      parking_id,
      action: "vehicle_entry",
      table_name: "vehicles",
      record_id: newVehicle.id,
      changes: { before: null, after: newVehicle }
    })

    return new Response(
      JSON.stringify({ success: true, data: newVehicle }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})

