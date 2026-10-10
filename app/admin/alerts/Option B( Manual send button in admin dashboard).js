<Button onClick={async () => {
  await fetch('/api/send-sms', { 
    method: 'POST', 
    body: JSON.stringify({ alertId: alert.id })
  })
}}>
  Send SMS Now
</Button>