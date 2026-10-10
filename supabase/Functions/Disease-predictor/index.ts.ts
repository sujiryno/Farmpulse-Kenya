// supabase/functions/disease-predictor/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022' // or claude-sonnet-4-6 if available

// CORS headers for web app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Helper: check if farmer has daily pass active
async function hasActiveDailyPass(supabase: any, farmerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('daily_passes')
    .select('expires_at')
    .eq('farmer_id', farmerId)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle()
  
  if (error || !data) return false
  return new Date(data.expires_at) > new Date()
}

// Helper: get today's session count for farmer
async function getTodaySessionCount(supabase: any, farmerId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD in UTC
  const { count, error } = await supabase
    .from('predictor_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('farmer_id', farmerId)
    .gte('created_at', today)
    .lt('created_at', `${today}T23:59:59.999Z`)
  
  if (error) return 0
  return count || 0
}

// Helper: record session and return daily usage left
async function recordSession(
  supabase: any, 
  farmerId: string, 
  symptoms: string[], 
  photoUrl: string | null, 
  resultJson: any
): Promise<{ usedToday: number, remainingFree: number }> {
  // Insert session
  await supabase.from('predictor_sessions').insert({
    farmer_id: farmerId,
    date: new Date().toISOString().split('T')[0],
    photo_url: photoUrl,
    symptoms: symptoms,
    result_json: resultJson,
    created_at: new Date().toISOString()
  })
  
  // Get updated count
  const usedToday = await getTodaySessionCount(supabase, farmerId)
  const remainingFree = Math.max(0, 2 - usedToday)
  return { usedToday, remainingFree }
}

// Helper: call Claude API with optional vision
async function callClaude(
  systemPrompt: string,
  userMessage: string,
  imageBase64?: string
): Promise<any> {
  const messages: any[] = [{ role: 'user', content: [] }]
  
  // Add text
  messages[0].content.push({ type: 'text', text: userMessage })
  
  // Add image if provided (vision)
  if (imageBase64) {
    messages[0].content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: imageBase64
      }
    })
  }
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      system: systemPrompt,
      messages: messages,
      max_tokens: 800,
      temperature: 0.2
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }
  
  const data = await response.json()
  // Extract JSON from Claude's response (assumes it returns pure JSON)
  const content = data.content[0].text
  return JSON.parse(content)
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  try {
    // Parse request body
    const body = await req.json()
    const { 
      phoneNumber,        // farmer's phone number (unique identifier)
      poultryType,        // 'broiler', 'layer', 'kienyeji'
      symptoms,           // string[]
      photoBase64,        // optional, base64 string (without data:image prefix)
      photoMimeType = 'image/jpeg'
    } = body
    
    // Validation
    if (!phoneNumber || !poultryType || !symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: phoneNumber, poultryType, symptoms (array)' 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    // Initialize Supabase (service role to bypass RLS for internal checks)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // 1. Get farmer record by phone
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('id')
      .eq('phone', phoneNumber)
      .single()
    
    if (farmerError || !farmer) {
      return new Response(JSON.stringify({ error: 'Farmer not found. Please register first.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const farmerId = farmer.id
    
    // 2. Check if farmer has active daily pass
    const hasPass = await hasActiveDailyPass(supabase, farmerId)
    
    let canProceed = false
    let sessionInfo = null
    
    if (hasPass) {
      canProceed = true
    } else {
      // Check free session count
      const usedToday = await getTodaySessionCount(supabase, farmerId)
      if (usedToday < 2) {
        canProceed = true
        sessionInfo = { usedToday, remainingFree: 2 - usedToday }
      } else {
        return new Response(JSON.stringify({
          error: 'FREE_LIMIT_REACHED',
          message: 'You have used your 2 free sessions today. Please purchase a daily pass.',
          remainingFree: 0,
          paywall: true
        }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }
    
    if (!canProceed) {
      // Should not happen, but safety
      return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    // 3. Fetch disease library from app_config (dynamic system prompt)
    const { data: config, error: configError } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'claude_disease_library')
      .single()
    
    if (configError || !config) {
      console.error('Failed to fetch disease library:', configError)
      return new Response(JSON.stringify({ error: 'Disease library not available. Please try later.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const diseaseLibrary = JSON.parse(config.value)
    
    // 4. Build system prompt (same as earlier but inject library)
    const systemPrompt = `You are PoultryDoc AI, an expert veterinary diagnostician for Kenyan poultry farmers. Your only job is to diagnose possible diseases in chickens (broilers, layers, kienyeji) based on the farmer's symptom checklist selections and an optional uploaded photo of the sick bird.

## Your Knowledge Base (Disease Library)
You have been provided with a structured library of common poultry diseases in Kenya. Use ONLY this library to generate diagnoses. Do not invent diseases outside this library.

${JSON.stringify(diseaseLibrary, null, 2)}

## Input Format
You will receive:
1. poultry_type: one of ["broiler", "layer", "kienyeji"]
2. symptoms: a list of symptom strings selected by the farmer
3. photo_description: (optional) description of uploaded photo. If no photo, this field is empty.

## Rules for Diagnosis
- Return exactly the TOP 3 most probable diseases from the library that match the poultry type and symptoms.
- If fewer than 3 diseases match above a 30% confidence threshold, return only those (1 or 2).
- If zero diseases match with confidence >30%, return an empty array and suggest a vet consult.
- Confidence score must be an integer between 0 and 100.
- Be conservative: do not over-diagnose rare diseases unless symptoms strongly match.
- For each disease, provide: symptom_match_summary (2-3 sentences), recommended_medicines (list, max 3), preventive_advice.

## Output Format (JSON only)
Return valid JSON. No extra text, no markdown.

{
  "diagnoses": [
    {
      "disease_name": "Newcastle Disease",
      "confidence": 85,
      "symptom_match_summary": "The bird shows twisted neck, laboured breathing, and greenish diarrhoea...",
      "recommended_medicines": ["Newcastle vaccine (LaSota)", "Electrolyte supplements"],
      "preventive_advice": "Vaccinate all birds at 1 day, 21 days, and 8 weeks..."
    }
  ]
}

If no match: { "diagnoses": [] }

## Important Constraints
- Never recommend treatments illegal or unavailable in Kenya.
- Include disclaimer: "This is an AI-generated suggestion. Always consult a licensed veterinarian for a definitive diagnosis."
- If photo indicates severe suffering, append URGENT flag suggesting immediate vet contact.
- Keep language simple.`
    
    // 5. Build user message
    let photoDescription = "No photo provided"
    let cleanedPhotoBase64 = null
    
    if (photoBase64) {
      // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
      cleanedPhotoBase64 = photoBase64.replace(/^data:image\/\w+;base64,/, '')
      photoDescription = "Farmer uploaded a photo. The AI vision will analyse it."
    }
    
    const userMessage = `Poultry type: ${poultryType}
Symptoms: ${JSON.stringify(symptoms)}
Photo description: ${photoDescription}`
    
    // 6. Call Claude
    let claudeResult
    try {
      claudeResult = await callClaude(
        systemPrompt,
        userMessage,
        cleanedPhotoBase64 || undefined
      )
    } catch (claudeError) {
      console.error('Claude call failed:', claudeError)
      return new Response(JSON.stringify({ error: 'AI diagnosis failed. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 7. Record session in database
    const photoUrl = null // In MVP you'd store the uploaded photo in Supabase Storage and save URL
    const sessionResult = await recordSession(
      supabase,
      farmerId,
      symptoms,
      photoUrl,
      claudeResult
    )
    
    // 8. Return diagnosis + usage info
    return new Response(JSON.stringify({
      success: true,
      diagnoses: claudeResult.diagnoses || [],
      usage: {
        usedToday: sessionResult.usedToday,
        remainingFree: sessionResult.remainingFree,
        hasActivePass: hasPass
      },
      disclaimer: "This is an AI-generated suggestion. Always consult a licensed veterinarian for a definitive diagnosis."
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})