# FarmPulse Kenya

**AI-Powered Poultry Health & Farm Management Platform for Kenyan Farmers**

## 📌 Problem Statement

Kenyan poultry farmers lose significant flock value to preventable diseases due to:
- Late or inaccurate diagnosis
- Opaque feed and medicine prices
- Uneven access to veterinary services
- Missed vaccination schedules

## 💡 Solution

FarmPulse Kenya is a mobile-first web application that combines:
- AI-powered disease diagnosis (Claude API)
- Real-time feed & medicine price comparison
- Veterinary directory access
- SMS/push vaccination reminders
- M-Pesa monetisation via daily passes

## 🎯 Target Users

Small- to medium-scale poultry farmers in Kenya (broilers, layers, kienyeji).

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI | Claude API (claude-sonnet-4-6) |
| Payments | Safaricom M-Pesa Daraja API |
| SMS | Africa's Talking |
| Hosting | Vercel (frontend), Supabase (backend) |
| Mobile | Capacitor / Expo (for APK) |

## 🧩 Core Features (MVP)

1. Farmer Registration (phone + OTP)
2. AI Disease Predictor (symptom checklist + photo)
3. Disease Library (20+ diseases)
4. Daily Health Tips
5. Feed & Medicine Prices (crowdsourced)
6. M-Pesa Daily Pass
7. Vet Directory
8. Vaccination Reminders
9. Profit Calculator
10. Admin Dashboard

## 📁 Project Structure
