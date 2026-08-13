import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Extract the raw base64 data by removing the data URI prefix (e.g. data:image/jpeg;base64,...)
    const base64Data = base64Image.split(",")[1];

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use the exact endpoint provided in the user's environment
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are an AI assistant for a Lost and Found application.
Look closely at this image and provide a highly detailed description of the item, focusing on unique identifying features (brand, color, scratches, stickers, model number, etc.).
Also, provide a comma-separated list of 5 to 10 highly relevant search tags.
Format your response exactly like this:
DESCRIPTION: <your detailed description>
TAGS: <tag1, tag2, tag3...>`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    // Parse out the description and tags
    let description = "No description generated.";
    let tags = [];

    const lines = responseText.split("\n");
    lines.forEach(line => {
      if (line.startsWith("DESCRIPTION:")) {
        description = line.replace("DESCRIPTION:", "").trim();
      }
      if (line.startsWith("TAGS:")) {
        const rawTags = line.replace("TAGS:", "").trim();
        tags = rawTags.split(",").map(tag => tag.trim().toLowerCase());
      }
    });

    res.status(200).json({ description, tags });

  } catch (error) {
    console.error("Gemini API error details:", {
      message: error.message,
      status: error.status,
      stack: error.stack,
      errorObj: error
    });

    const isRateLimit = 
      error.status === 429 || 
      (error.message && (
        error.message.includes("429") || 
        error.message.toLowerCase().includes("resource exhausted") ||
        error.message.toLowerCase().includes("rate limit") ||
        error.message.toLowerCase().includes("quota")
      ));

    if (isRateLimit) {
      console.warn("⚠️ GEMINI RATE LIMIT TRIGGERED: Request was blocked due to quota or rate limit limits.");
      return res.status(429).json({ error: "Gemini API rate limit exceeded. Please wait a moment and try again." });
    }

    res.status(500).json({ error: "Failed to analyze image" });
  }
}
