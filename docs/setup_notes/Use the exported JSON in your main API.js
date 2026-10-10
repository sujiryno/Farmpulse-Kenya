// Inside your predictor edge function or Next.js API route
const { data: config } = await supabase
  .from('app_config')
  .select('value')
  .eq('key', 'claude_disease_library')
  .single();

const diseaseLibrary = config?.value ? JSON.parse(config.value) : [];

// Build system prompt dynamically
const systemPrompt = `You are PoultryDoc AI...
## Your Knowledge Base (Disease Library)
${JSON.stringify(diseaseLibrary)}  // <-- injects always-fresh data

... rest of prompt ...`;