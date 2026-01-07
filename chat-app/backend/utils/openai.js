// utils/openai.js
import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const getMentalHealthReply = async (message) => {
  const payload = {
    model: 'mistralai/mixtral-8x7b',
    messages: [
      { role: 'system', content: 'You are a compassionate mental health instructor helping users cope, grow, and find emotional clarity.' },
      { role: 'user', content: message },
    ],
  };

  const headers = {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const response = await axios.post(OPENROUTER_API_URL, payload, { headers });

  return response.data.choices?.[0]?.message?.content || 'Sorry, I am unable to help at the moment.';
};
