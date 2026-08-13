import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Camera, Sparkles, AlertCircle, Check, MapPin, Loader2 } from "lucide-react";

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
  
  // Wizard state
  const [step, setStep] = useState(1);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // AI Results
  const [aiDescription, setAiDescription] = useState("");
  const [aiTags, setAiTags] = useState([]);
  
  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanFailed, setScanFailed] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const previewUrl = reader.result;
        setImagePreview(previewUrl);
        
        // Auto-trigger Gemini scan
        await runAutoAiScan(previewUrl, file);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview(null);
      setAiDescription("");
      setAiTags([]);
      setScanFailed(false);
      setError("");
    }
  };

  const runAutoAiScan = async (previewUrl, file) => {
    setAiLoading(true);
    setScanFailed(false);
    setError("");
    
    try {
      let base64String = previewUrl;
      if (!base64String.startsWith("data:image")) {
        base64String = await compressImage(file);
      }
      
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: base64String })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze image");
      }
      
      if (data.description) {
        setAiDescription(data.description);
        setDescription(data.description);
      }
      if (data.tags) {
        setAiTags(data.tags);
        if (data.tags.length > 0) {
          setTitle(`Found ${data.tags[0].charAt(0).toUpperCase() + data.tags[0].slice(1)}`);
        }
      }
    } catch (err) {
      console.error("Gemini scan failed:", err);
      setError(err.message || "AI analysis failed. You can still type details manually!");
      setScanFailed(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!image) {
      setError("Please upload a photo of the found item first!");
      return;
    }
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
      setError("Please specify where you found the item!");
      return;
    }
    if (!coordinates) {
      setError("Please pinpoint the found spot on the campus map!");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      let base64String = "";
      if (imagePreview.startsWith("data:image")) {
        base64String = imagePreview;
      } else {
        base64String = await compressImage(image);
      }

      // Save to Firestore
      const handshakeCode = Math.floor(1000 + Math.random() * 9000).toString();
      const docRef = await addDoc(collection(db, "foundItems"), {
        title,
        description,
        location,
        coordinates,
        imageUrl: base64String,
        aiDescription: aiDescription || description,
        aiTags: aiTags,
        finderId: user.uid,
        finderEmail: user.email,
        status: "active",
        handshakeCode: handshakeCode,
        createdAt: serverTimestamp()
      });

      // Redirect to the item details page
      router.push(`/item/${docRef.id}?type=found`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong saving the item. Try again.");
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
            <h2 className="text-3xl font-black uppercase tracking-tighter bg-neo-blue inline-block px-3 py-1.5 border-4 border-black shadow-[3px_3px_0_#000]">
              Report Found Item 📦
            </h2>
            <div className="flex gap-2">
              <span className={`h-3 w-3 rounded-full border-2 border-black ${step >= 1 ? "bg-neo-blue" : "bg-white"}`} />
              <span className={`h-3 w-3 rounded-full border-2 border-black ${step >= 2 ? "bg-neo-blue" : "bg-white"}`} />
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
                {/* Visual Image Dropzone (Required) */}
                <div>
                  <label className="block font-black uppercase text-xs tracking-wider mb-2 text-gray-700">Upload Photo (Required for AI Scan)</label>
                  <div className="border-4 border-dashed border-black p-6 bg-gray-50 flex flex-col items-center justify-center relative cursor-pointer hover:bg-gray-100 transition-all shadow-[2px_2px_0_#000]">
                    {imagePreview ? (
                      <div className="relative w-full max-h-[300px] flex flex-col items-center justify-center min-h-[160px]">
                        {aiLoading ? (
                          <div className="flex flex-col items-center justify-center py-6 text-center select-none">
                            <Loader2 className="animate-spin text-neo-pink mb-2" size={32} />
                            <p className="font-black text-xs uppercase tracking-wider text-black">Scanning image with Gemini AI... 🪄</p>
                          </div>
                        ) : (
                          <>
                            <img src={imagePreview} className="max-h-[160px] object-contain border-3 border-black shadow-[3px_3px_0_#000]" alt="Upload Preview" />
                            <div className="flex gap-3 mt-4 w-full justify-center">
                              <button 
                                type="button" 
                                onClick={() => { 
                                  setImage(null); 
                                  setImagePreview(null); 
                                  setAiDescription(""); 
                                  setAiTags([]); 
                                  setScanFailed(false);
                                  setError("");
                                }}
                                className="bg-red-400 text-black font-black text-xs uppercase px-6 py-2 border-2 border-black hover:bg-red-500 shadow-[2px_2px_0_#000]"
                              >
                                Remove Photo
                              </button>
                              {scanFailed && (
                                <button 
                                  type="button" 
                                  onClick={() => runAutoAiScan(imagePreview, image)}
                                  className="bg-neo-yellow text-black font-black text-xs uppercase px-6 py-2 border-2 border-black hover:bg-yellow-400 shadow-[2px_2px_0_#000]"
                                >
                                  Retry AI Scan
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-center flex flex-col items-center py-4">
                        <Camera size={38} className="mb-2 text-gray-400" />
                        <p className="font-black text-sm uppercase tracking-wide">Select Photo of Found Item</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">A photo lets Gemini AI analyze details and find matches</p>
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

                {/* AI Tags Banner */}
                {aiTags.length > 0 && (
                  <div className="bg-neo-bg border-3 border-black p-3 shadow-[2px_2px_0_#000] flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-black uppercase text-neo-pink mr-1 flex items-center gap-0.5">
                      <Sparkles size={10} className="fill-neo-pink" /> AI Tags:
                    </span>
                    {aiTags.map(tag => (
                      <span key={tag} className="bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block font-black uppercase text-xs tracking-wider mb-2 text-gray-700">What did you find?</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., Black leather wallet, Car keys"
                    className="w-full p-4 border-4 border-black bg-white focus:outline-none focus:bg-neo-bg font-bold shadow-[2px_2px_0_#000]"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-black uppercase text-xs tracking-wider mb-2 text-gray-700">Description</label>
                  <textarea 
                    required
                    rows="3"
                    placeholder="Has a student ID inside, local bus pass, red keychain ring..."
                    className="w-full p-4 border-4 border-black bg-white focus:outline-none focus:bg-neo-bg font-bold shadow-[2px_2px_0_#000]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleNextStep}
                  disabled={aiLoading}
                  className="bg-neo-blue p-4 text-sm font-black uppercase tracking-widest neo-button text-black flex items-center justify-center gap-2 mt-2 shadow-[3px_3px_0_#000] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step: Location & Map <ArrowRight size={16} />
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
                  <label className="block font-black uppercase text-xs tracking-wider mb-2 text-gray-700">Where did you find it?</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Canteen Table, Library Ground Floor Desk"
                    required
                    className="w-full p-4 border-4 border-black focus:outline-none focus:bg-neo-bg font-bold shadow-[2px_2px_0_#000]"
                  />
                </div>

                {/* Interactive Map Picker */}
                <div>
                  <label className="block font-black uppercase text-xs tracking-wider mb-2 text-gray-700 flex items-center gap-1.5">
                    <MapPin size={14} className="text-black" /> Pinpoint on Campus Map (Locked to Campus bounds)
                  </label>
                  <MapPicker onLocationSelect={(coords) => setCoordinates(coords)} />
                </div>

                {/* Summary Card */}
                <div className="bg-gray-50 border-3 border-black p-4 shadow-[3px_3px_0_#000]">
                  <h4 className="text-xs font-black uppercase text-gray-500 mb-2 border-b border-black pb-1">Report Summary</h4>
                  <div className="flex flex-col gap-1.5 text-sm font-bold text-gray-800">
                    <p><span className="text-gray-500">Item:</span> {title}</p>
                    <p className="line-clamp-2"><span className="text-gray-500">Details:</span> {description}</p>
                    <p><span className="text-gray-500">Location Notes:</span> {location || "Not specified"}</p>
                    <p><span className="text-gray-500">Map Coordinates:</span> {coordinates ? `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}` : "❌ Pin not dropped"}</p>
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
                    {loading ? "Submitting..." : <>Submit Report <Check size={16} /></>}
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
