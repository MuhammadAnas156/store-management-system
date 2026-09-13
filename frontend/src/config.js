// Centralized API base URL.
// Reads from Vite env variable VITE_API_URL (set in .env or in Vercel dashboard).
// Falls back to localhost for local development if the env variable isn't set.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";