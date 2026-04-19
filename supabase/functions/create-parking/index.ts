import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) throw new Error("No authorization")
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )
    
    // Verificar usuario
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    )
    if (!user) throw new Error("Invalid token")
    
    // Validar entrada
    const body = await req.json()
    const { 
      name, total_spaces, car_rate, motorcycle_rate, truck_rate, location, description} = body    
        
      if (!name || !total_spaces || !car_rate || !motorcycle_rate || !truck_rate) {
        throw new Error("Missing required fields")
      }

      const cleanName = name.trim()
      if (cleanName.length < 3) {
        throw new Error("Parking name must have at least 3 characters")
      }

      if (cleanName.length > 50) {
        throw new Error("Parking name cannot exceed 50 characters")
      }

      const cleanDescription = description?.trim() || ""
      if(cleanDescription.length < 3) {
        throw new Error("Parking description must have at least 3 characters")
      }
      if (cleanDescription.length > 150) {
        throw new Error("Parking description cannot exceed 150 characters")
      }

      const cleanLocation = location?.trim() || ""
      if (cleanLocation.length < 3) {
        throw new Error("Parking location must have at least 3 characters")
      }
      if (cleanLocation.length > 50) {
        throw new Error("Parking location cannot exceed 50 characters")
      }

      if (typeof total_spaces !== 'number' || total_spaces < 1) {
        throw new Error("Invalid total_spaces (must be > 0)")
      }
      if (typeof car_rate !== 'number' || car_rate <= 0) {
        throw new Error("Invalid car_rate (must be > 0)")
      }
      if (typeof motorcycle_rate !== 'number' || motorcycle_rate < 0) {
        throw new Error("Invalid motorcycle_rate (must be > 0)")
      }
      if (typeof truck_rate !== 'number' || truck_rate < 0) {
        throw new Error("Invalid truck_rate (must be > 0)")
      }

    //Validr exixztencia
    const { data: existing } = await supabase
      .from("parkings")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", cleanName)
      .maybeSingle()

    if (existing) {
      throw new Error("Parking with this name already exists")
    }
    // Crear parking
    const { data: newParking, error } = await supabase
      .from('parkings')
      .insert({
        user_id: user.id,
        name: cleanName,
        total_spaces,
        car_rate, motorcycle_rate, truck_rate,
        location: cleanLocation || null,
        description: cleanDescription || null
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Registrar en auditoria
    await supabase.from('audit_log').insert({
      user_id: user.id,
      parking_id: newParking.id,
      action: 'parking_created',
      table_name: 'parkings',
      record_id: newParking.id,
      changes: { before: null, after: newParking }
    })
    
    return new Response(
      JSON.stringify({ success: true, data: newParking }),
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