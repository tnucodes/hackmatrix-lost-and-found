import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, MapPin, Sparkles } from "lucide-react";

const MapPicker = dynamic(() => import("../components/MapPicker"), { ssr: false });

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
  const [coordinates, setCoordinates] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview(null);
    }
  };

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

      // 2. Save to Firestore
      const handshakeCode = Math.floor(1000 + Math.random() * 9000).toString();
      await addDoc(collection(db, "lostItems"), {
        title: title,
        description: description,
        location: location,
        coordinates: coordinates,
        imageUrl: imageUrl,
        ownerEmail: user.email,
        ownerId: user.uid,
        status: "active",
        handshakeCode: handshakeCode,
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
      <div className="w-full max-w-2xl mt-6">
        <Link href="/" className="font-bold underline text-black hover:text-neo-pink flex items-center gap-2 mb-6 w-fit">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full bg-white neo-card p-8"
        >
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-6 bg-neo-pink inline-block px-3 py-1.5 neo-border">
            Report Lost Item 🔍
          </h2>

          {error && (
            <div className="bg-red-200 text-red-900 border-3 border-black p-3 font-bold mb-6 shadow-[3px_3px_0_#000]">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block font-black uppercase text-sm tracking-wider mb-2">What did you lose?</label>
              <input 
                type="text" 
                required
                placeholder="e.g., Blue Hydroflask Water Bottle"
                className="w-full p-4 border-4 border-black bg-white focus:outline-none focus:bg-neo-bg font-bold shadow-[2px_2px_0_#000]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-black uppercase text-sm tracking-wider mb-2">Description (Be specific!)</label>
              <textarea 
                required
                rows="3"
                placeholder="Has a bunch of hackathon stickers on the side, small dent on bottom..."
                className="w-full p-4 border-4 border-black bg-white focus:outline-none focus:bg-neo-bg font-bold shadow-[2px_2px_0_#000]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-black uppercase text-sm tracking-wider mb-2">Location Description</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Near the main library entrance"
                required
                className="w-full p-4 border-4 border-black focus:outline-none focus:bg-neo-bg font-bold shadow-[2px_2px_0_#000]"
              />
            </div>

            <div>
              <label className="block font-black uppercase text-sm tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin size={18} /> Pinpoint on Campus Map
              </label>
              <MapPicker onLocationSelect={(coords) => setCoordinates(coords)} />
            </div>

            <div>
              <label className="block font-black uppercase text-sm tracking-wider mb-2">Upload a Photo (Optional but helpful)</label>
              <div className="border-4 border-dashed border-black p-6 bg-gray-50 flex flex-col items-center justify-center relative cursor-pointer hover:bg-gray-100 transition-all shadow-[2px_2px_0_#000]">
                {imagePreview ? (
                  <div className="relative w-full max-h-[300px] flex flex-col items-center">
                    <img src={imagePreview} className="max-h-[200px] object-contain border-3 border-black shadow-[3px_3px_0_#000]" alt="Upload Preview" />
                    <button 
                      type="button" 
                      onClick={() => { setImage(null); setImagePreview(null); }}
                      className="mt-3 bg-red-400 text-black font-black text-xs uppercase px-3 py-1.5 border-2 border-black hover:bg-red-500 shadow-[2px_2px_0_#000]"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <div className="text-center flex flex-col items-center py-4">
                    <span className="text-5xl mb-2">📸</span>
                    <p className="font-black text-sm uppercase tracking-wide">Click or Tap to Select Photo</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1">JPEG, PNG supported (Max compressed to 600px)</p>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-neo-green p-4 text-xl mt-4 font-black tracking-widest uppercase neo-button text-black"
            >
              {loading ? "Saving Item..." : "Submit Alert 🚀"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
