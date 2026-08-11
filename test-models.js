const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const genAI = new GoogleGenerativeAI("AQ.Ab8RN6I27mTzd_yHNzNLC5KyNWgUaPnSUooSfOeD8Ykw6jyFmQ");
  console.log("Fetching models...");
  // Unfortunately, getGenerativeModel doesn't have list models, but we can try common ones:
  const modelsToTry = ["gemini-flash-latest"];
  
  for (const m of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const prompt = "Hi";
      await model.generateContent(prompt);
      console.log(`SUCCESS: ${m} works!`);
    } catch (e) {
      console.log(`FAILED: ${m} - ${e.message.split('\\n')[0]}`);
    }
  }
}
run();
