import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vzxfiipofyprfsgortbw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGZpaXBvZnlwcmZzZ29ydGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTEyMjQsImV4cCI6MjA2MjIyNzIyNH0.BP23OjkNdlr9-10iGEQfnYrq2d9rxFx8heSBbUXOT7c';

export const supabase = createClient(supabaseUrl, supabaseKey);
