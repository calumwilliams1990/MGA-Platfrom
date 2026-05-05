import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This edge function seeds the zip_risk_grades table with data from the rater
// ZIP data extracted from Terror_OPAL_Liability_v1.5-2.xlsm 'zips' tab
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Require authenticated caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { zipData } = await req.json()

    if (!zipData || !Array.isArray(zipData)) {
      return new Response(
        JSON.stringify({ error: 'zipData array required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate rows
    const validGrades = ['A', 'B', 'C', 'D', 'E']
    const invalidRows = zipData.filter((row: any) =>
      !row?.zip_code || !row?.risk_grade || !validGrades.includes(row.risk_grade)
    )
    if (invalidRows.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid data format', invalid: invalidRows.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`User ${user.id} importing ${zipData.length} ZIP codes...`)

    // Insert in batches of 500
    const batchSize = 500
    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < zipData.length; i += batchSize) {
      const batch = zipData.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from('zip_risk_grades')
        .upsert(batch, { onConflict: 'zip_code' })
      
      if (error) {
        console.error(`Batch ${i}-${i + batch.length} error:`, error)
        failedCount += batch.length
      } else {
        successCount += batch.length
        console.log(`Inserted batch ${i}-${i + batch.length}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: successCount, 
        failed: failedCount,
        total: zipData.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})