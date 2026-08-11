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
        const MAX_WIDTH = 600; // Resize to max 600px width
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Convert back to Base64 (JPEG, 70% quality)
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = (err) => reject(err);
    };
  });
};

export default function ReportLost() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State for our form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to report an item!");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      let imageUrl = "";

      // 1. If the user selected an image, compress it and convert to Base64 string
      if (image) {
        imageUrl = await compressImage(image);
      }

      // 2. Save the text data + Base64 image directly to Firestore Database
      await addDoc(collection(db, "lostItems"), {
        title: title,
        description: description,
        location: location,
        imageUrl: imageUrl,
        ownerEmail: user.email,
        ownerId: user.uid,
        status: "lost", // We can change this to "resolved" later when found!
        createdAt: serverTimestamp() // Firebase automatically sets the exact time
      });

      // 3. Success! Send the user back to the home page
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong saving your item. Try again.");
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
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 bg-neo-pink inline-block px-2 neo-border">
          Report Lost Item
        </h2>

        {error && (
          <div className="bg-red-200 text-red-900 border-2 border-red-900 p-2 font-bold mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block font-bold mb-1">What did you lose?</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Blue Hydroflask Water Bottle"
              className="w-full p-3 neo-border focus:outline-none focus:bg-gray-50 font-medium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Description (Be specific!)</label>
            <textarea 
              required
              rows="3"
              placeholder="Has a bunch of hackathon stickers on the side..."
              className="w-full p-3 neo-border focus:outline-none focus:bg-gray-50 font-medium"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Last Seen Location</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Main Library, 2nd Floor"
              className="w-full p-3 neo-border focus:outline-none focus:bg-gray-50 font-medium"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Upload a Photo (Optional but helpful)</label>
            {/* type="file" lets the user pick an image from their computer/phone */}
            <input 
              type="file" 
              accept="image/*"
              className="w-full p-3 neo-border focus:outline-none bg-gray-50 font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-bold file:bg-neo-blue file:text-black cursor-pointer"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-neo-green p-4 text-xl mt-4 font-black tracking-widest uppercase neo-button"
          >
            {loading ? "Saving..." : "Submit Alert"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
