SCRIPT:export_diseases_to_claude. js
// export_diseases_to_claude.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role (bypass RLS for export)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportDiseasesToClaude() {
  console.log('📡 Fetching diseases from Supabase...');
  
  const { data: diseases, error } = await supabase
    .from('diseases')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Supabase error:', error.message);
    process.exit(1);
  }

  if (!diseases || diseases.length === 0) {
    console.warn('⚠️ No diseases found in the table.');
    process.exit(0);
  }

  console.log(`✅ Fetched ${diseases.length} diseases.`);

  // Transform to Claude's expected format
  const claudeFormat = diseases.map(d => ({
    name: d.name,
    poultry_types: d.poultry_types,      // already array
    symptoms: d.symptoms,                // already array
    cause: d.cause,
    treatment: d.treatment,
    prevention: d.prevention,
    mortality_rate: d.mortality_rate,
    recommended_medicines: d.recommended_medicines || []  // fallback to empty array
  }));

  // Optional: wrap in { "diseases": ... } if you want the outer object
  const output = { diseases: claudeFormat };

  // Write to file
  const outputPath = path.join(__dirname, 'diseases_claude_export.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`💾 Exported to: ${outputPath}`);
  console.log(`📋 Copy the "diseases" array into Claude's system prompt.`);
}

exportDiseasesToClaude().catch(console.error);