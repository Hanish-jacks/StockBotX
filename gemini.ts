import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI with API key
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyBZGTMvd7X4gHS-5YEe0LFS5JVqS6jzD0U" 
});

export async function generateFinancialAdvice(userMessage: string, context: string = ""): Promise<string> {
  try {
    const systemPrompt = `You are ChatbotX, an expert AI financial advisor specializing in stock market analysis and investment guidance. 

Context from previous conversation:
${context}

User question: ${userMessage}

Please provide a comprehensive response that includes:
1. Direct answer to the user's question
2. Relevant market analysis if applicable  
3. Risk assessment and recommendations
4. Any relevant emotional trading considerations
5. Confidence levels for any predictions made

Keep responses informative but concise. Use professional financial terminology but explain complex concepts clearly. Always include appropriate disclaimers about investment risks.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        parts: [{
          text: systemPrompt
        }]
      }]
    });

    return response.text || "I apologize, but I'm having trouble processing your request right now. Please try again.";
  } catch (error) {
    console.error("Error generating financial advice:", error);
    throw new Error("Failed to generate AI response");
  }
}

export interface Sentiment {
  rating: number;
  confidence: number;
  sentiment: string;
}

export async function analyzeSentiment(text: string): Promise<Sentiment> {
  try {
    const systemPrompt = `You are a sentiment analysis expert specializing in financial and trading psychology. 
Analyze the sentiment of the following text and determine the emotional state that could affect trading decisions.

Classify the sentiment as one of: "optimistic", "neutral", "pessimistic"
Provide a confidence score between 0 and 1.
Provide a rating from 1 to 5 stars.

Respond with JSON in this exact format:
{"sentiment": "optimistic|neutral|pessimistic", "rating": number, "confidence": number}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            sentiment: { type: "string" },
            rating: { type: "number" },
            confidence: { type: "number" },
          },
          required: ["sentiment", "rating", "confidence"],
        },
      },
      contents: text,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return {
        sentiment: data.sentiment,
        rating: data.rating,
        confidence: data.confidence,
      };
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    console.error("Failed to analyze sentiment:", error);
    // Return default neutral sentiment on error
    return {
      sentiment: "neutral",
      rating: 3,
      confidence: 0.5,
    };
  }
}

export async function analyzeStockSentiment(stockSymbol: string, marketData: any): Promise<string> {
  try {
    const prompt = `As a financial analyst, analyze the sentiment and outlook for ${stockSymbol} based on the following market data:

Current Price: $${marketData.price}
Change: ${marketData.change} (${marketData.changePercent}%)
Volume: ${marketData.volume}

Provide a brief sentiment analysis including:
1. Short-term outlook (bullish/bearish/neutral)
2. Key factors influencing the sentiment
3. Risk level assessment
4. Confidence level in your analysis

Keep the response concise and professional.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    return response.text || "Unable to generate sentiment analysis at this time.";
  } catch (error) {
    console.error("Error analyzing stock sentiment:", error);
    throw new Error("Failed to analyze stock sentiment");
  }
}

export async function generateInvestmentRecommendation(
  portfolioData: any, 
  riskProfile: string, 
  marketConditions: any
): Promise<string> {
  try {
    const prompt = `As an investment advisor, provide personalized investment recommendations based on:

Portfolio Value: $${portfolioData.totalValue || 'N/A'}
Risk Profile: ${riskProfile}
Current Market Conditions: ${JSON.stringify(marketConditions)}

Please provide:
1. Asset allocation recommendations
2. Specific stock suggestions with rationale
3. Risk management strategies
4. Market timing considerations
5. Diversification advice

Format the response in a clear, actionable manner suitable for the investor's risk profile.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    return response.text || "Unable to generate investment recommendations at this time.";
  } catch (error) {
    console.error("Error generating investment recommendation:", error);
    throw new Error("Failed to generate investment recommendation");
  }
}

export async function summarizeArticle(text: string): Promise<string> {
  try {
    const prompt = `Please summarize the following financial news or market analysis concisely while maintaining key points:\n\n${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    return response.text || "Unable to summarize the content at this time.";
  } catch (error) {
    console.error("Error summarizing article:", error);
    throw new Error("Failed to summarize article");
  }
}
