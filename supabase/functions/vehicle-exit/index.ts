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
    const { vehicle_id, parking_id, custom_exit_time, payment_method } = body
    
    // Validar parking
    const { data: parking } = await supabase
      .from('parkings')
      .select('id, car_rate, motorcycle_rate, truck_rate')
      .eq('id', parking_id)
      .eq('user_id', user.id)
      .single()
    
    if (!parking) throw new Error("Parking not found")
    
    // Obtener vehículo
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .eq('parking_id', parking_id)
      .eq('user_id', user.id)
      .single()

    if (!vehicle) throw new Error("Vehicle not found")
    if (!vehicle.is_active) throw new Error("Vehicle already exited")

    //elegir la tarifa.
    let hourly_rate = 0
    if (vehicle.type === 'car') {
      hourly_rate = parking.car_rate
    } else if (vehicle.type === 'motorcycle') {
      hourly_rate = parking.motorcycle_rate
    } else if (vehicle.type === 'truck') {
      hourly_rate = parking.truck_rate
    }else {
      throw new Error("Invalid vehicle type")
    }

    
    // Validar payment_method
    if (!['cash', 'transfer'].includes(payment_method)) {
      throw new Error("Invalid payment method")
    }
    
    // Calcular tarifa
    const entryTime = new Date(vehicle.entry_timestamp)
    const exitTime = custom_exit_time ? new Date(custom_exit_time) : new Date()
    
    if (exitTime <= entryTime) {
      throw new Error("Exit time must be after entry")
    }
    
    const minutes = (exitTime.getTime() - entryTime.getTime()) / 60000
    const hoursCharged = Math.ceil(minutes / 60)
    const amountCharged = hoursCharged * hourly_rate
    
    // Actualizar vehículo
    const { data: updated, error: updateError } = await supabase
      .from('vehicles')
      .update({
        exit_timestamp: exitTime.toISOString(),
        total_minutes: Math.round(minutes),
        hours_charged: hoursCharged,
        amount_charged: amountCharged,
        payment_method,
        is_active: false
      })
      .eq('id', vehicle_id)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Actualizar métricas
    const today = new Date().toISOString().split('T')[0]
    
    const { data: existingMetrics } = await supabase
      .from('parking_metrics')
      .select('*')
      .eq('parking_id', parking_id)
      .eq('date', today)
      .single()
    
    if (existingMetrics) {
      await supabase
        .from('parking_metrics')
        .update({
          vehicles_exited: existingMetrics.vehicles_exited + 1,
          total_revenue: existingMetrics.total_revenue + amountCharged,
          cash_revenue: payment_method === 'cash' 
            ? existingMetrics.cash_revenue + amountCharged 
            : existingMetrics.cash_revenue,
          transfer_revenue: payment_method === 'transfer' 
            ? existingMetrics.transfer_revenue + amountCharged 
            : existingMetrics.transfer_revenue,
          updated_at: new Date().toISOString()
        })
        .eq('parking_id', parking_id)
        .eq('date', today)
    } else {
      await supabase
        .from('parking_metrics')
        .insert({
          parking_id,
          user_id: user.id,
          date: today,
          vehicles_exited: 1,
          total_revenue: amountCharged,
          cash_revenue: payment_method === 'cash' ? amountCharged : 0,
          transfer_revenue: payment_method === 'transfer' ? amountCharged : 0
        })
    }
    
    // Auditoria
    await supabase.from('audit_log').insert({
      user_id: user.id,
      parking_id,
      action: 'vehicle_exit',
      table_name: 'vehicles',
      record_id: vehicle_id,
      changes: { before: vehicle, after: updated }
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          hoursCharged,
          amountCharged,
          paymentMethod: payment_method,
          exitTime: exitTime.toISOString()
        }
      }),
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