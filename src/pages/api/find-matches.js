import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lostItem, foundItems } = req.body;
    
    if (!lostItem || !foundItems || foundItems.length === 0) {
      return res.status(200).json({ matchedIds: [] });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    // Format the found items into a readable list for the AI
    const foundItemsList = foundItems.map(item => 
      `ID: ${item.id} | Title: ${item.title} | Description: ${item.description || item.aiDescription || "None"} | Tags: ${item.aiTags && item.aiTags.length > 0 ? item.aiTags.join(", ") : "None"}`
    ).join("\n");

    const prompt = `You are an AI assistant for a Lost and Found app.
A user lost the following item:
Title: ${lostItem.title}
Description: ${lostItem.description}
Location Lost: ${lostItem.location}

Here is a list of items that other people have found:
${foundItemsList}

Task: Determine if any of the found items are a strong match for the lost item. 
Return ONLY a comma-separated list of the IDs of the matched items. Do not include any other text. If there are no good matches, return "NONE".`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    if (responseText === "NONE" || responseText === "") {
      return res.status(200).json({ matchedIds: [] });
    }

    // Split the comma-separated IDs
    const matchedIds = responseText.split(",").map(id => id.trim());

    res.status(200).json({ matchedIds });

  } catch (error) {
    console.error("Gemini Match API error:", error);
    res.status(500).json({ error: "Failed to find matches" });
  }
}
