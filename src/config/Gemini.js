//임시로 만든 api key config입니다.나중에는 백엔드에서 처리할 예정입니다.

// To run this code you need to install the following dependencies:
// npm install @google/genai mime

import {
  GoogleGenAI,
} from '@google/genai';

async function main(prompt) {
  const ai = new GoogleGenAI({
    apiKey: "발급받은 제미나이 api키를 넣어주세요",
  });
  const tools = [
    {
      googleSearch: {
      }
    },
  ];
  const config = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
    tools,
  };
  const model = 'gemini-2.5-flash';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: prompt,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });

  let fullResponseText = "";

  for await (const chunk of response) {
    fullResponseText += chunk.text;
  }
  return fullResponseText;
}

export default main;