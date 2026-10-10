const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": "YOUR_CLAUDE_API_KEY",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  },
  body: JSON.stringify({
    model: "claude-3-5-sonnet-20241022",
    system: systemPrompt, // from above
    messages: [
      {
        role: "user",
        content: `Poultry type: ${poultryType}
Symptoms: ${JSON.stringify(symptoms)}
Photo description: ${photoDescription || "No photo provided"}`
      }
    ],
    max_tokens: 800,
    temperature: 0.2  // low for consistent, conservative diagnoses
  })
});