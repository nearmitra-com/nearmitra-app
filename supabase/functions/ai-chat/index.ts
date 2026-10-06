import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ──────────────────────────────────────────
// Fetch real data from Supabase (RAG context)
// ──────────────────────────────────────────
async function fetch NearMitraContext() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch active services with pricing
  const { data: services } = await supabase
    .from("services")
    .select("name_en, starting_price")
    .eq("is_active", true)
    .order("name_en");

  // Fetch total active providers count
  const { count: providerCount } = await supabase
    .from("provider_profiles")
    .select("*", { count: "exact", head: true });

  // Fetch pending bookings count (so agent knows how busy)
  const { count: pendingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Build service list string
  const serviceList = services
    ? services.map((s) => `  - ${s.name_en}: Starting from ₹${s.starting_price}`).join("\n")
    : "  - Services unavailable right now";

  return `
=== REAL-TIME LOCALFIX DATA ===

📋 Available Services (Live from database):
${serviceList}

👷 Verified Providers on Platform: ${providerCount ?? "Multiple"}
📅 Current Pending Bookings: ${pendingCount ?? 0}

=== END OF REAL-TIME DATA ===
`;
}

// ──────────────────────────────────────────
// Call Google Gemini API (Free)
// ──────────────────────────────────────────
async function callGemini(systemPrompt: string, messages: { role: string; content: string }[]) {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

  // Convert messages to Gemini format
  const geminiMessages = messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: geminiMessages,
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Gemini error:", response.status, err);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini");
  return text;
}

// ──────────────────────────────────────────
// Main Edge Function
// ──────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log("RAG Agent: Processing", messages.length, "messages");

    // Step 1: Fetch real-time context from DB
    const ragContext = await fetch NearMitraContext();
    console.log("RAG context fetched successfully");

    // Step 2: Build smart system prompt with real data injected
    const systemPrompt = `You are "FixBot" 🔧, the smart AI assistant for  NearMitra — a trusted home services platform in Pune, India.

${ragContext}

=== YOUR ROLE ===
You help customers with:
✅ Finding the right service and pricing
✅ Explaining how booking works
✅ Answering questions about services
✅ Handling complaints politely
✅ Providing accurate, up-to-date info (always use the REAL-TIME DATA above)

=== HOW BOOKING WORKS ===
1. Customer visits  nearmitra.netlify.app
2. Clicks "Book Service"
3. Fills name, phone, address, service type
4. A verified technician arrives at their location
5. Payment is made ONLY after service is done ✅

=== KEY POLICIES ===
- NO advance payment required
- All technicians are background-verified
- Support hours: 7 AM – 10 PM, all 7 days
- Contact: +91 9152106425 (Call/WhatsApp)
- Final price confirmed after inspection (starting prices are minimums)

=== TONE & LANGUAGE ===
- Be friendly, warm and local — like talking to a helpful neighbor
- Keep responses SHORT and easy to read (use bullet points)
- You can reply in Hindi, Marathi or English — match the user's language
- If you don't know something, say "Please contact us at +91 9152106425"

IMPORTANT: Always use the real-time service data provided above — never make up prices or services.`;

    // Step 3: Get AI response
    const aiResponse = await callGemini(systemPrompt, messages);
    console.log("Gemini response received");

    // Step 4: Return as SSE stream (to match existing frontend)
    const sseData = `data: ${JSON.stringify({
      choices: [{ delta: { content: aiResponse } }],
    })}\n\ndata: [DONE]\n\n`;

    return new Response(sseData, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("RAG Agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
