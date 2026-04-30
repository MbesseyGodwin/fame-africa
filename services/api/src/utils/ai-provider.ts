import axios from 'axios';
import { logger } from './logger';

export interface AiStrategyInput {
  participantName: string;
  cycleName: string;
  totalVotes: number;
  todayVotes: number;
  yesterdayVotes: number;
  averageVotes: number;
  daysRemaining: number;
  tone: 'coach' | 'manager';
  maxWords?: number;
}

export async function getAiAdvice(input: AiStrategyInput): Promise<string> {
  const { participantName, tone, totalVotes, todayVotes, daysRemaining } = input;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfToken = process.env.HF_TOKEN;

  const dayOfWeek = new Date().getDay();
  let providerOrder: ('groq' | 'huggingface' | 'gemini')[] = ['groq', 'huggingface', 'gemini'];
  
  if (dayOfWeek === 2 || dayOfWeek === 4) providerOrder = ['huggingface', 'groq', 'gemini'];
  else if (dayOfWeek === 0 || dayOfWeek === 6) providerOrder = ['gemini', 'groq', 'huggingface'];

  const prompt = `You are a professional talent manager for FameAfrica. 
  Write a high-impact campaign strategy for ${participantName}.
  Context: ${totalVotes} votes total, ${todayVotes} today, Rank #${input.averageVotes || 'N/A'}, ${daysRemaining} days left.
  Tone: ${tone}. 
  
  CONSTRAINT: Total length must be under ${input.maxWords || 250} words.
  
  FORMAT: 
  1. One short summary paragraph (max 2 sentences).
  2. Followed by 3 sharp, actionable bullet points (start each with •).
  
  Focus on mobilization and fan engagement.`;

  for (const provider of providerOrder) {
    try {
      if (provider === 'groq' && groqKey) {
        logger.info(`[Waterfall-Advice] Trying Groq for ${participantName}`);
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }] },
          { headers: { Authorization: `Bearer ${groqKey}` }, timeout: 5000 }
        );
        const advice = response.data?.choices?.[0]?.message?.content;
        if (advice) return advice.trim();
      }

      if (provider === 'huggingface' && hfToken) {
        logger.info(`[Waterfall-Advice] Trying Hugging Face for ${participantName}`);
        const response = await axios.post(
          'https://router.huggingface.co/v1/chat/completions',
          { model: 'meta-llama/Llama-3.3-70B-Instruct', messages: [{ role: 'user', content: prompt }] },
          { headers: { Authorization: `Bearer ${hfToken}` }, timeout: 5000 }
        );
        const advice = response.data?.choices?.[0]?.message?.content;
        if (advice) return advice.trim();
      }

      if (provider === 'gemini' && geminiKey) {
        logger.info(`[Waterfall-Advice] Trying Gemini for ${participantName}`);
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          { contents: [{ parts: [{ text: prompt }] }] },
          { timeout: 5000 }
        );
        const advice = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (advice) return advice.trim();
      }
    } catch (error: any) {
      logger.warn(`[Waterfall-Advice] ${provider} failed: ${error.message}`);
      continue;
    }
  }

  return generateMockAdvice(input);
}

/**
 * Generates a professional competition bio for a participant.
 * Implements a 7-day rotation across different free providers/models to manage quotas.
 */
export async function generateAiBio(name: string, draftBio: string, maxWords: number = 80): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfToken = process.env.HF_TOKEN;
  
  const dayOfWeek = new Date().getDay();
  
  // Define preferred provider order based on the day to balance load
  let providerOrder: ('groq' | 'huggingface' | 'gemini')[] = ['groq', 'huggingface', 'gemini'];
  
  if (dayOfWeek === 2 || dayOfWeek === 4) {
    providerOrder = ['huggingface', 'groq', 'gemini']; // Priority to HF on Tue/Thu
  } else if (dayOfWeek === 0 || dayOfWeek === 6) {
    providerOrder = ['gemini', 'groq', 'huggingface']; // Priority to Gemini on Weekends
  }

  for (const provider of providerOrder) {
    try {
      if (provider === 'groq' && groqKey) {
        logger.info(`[Waterfall] Trying Groq for ${name}`);
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: `PR Agent for FameAfrica. Write a competition bio. Max ${maxWords} words. Ambitious tone. No emojis.` },
              { role: 'user', content: `Name: ${name}. Context: ${draftBio || 'Rising star'}` }
            ]
          },
          { headers: { Authorization: `Bearer ${groqKey}` }, timeout: 5000 }
        );
        const bio = response.data?.choices?.[0]?.message?.content;
        if (bio) return bio.trim();
      }

      if (provider === 'huggingface' && hfToken) {
        logger.info(`[Waterfall] Trying Hugging Face for ${name}`);
        const response = await axios.post(
          'https://router.huggingface.co/v1/chat/completions',
          {
            model: 'meta-llama/Llama-3.3-70B-Instruct',
            messages: [
              { role: 'system', content: `PR Agent for FameAfrica. Write a competition bio. Max ${maxWords} words. Ambitious tone. No emojis.` },
              { role: 'user', content: `Name: ${name}. Context: ${draftBio || 'Rising star'}` }
            ]
          },
          { headers: { Authorization: `Bearer ${hfToken}` }, timeout: 5000 }
        );
        const bio = response.data?.choices?.[0]?.message?.content;
        if (bio) return bio.trim();
      }

      if (provider === 'gemini' && geminiKey) {
        logger.info(`[Waterfall] Trying Gemini for ${name}`);
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            contents: [{ parts: [{ text: `PR Agent for FameAfrica: Write a 2-paragraph competition bio for ${name}. Context: ${draftBio}. Max ${maxWords} words. Tone: Ambitious.` }] }]
          },
          { timeout: 5000 }
        );
        const bio = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (bio) return bio.trim();
      }
    } catch (error: any) {
      logger.warn(`[Waterfall] ${provider} failed, moving to next provider. Error: ${error.message}`);
      continue;
    }
  }

  // --- HIGH QUALITY TEMPLATE FALLBACK ---
  logger.info(`[Rotation] Using Template Engine for ${name}'s bio`);
  
  const intros = [
    `${name} is a vibrant force of nature, ready to take the FameAfrica stage by storm.`,
    `Hailing from the heart of the continent, ${name} brings a unique blend of passion and rhythm to the competition.`,
    `With a voice that echoes the spirit of Africa, ${name} is here to prove that dreams have no boundaries.`,
    `Meet ${name}, the rising star who is redefining what it means to be a modern African talent.`
  ];

  const middles = [
    `Driven by a lifelong dream to share their art with the world, they have spent years honing their craft and building a community of loyal supporters.`,
    `Their journey to FameAfrica is fueled by an unwavering belief in the power of music and the resilience of the African spirit.`,
    `Combining traditional influences with a modern edge, they create a sound that is both deeply rooted and globally relevant.`,
    `For ${name}, this competition is more than just a trophy—it's a platform to inspire the next generation of African creators.`
  ];

  const outros = [
    `Now, ${name} needs your support to reach the finish line. Join the movement, become a Stan, and let's make history together!`,
    `Every vote for ${name} is a vote for authentic talent and the future of African entertainment. Don't wait—cast your vote today!`,
    `Are you ready to Stan a winner? Support ${name} as they climb the leaderboard and claim their place among the legends.`,
    `Your votes are the fuel for ${name}'s journey. Let's show the world what happens when Africa stands behind its own.`
  ];

  const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return `${getRandom(intros)}\n\n${getRandom(middles)} ${getRandom(outros)}`;
}

function generateMockAdvice(input: AiStrategyInput): string {
  const {
    participantName,
    totalVotes,
    todayVotes,
    yesterdayVotes,
    averageVotes,
    daysRemaining,
    tone,
  } = input;

  const trend = todayVotes >= yesterdayVotes ? 'positive' : 'negative';
  const versusAverage = todayVotes >= averageVotes ? 'high' : 'low';

  const intro = tone === 'manager' 
    ? `Listen, ${participantName}, we need to talk numbers for ${input.cycleName}.`
    : `Hey ${participantName}! Great to see your progress in ${input.cycleName}.`;

  let body = '';

  if (trend === 'positive' && versusAverage === 'high') {
    body = tone === 'manager'
      ? `Your momentum is excellent. You're outperforming the average by ${Math.round(todayVotes - averageVotes)} votes today. This is the time to double down on your Stan club engagement.`
      : `You're absolutely crushing it! Your growth today is higher than yesterday and significantly above the competition average. Keep that energy up!`;
  } else if (trend === 'negative' && versusAverage === 'low') {
    body = tone === 'manager'
      ? `The numbers are slipping. You're below the daily average and your trend is downward. We need a major push on social media in the next 24 hours.`
      : `It looks like today has been a bit slow. Don't let it get you down! You have ${daysRemaining} days left to climb back up. Try sharing your campaign card at a different time today.`;
  } else {
    body = `You're holding steady with ${totalVotes} total votes. With ${daysRemaining} days left in the cycle, consistency is your best friend.`;
  }

  const closing = tone === 'manager'
    ? `Get back out there and mobilize your fans. Time is money.`
    : `You've got this! Your fans are waiting to hear from you.`;

  return `${intro} ${body} ${closing}`;
}
