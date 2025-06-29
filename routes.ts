import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeSentiment, summarizeArticle } from "./gemini";
import { insertChatConversationSchema, insertChatMessageSchema, insertWatchlistSchema, insertEmotionalStateSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Stock market data routes
  app.get('/api/stocks/quote/:symbol', isAuthenticated, async (req, res) => {
    try {
      const { symbol } = req.params;
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || '7Q82S75TNEN40PR0';
      
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      
      const data = await response.json();
      
      if (data["Error Message"]) {
        return res.status(400).json({ error: data["Error Message"] });
      }
      
      const quote = data["Global Quote"];
      if (!quote) {
        return res.status(404).json({ error: "Stock not found" });
      }
      
      res.json({
        symbol: quote["01. symbol"],
        price: parseFloat(quote["05. price"]),
        change: parseFloat(quote["09. change"]),
        changePercent: quote["10. change percent"].replace(/[%()]/g, ""),
        volume: parseInt(quote["06. volume"]),
        lastUpdate: quote["07. latest trading day"]
      });
    } catch (error) {
      console.error("Error fetching stock quote:", error);
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  app.get('/api/stocks/historical/:symbol', isAuthenticated, async (req, res) => {
    try {
      const { symbol } = req.params;
      const { period = 'monthly' } = req.query;
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || '7Q82S75TNEN40PR0';
      
      const functionName = period === 'daily' ? 'TIME_SERIES_DAILY_ADJUSTED' : 'TIME_SERIES_MONTHLY_ADJUSTED';
      
      const response = await fetch(
        `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}&apikey=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      
      const data = await response.json();
      
      if (data["Error Message"]) {
        return res.status(400).json({ error: data["Error Message"] });
      }
      
      const timeSeries = data[`${period === 'daily' ? 'Time Series (Daily)' : 'Monthly Adjusted Time Series'}`];
      if (!timeSeries) {
        return res.status(404).json({ error: "Historical data not found" });
      }
      
      // Convert to array and sort by date (most recent first)
      const historicalData = Object.entries(timeSeries)
        .map(([date, values]: [string, any]) => ({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['6. volume'])
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 120); // Last 10 years of monthly data or 120 days of daily data
      
      res.json(historicalData);
    } catch (error) {
      console.error("Error fetching historical data:", error);
      res.status(500).json({ error: "Failed to fetch historical data" });
    }
  });

  app.get('/api/stocks/top-performers', isAuthenticated, async (req, res) => {
    try {
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'CRM', 'AMD'];
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || '7Q82S75TNEN40PR0';
      
      const promises = symbols.map(async (symbol) => {
        try {
          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
          );
          const data = await response.json();
          const quote = data["Global Quote"];
          
          if (!quote) return null;
          
          return {
            symbol: quote["01. symbol"],
            price: parseFloat(quote["05. price"]),
            change: parseFloat(quote["09. change"]),
            changePercent: parseFloat(quote["10. change percent"].replace(/[%()]/g, "")),
            volume: parseInt(quote["06. volume"])
          };
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      const validResults = results.filter(result => result !== null);
      
      res.json(validResults);
    } catch (error) {
      console.error("Error fetching top performers:", error);
      res.status(500).json({ error: "Failed to fetch top performers" });
    }
  });

  // Chat routes
  app.get('/api/chat/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getChatConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post('/api/chat/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertChatConversationSchema.parse({
        ...req.body,
        userId
      });
      
      const conversation = await storage.createChatConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid conversation data", details: error.errors });
      }
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get('/api/chat/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify conversation belongs to user
      const conversation = await storage.getChatConversation(parseInt(id));
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messages = await storage.getChatMessages(parseInt(id));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertChatMessageSchema.parse(req.body);
      
      // Verify conversation belongs to user
      const conversation = await storage.getChatConversation(validatedData.conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Save user message
      const userMessage = await storage.createChatMessage(validatedData);
      
      // Generate AI response using Gemini
      const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyBZGTMvd7X4gHS-5YEe0LFS5JVqS6jzD0U';
      
      try {
        // Get conversation context
        const previousMessages = await storage.getChatMessages(validatedData.conversationId);
        const context = previousMessages
          .slice(-10) // Last 10 messages for context
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        
        const stockAnalysisPrompt = `You are ChatbotX, an AI-powered financial advisor specializing in stock market analysis. 
        
Context: ${context}

User question: ${validatedData.content}

Please provide a comprehensive response that includes:
1. Direct answer to the user's question
2. Relevant market analysis if applicable
3. Risk assessment and recommendations
4. Any relevant emotional trading considerations

Keep responses informative but concise, and always include confidence levels for predictions.`;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: stockAnalysisPrompt
              }]
            }]
          })
        });

        if (!response.ok) {
          throw new Error('Gemini API request failed');
        }

        const geminiData = await response.json();
        const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I'm having trouble processing your request right now. Please try again.";
        
        // Save AI response
        const aiMessage = await storage.createChatMessage({
          conversationId: validatedData.conversationId,
          role: 'assistant',
          content: aiResponse
        });
        
        res.json({ userMessage, aiMessage });
      } catch (aiError) {
        console.error("Error generating AI response:", aiError);
        
        // Save fallback response
        const fallbackResponse = await storage.createChatMessage({
          conversationId: validatedData.conversationId,
          role: 'assistant',
          content: "I apologize, but I'm experiencing technical difficulties. Please try your question again."
        });
        
        res.json({ userMessage, aiMessage: fallbackResponse });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Watchlist routes
  app.get('/api/watchlist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const watchlist = await storage.getWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });

  app.post('/api/watchlist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertWatchlistSchema.parse({
        ...req.body,
        userId
      });
      
      const item = await storage.addToWatchlist(validatedData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid watchlist data", details: error.errors });
      }
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ error: "Failed to add to watchlist" });
    }
  });

  // Emotional state routes
  app.get('/api/emotional-state', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emotionalState = await storage.getLatestEmotionalState(userId);
      res.json(emotionalState);
    } catch (error) {
      console.error("Error fetching emotional state:", error);
      res.status(500).json({ error: "Failed to fetch emotional state" });
    }
  });

  app.post('/api/emotional-state', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertEmotionalStateSchema.parse({
        ...req.body,
        userId
      });
      
      const emotionalState = await storage.createEmotionalState(validatedData);
      res.json(emotionalState);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid emotional state data", details: error.errors });
      }
      console.error("Error creating emotional state:", error);
      res.status(500).json({ error: "Failed to create emotional state" });
    }
  });

  app.post('/api/analyze-sentiment', isAuthenticated, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }
      
      const sentiment = await analyzeSentiment(text);
      res.json(sentiment);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      res.status(500).json({ error: "Failed to analyze sentiment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
