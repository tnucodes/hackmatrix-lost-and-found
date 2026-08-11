import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

// Helper to compress image to Base64 so it fits in Firestore (<1MB)
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = (err) => reject(err);
    };
  });
};

export default function ReportFound() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to report a found item!");
      return;
    }
    // We require an image for found items because later we will use Gemini AI to match it!
    if (!image) {
      setError("Please upload a photo of the found item!");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      let imageUrl = "";
      let aiTags = [];
      let aiDescription = "";

      // 1. Compress the image and convert it to Base64
      imageUrl = await compressImage(image);

      // 2. Ask our new Gemini API route to analyze the image!
      try {
        const aiResponse = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image: imageUrl })
        });
        const aiData = await aiResponse.json();
        
        if (aiData.tags) aiTags = aiData.tags;
        if (aiData.description) aiDescription = aiData.description;
      } catch (aiErr) {
        console.error("AI Analysis failed, but saving anyway:", aiErr);
      }

      // 3. Save to the "foundItems" collection in Firestore Database
      await addDoc(collection(db, "foundItems"), {
        title: title,
        description: description,
        location: location,
        imageUrl: imageUrl, 
        finderEmail: user.email,
        finderId: user.uid,
        status: "available",
        aiTags: aiTags,
        aiDescription: aiDescription,
        createdAt: serverTimestamp()
      });

      // (Later, we will add the Gemini AI description generator right here!)

      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong saving the item. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neo-bg p-6 flex flex-col items-center">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-2xl bg-white neo-card p-8 mt-10"
      >
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 bg-neo-blue inline-block px-2 neo-border">
          Report Found Item
        </h2>

        {error && (
          <div className="bg-red-200 text-red-900 border-2 border-red-900 p-2 font-bold mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block font-bold mb-1">What did you find?</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Set of Car Keys"
              className="w-full p-3 neo-border focus:outline-none focus:bg-gray-50 font-medium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Description</label>
            <textarea 
              required
              rows="3"
              placeholder="Honda keys with a red lanyard..."
              className="w-full p-3 neo-border focus:outline-none focus:bg-gray-50 font-medium"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Where did you find it?</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Campus Cafe, Table 4"
              className="w-full p-3 neo-border focus:outline-none focus:bg-gray-50 font-medium"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Upload a Photo (Required)</label>
            <input 
              type="file" 
              accept="image/*"
              required
              className="w-full p-3 neo-border focus:outline-none bg-gray-50 font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-bold file:bg-neo-pink file:text-black cursor-pointer"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-neo-yellow p-4 text-xl mt-4 font-black tracking-widest uppercase neo-button"
          >
            {loading ? "Saving..." : "Submit Found Item"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
