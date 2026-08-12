import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Camera, AlertCircle, Check } from "lucide-react";

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
  
  // Wizard state
  const [step, setStep] = useState(1);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Loading & Error states
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

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError("Please fill out the item title and description first!");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to report an item!");
      return;
    }
    if (!location) {
      setError("Please specify where you last saw the item!");
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
      const docRef = await addDoc(collection(db, "lostItems"), {
        title: title,
        description: description,
        location: location,
        imageUrl: imageUrl,
        aiDescription: description,
        aiTags: [],
        ownerEmail: user.email,
        ownerId: user.uid,
        status: "active",
        handshakeCode: handshakeCode,
        createdAt: serverTimestamp()
      });

      // 3. Success! Send the user to the details page
      router.push(`/item/${docRef.id}?type=lost`);
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
          className="w-full bg-white border-4 border-black p-8 shadow-[8px_8px_0_#000]"
        >
          {/* Header Indicators */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black uppercase tracking-tighter bg-neo-pink inline-block px-3 py-1.5 border-4 border-black shadow-[3px_3px_0_#000]">
              Report Lost Item 🔍
            </h2>
            <div className="flex gap-2">
              <span className={`h-3 w-3 rounded-full border-2 border-black ${step >= 1 ? "bg-neo-pink" : "bg-white"}`} />
              <span className={`h-3 w-3 rounded-full border-2 border-black ${step >= 2 ? "bg-neo-pink" : "bg-white"}`} />
            </div>
          </div>

          {error && (
            <div className="bg-red-200 text-red-950 border-3 border-black p-3 font-bold mb-6 flex items-start gap-2 shadow-[2px_2px_0_#000]">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="text-xs">{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 10, opacity: 0 }}
                className="flex flex-col gap-6"
              >
                {/* Visual Image Dropzone */}
                <div>
                  <label className="block font-black uppercase text-xs tracking-wider mb-2 text-gray-700">Have a Photo? (Optional)</label>
                  <div className="border-4 border-dashed border-black p-6 bg-gray-50 flex flex-col items-center justify-center relative cursor-pointer hover:bg-gray-100 transition-all shadow-[2px_2px_0_#000]">
                    {imagePreview ? (
                      <div className="relative w-full max-h-[300px] flex flex-col items-center">
                        <img src={imagePreview} className="max-h-[160px] object-contain border-3 border-black shadow-[3px_3px_0_#000]" alt="Upload Preview" />
                        
                        <div className="flex gap-3 mt-4 w-full justify-center">
                          <button 
                            type="button" 
                            onClick={() => { setImage(null); setImagePreview(null); }}
                            className="bg-red-400 text-black font-black text-xs uppercase px-6 py-2 border-2 border-black hover:bg-red-500 shadow-[2px_2px_0_#000]"
                          >
                            Remove Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center flex flex-col items-center py-4">
                        <Camera size={38} className="mb-2 text-gray-400" />
                        <p className="font-black text-sm uppercase tracking-wide">Click or Drag Photo of Item</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">Add a photo of your item to help others identify it</p>
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

                {/* Title */}
                <div>
                  <label className="block font-black uppercase text-xs tracking-wider mb-2 text-gray-700">What did you lose?</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., Blue Hydroflask Water Bottle"
                    className="w-full p-4 border-4 border-black bg-white focus:outline-none focus:bg-neo-bg font-bold shadow-[2px_2px_0_#000]"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-black uppercase text-xs tracking-wider mb-2 text-gray-700">Description (Be specific!)</label>
                  <textarea 
                    required
                    rows="3"
                    placeholder="e.g., Has a sticker of Octocat on the front, dent near bottom, black cap."
                    className="w-full p-4 border-4 border-black bg-white focus:outline-none focus:bg-neo-bg font-bold shadow-[2px_2px_0_#000]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleNextStep}
                  className="bg-neo-blue p-4 text-sm font-black uppercase tracking-widest neo-button text-black flex items-center justify-center gap-2 mt-2 shadow-[3px_3px_0_#000]"
                >
                  Next Step: Location <ArrowRight size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -10, opacity: 0 }}
                className="flex flex-col gap-6"
              >
                {/* Location Input */}
                <div>
                  <label className="block font-black uppercase text-xs tracking-wider mb-2 text-gray-700">Where did you last see it?</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Canteen Table, Central Library 2nd Floor"
                    required
                    className="w-full p-4 border-4 border-black focus:outline-none focus:bg-neo-bg font-bold shadow-[2px_2px_0_#000]"
                  />
                  <p className="text-[10px] text-gray-500 font-bold mt-1.5">
                    Provide a description (e.g. building name, floor, or specific corner) to help others check that spot.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="bg-gray-50 border-3 border-black p-4 shadow-[3px_3px_0_#000]">
                  <h4 className="text-xs font-black uppercase text-gray-500 mb-2 border-b border-black pb-1">Report Summary</h4>
                  <div className="flex flex-col gap-1.5 text-sm font-bold text-gray-800">
                    <p><span className="text-gray-500">Item:</span> {title}</p>
                    <p className="line-clamp-2"><span className="text-gray-500">Details:</span> {description}</p>
                    <p><span className="text-gray-500">Last Seen:</span> {location || "Not specified"}</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 p-4 text-sm font-black uppercase tracking-widest border-4 border-black hover:bg-gray-200 transition-colors shadow-[2px_2px_0_#000]"
                  >
                    Edit Details
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-neo-green p-4 text-sm font-black uppercase tracking-widest neo-button text-black flex items-center justify-center gap-2 shadow-[2px_2px_0_#000]"
                  >
                    {loading ? "Submitting..." : <>Submit Alert <Check size={16} /></>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
