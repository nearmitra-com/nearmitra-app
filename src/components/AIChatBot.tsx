import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const BASE_SYSTEM_PROMPT = `You are "FixBot" 🔧, the AI assistant for NearMitra ( NearMitra) — a trusted home services platform serving Mumbai and Pune, Maharashtra, India.

=== ABOUT NearMitra ===
- Website:  nearmitra.netlify.app
- Email: support@ nearmitra.in
- Phone/WhatsApp: +91 91521 06425
- Location: Mumbai & Pune, Maharashtra, India
- Support Hours: 7 AM – 10 PM, all 7 days a week

=== SERVICES & PRICES ===
1. ⚡ Electrician (इलेक्ट्रीशियन) — Starting from ₹199
2. 💧 Plumber (प्लंबर) — Starting from ₹199
3. 🔨 Carpenter (कारपेंटर / सुतार) — Starting from ₹249
4. 🎨 Painter (पेंटर / रंगारी) — Starting from ₹299
5. ❄️ AC Repair (एसी मरम्मत / एसी दुरुस्ती) — Starting from ₹349
6. ✨ Cleaning (सफाई / स्वच्छता) — Starting from ₹499

=== HOW BOOKING WORKS ===
Step 1: Visit the website → Click "Book Service"
Step 2: Fill Name, Phone, Address, Service Type, Problem, Preferred Time
Step 3: Choose time — Morning (9AM–12PM), Afternoon (12–4PM), Evening (4–8PM)
Step 4: Verified technician is assigned and arrives
Step 5: Pay ONLY after service is done ✅
Note: Final price confirmed after inspection — starting prices are minimums

=== KEY POLICIES ===
- ❌ NO advance payment — pay only after service
- ✅ All technicians are background-verified
- 📍 Technicians come to your location
- 📞 Support: +91 91521 06425 (Call or WhatsApp)
- 🕐 Available 7 AM – 10 PM, every day

=== BOOKING STATUS MEANINGS ===
- Pending: Booking received, technician being assigned
- Assigned: Technician assigned and coming to your location
- Completed: Service done successfully
- Cancelled: Booking was cancelled

=== WHO CAN USE NearMitra ===
- Customers: Book any home service, track booking status
- Providers/Technicians: Register via Provider Portal to receive jobs
- Admin: Manages bookings and providers

=== BOOKING ISSUE HANDLING ===
If a user mentions a problem with their booking OR wants to track it:
- Ask for their registered phone number if they haven't provided it
- Once phone is given, check their booking status from the data I provide
- Help resolve issues like delays, cancellations, or re-booking
- If unresolved, escalate: "Please call/WhatsApp us at +91 91521 06425"

=== TONE ===
- Friendly, warm, local — like a helpful neighbor
- SHORT responses with bullet points or emojis
- NEVER make up prices, services, or policies not listed above
- For unknown queries: "Please contact us at +91 91521 06425 (Call/WhatsApp)"`;

// Build a language-aware system prompt based on the app's selected language
function buildSystemPrompt(appLanguage: string): string {
  const languageInstructions: Record<string, string> = {
    en: `=== LANGUAGE RULES — CRITICAL ===
The user has selected ENGLISH as their app language.
- DEFAULT: Always reply in ENGLISH unless the user writes in a clearly different language.
- If user writes in Hindi (Devanagari script) → reply in Hindi.
- If user writes in Marathi (Devanagari) → reply in Marathi.
- If user writes HINGLISH (e.g. "booking kaise karein") → reply in ENGLISH (since English is selected).
- NEVER default to Hindi or Marathi when the message is in English.`,

    hi: `=== LANGUAGE RULES — CRITICAL ===
उपयोगकर्ता ने HINDI (हिंदी) भाषा चुनी है।
- डिफ़ॉल्ट: हमेशा हिंदी (देवनागरी) में जवाब दें, जब तक उपयोगकर्ता स्पष्ट रूप से दूसरी भाषा में न लिखे।
- अगर उपयोगकर्ता अंग्रेज़ी में लिखे → अंग्रेज़ी में जवाब दें।
- अगर उपयोगकर्ता मराठी में लिखे → मराठी में जवाब दें।
- HINGLISH (जैसे "mujhe plumber chahiye") → हिंदी (देवनागरी) में जवाब दें।
- कभी भी अंग्रेज़ी में डिफ़ॉल्ट न करें जब हिंदी चुनी गई हो।`,

    mr: `=== LANGUAGE RULES — CRITICAL ===
वापरकर्त्याने MARATHI (मराठी) भाषा निवडली आहे।
- डीफॉल्ट: नेहमी मराठी (देवनागरी) मध्ये उत्तर द्या, जोपर्यंत वापरकर्ता स्पष्टपणे दुसऱ्या भाषेत लिहित नाही.
- जर वापरकर्ता इंग्रजीत लिहित असेल → इंग्रजीत उत्तर द्या.
- जर वापरकर्ता हिंदीत लिहित असेल → हिंदीत उत्तर द्या.
- MARATHINGLISH (जसे "mala plumber hava") → मराठी (देवनागरी) मध्ये उत्तर द्या.
- निवडलेली भाषा मराठी असताना हिंदी किंवा इंग्रजीत डीफॉल्ट करू नका.`,
  };

  const langRule = languageInstructions[appLanguage] ?? languageInstructions['en'];
  return `${BASE_SYSTEM_PROMPT}\n\n${langRule}`;
}

// Booking phone-ask messages per language
const PHONE_ASK: Record<string, string> = {
  en: '📱 Sure! To check your booking status, please share your **registered phone number** (the one used while booking).',
  hi: '📱 ज़रूर! आपकी बुकिंग की स्थिति जानने के लिए, कृपया अपना **रजिस्टर्ड मोबाइल नंबर** (बुकिंग के समय उपयोग किया गया) दें।',
  mr: '📱 नक्कीच! तुमची बुकिंग स्थिती तपासण्यासाठी, कृपया **नोंदणीकृत मोबाइल नंबर** (बुकिंग वेळी वापरलेला) सांगा।',
};

const PHONE_NOT_FOUND: Record<string, string> = {
  en: "🔢 I couldn't find a valid phone number. Please share your 10-digit mobile number (e.g., 9876543210).",
  hi: '🔢 मुझे कोई वैध फोन नंबर नहीं मिला। कृपया अपना 10 अंकों का मोबाइल नंबर दें (जैसे: 9876543210)।',
  mr: '🔢 मला वैध फोन नंबर सापडला नाही। कृपया तुमचा 10 अंकी मोबाइल नंबर द्या (उदा: 9876543210)।',
};

// ── Booking lookup via Supabase ──────────────────────
async function fetchBookingByPhone(phone: string): Promise<string> {
  // Normalize phone: strip spaces, dashes
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      customer_name,
      customer_phone,
      status,
      address,
      description,
      preferred_time,
      created_at,
      services ( name_en )
    `)
    .or(`customer_phone.eq.${cleanPhone},customer_phone.eq.${phone}`)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error || !data || data.length === 0) {
    return `NO_BOOKING_FOUND:${phone}`;
  }

  const bookingLines = data.map((b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceName = (b.services as any)?.name_en ?? 'Unknown';
    const date = new Date(b.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    return `• ${serviceName} | Status: ${b.status.toUpperCase()} | Booked on: ${date} | Time: ${b.preferred_time ?? 'Not specified'}`;
  });

  return `BOOKING_DATA_FOR:${phone}\n${bookingLines.join('\n')}`;
}

// ── Extract phone numbers from text ─────────────────
function extractPhone(text: string): string | null {
  const match = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
  return match ? match[0] : null;
}

// ── Detect if user is asking about a booking ─────────
function isBookingQuery(text: string): boolean {
  const keywords = [
    'booking', 'track', 'status', 'order', 'kahan', 'kab',
    'when', 'where', 'technician', 'provider', 'aaya', 'nahi aaya',
    'problem', 'issue', 'complaint', 'cancel', 'delay', 'late',
    'kitni der', 'bhi nahi', 'abhi tak', 'still', 'not come',
    'बुकिंग', 'स्टेटस', 'कब', 'कहाँ', 'समस्या', 'शिकायत',
  ];
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export const AIChatBot = () => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingPhone, setAwaitingPhone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const callGroq = useCallback(async (
    chatMessages: Message[],
    extraSystemContext?: string
  ): Promise<string> => {
    const systemPrompt = buildSystemPrompt(language);
    const systemContent = extraSystemContext
      ? `${systemPrompt}\n\n=== LIVE BOOKING DATA ===\n${extraSystemContext}`
      : systemPrompt;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemContent },
          ...chatMessages.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', response.status, err);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('No response from AI');
    return text;
  }, [language]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage: Message = { role: 'user', content: userText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      let extraContext: string | undefined;

      // Check if user provided a phone number (booking lookup)
      const phone = extractPhone(userText);
      if (phone) {
        setAwaitingPhone(false);
        const bookingData = await fetchBookingByPhone(phone);
        if (bookingData.startsWith('NO_BOOKING_FOUND')) {
          extraContext = `No booking found for phone number ${phone}. Tell the user no bookings were found for this number and ask them to double-check or contact support.`;
        } else {
          extraContext = bookingData;
        }
      } else if (isBookingQuery(userText) && !awaitingPhone) {
        // Ask for phone number first
        setAwaitingPhone(true);
        const askPhone: Message = {
          role: 'assistant',
          content: PHONE_ASK[language] ?? PHONE_ASK['en'],
        };
        setMessages([...newMessages, askPhone]);
        setIsLoading(false);
        return;
      } else if (awaitingPhone) {
        // User replied but no phone found — prompt again
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: PHONE_NOT_FOUND[language] ?? PHONE_NOT_FOUND['en'],
          },
        ]);
        setIsLoading(false);
        return;
      }

      const aiText = await callGroq(newMessages, extraContext);
      setMessages([...newMessages, { role: 'assistant', content: aiText }]);

      // Reset awaitingPhone after successful booking lookup
      if (phone) setAwaitingPhone(false);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: t('chatError') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all hover:scale-110',
          isOpen && 'hidden'
        )}
        aria-label={t('chatWithUs')}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[350px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-10rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <span className="font-semibold block leading-tight">{t('aiAssistant')}</span>
                <span className="text-xs opacity-75">EN | हिंदी | मराठी</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-primary-foreground/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-6">
                <Bot className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                <p className="text-sm font-medium">{t('chatWelcome')}</p>
                <p className="text-xs mt-1 opacity-70">Ask in English, हिंदी or मराठी</p>
                <div className="mt-3 flex flex-col gap-1">
                  {['What services do you offer?', 'Booking kaise karein?', 'Track my booking'].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full px-3 py-1 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex gap-2',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1 items-center">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={awaitingPhone ? 'Enter your phone number...' : t('typeMessage')}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
