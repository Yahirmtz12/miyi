// ✅ Forma correcta en Vite
let url = import.meta.env.VITE_API_URL || 'http://localhost:3000';
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.endsWith('/api')) url = url.slice(0, -4);

export const API_URL = url;