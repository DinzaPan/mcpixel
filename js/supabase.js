// Configuración de Supabase
const SUPABASE_URL = 'https://dgmsyuzxsvjfkjdyecer.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbXN5dXp4c3ZqZmtqZHllY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjI5OTUsImV4cCI6MjA3OTEzODk5NX0._SQAuzRejAi-tghTh8hTk_dvaZooEMZBbHAQw4hyA3I';

// Inicializar Supabase solo si la librería está disponible
let supabase;
if (typeof supabaseClient !== 'undefined') {
    supabase = window.supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('Supabase client no está disponible');
}