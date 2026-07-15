const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPTS = {
  event: `You are MEIH's AI event planning assistant for Tanzania. You help users plan events, choose vendors, manage budgets, and navigate the MEIH platform. You are knowledgeable about Tanzanian event culture, pricing (in TZS and USD), venues, catering, and logistics. Be helpful, concise, and friendly. When users ask about specific events on the platform, guide them to the relevant pages. Keep responses under 200 words unless more detail is requested.`,

  innovation: `You are MEIH's AI innovation coach for Tanzania. You help users develop innovation ideas, improve their submissions for MEIH competitions, understand competition rules, and prepare for judging. You are knowledgeable about innovation categories (Health, AgriTech, Education, AI, Climate, FinTech, Energy, Transport), OTP-verified voting, and the 10-criterion judging rubric. Be encouraging, practical, and helpful. Keep responses under 200 words unless more detail is requested.`,

  general: `You are MEIH's AI assistant. MEIH (MOFATE Event & Innovation Hub) is a Tanzanian platform with two main hubs: 1) Event Hub - connects clients with event planners and vendors for birthdays, weddings, corporate events, conferences, hackathons, etc. 2) Innovation Hub - lets innovators submit ideas, get public votes, and be judged in competitions. Be helpful, guide users to the right hub, and answer questions about platform features. Keep responses under 200 words unless more detail is requested.`,
};

let genAI = null;
let model = null;

function initGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set — AI assistant will use fallback responses');
    return;
  }
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

function getFallbackResponse(message, context) {
  const lower = message.toLowerCase();
  const responses = {
    event: {
      greeting: "Hello! I'm your MEIH event planning assistant. How can I help you plan your next event?",
      pricing: "Event categories on MEIH range from $15 (Birthday) to $250 (Awards Ceremony). You can use the Quick Estimate tool on the Event Hub landing page for a personalized quote.",
      vendors: "You can browse verified vendors on the Events page. Each vendor has ratings, portfolios, and pricing to help you compare.",
      payment: "MEIH supports mobile money payments. Your planner will provide their payment number — you send the payment and upload a screenshot for confirmation.",
      help: "I can help with: event planning, vendor selection, budget estimation, platform navigation, and payment guidance. What would you like to know?",
    },
    innovation: {
      greeting: "Hello! I'm your MEIH innovation coach. Ready to help you develop your next big idea!",
      voting: "Public voting on MEIH uses OTP verification to ensure fair results. Each person gets one vote per submission.",
      judging: "Innovations are judged on 10 criteria including novelty, feasibility, impact, scalability, and presentation. Check the Leaderboard for current rankings.",
      submission: "To submit an innovation, go to Submit Innovation and complete the 4-step wizard: Team & Category → The Innovation → Materials → Review & Submit.",
      help: "I can help with: innovation ideas, submission improvements, competition rules, voting, judging criteria, and platform navigation. What do you need?",
    },
    general: {
      greeting: "Welcome to MEIH! We have two hubs: Event Hub for planning events, and Innovation Hub for launching innovations. Which one interests you?",
      events: "The Event Hub connects you with planners and vendors for weddings, birthdays, corporate events, and more. Click 'Event Hub' to get started!",
      innovation: "The Innovation Hub lets you submit ideas, get public votes, and compete for recognition. Click 'Innovation Hub' to explore!",
      help: "I can help you navigate MEIH. We have an Event Hub for event planning and an Innovation Hub for innovation competitions. What would you like to do?",
    },
  };

  const contextResponses = responses[context] || responses.general;

  for (const [keyword, response] of Object.entries(contextResponses)) {
    if (lower.includes(keyword)) return response;
  }
  return contextResponses.help || contextResponses.greeting;
}

async function chat(message, context = 'general') {
  if (!model) {
    return {
      reply: getFallbackResponse(message, context),
      model: 'fallback',
    };
  }

  try {
    const systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general;
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I will follow these instructions and help the user accordingly.' }] },
      ],
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return {
      reply: response.text(),
      model: 'gemini-2.0-flash',
    };
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return {
      reply: getFallbackResponse(message, context),
      model: 'fallback',
      error: err.message,
    };
  }
}

module.exports = { initGemini, chat };
