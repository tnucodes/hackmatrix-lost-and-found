import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../../lib/firebase";
import { doc, getDoc, collection, getDocs, query, updateDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, MapPin, Sparkles, Trophy, ArrowLeft, ShieldCheck, Mail, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import dynamic from "next/dynamic";

const MapDisplay = dynamic(() => import("../../components/MapDisplay"), { ssr: false });

export default function ItemDetails() {
  const router = useRouter();
  const { id, type } = router.query;
  const { user } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState("");
  
  // States for matching logic
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState([]);
  const [hasSearchedMatches, setHasSearchedMatches] = useState(false);

  useEffect(() => {
    if (!id || !type) return;

    async function fetchItem() {
      try {
        const collectionName = type === "lost" ? "lostItems" : "foundItems";
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [id, type]);

  const handleFindMatches = async () => {
    setIsMatching(true);
    setHasSearchedMatches(false);
    
    try {
      // 1. Fetch all found items from Firestore
      const foundSnapshot = await getDocs(collection(db, "foundItems"));
      const foundItems = foundSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (foundItems.length === 0) {
        setMatches([]);
        setHasSearchedMatches(true);
        setIsMatching(false);
        return;
      }

      // 2. Send to our Gemini API to find matches
      const response = await fetch("/api/find-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lostItem: item, foundItems: foundItems })
      });
      const data = await response.json();

      // 3. Filter the full items based on the IDs returned by Gemini
      if (data.matchedIds && data.matchedIds.length > 0) {
        const matchedItems = foundItems.filter(fItem => data.matchedIds.includes(fItem.id));
        setMatches(matchedItems);
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.error("Match error:", err);
    } finally {
      setIsMatching(false);
      setHasSearchedMatches(true);
    }
  };

  const handleVerifyHandshake = async () => {
    if (codeInput !== item.handshakeCode) {
      alert("Invalid Handshake Code!");
      return;
    }
    
    try {
      const collectionName = type === "lost" ? "lostItems" : "foundItems";
      const docRef = doc(db, collectionName, item.id);
      await updateDoc(docRef, { 
        status: "verified_resolved",
        verifiedUserEmail: user.email 
      });
      setItem({ ...item, status: "verified_resolved", verifiedUserEmail: user.email });
      alert("Verification successful! You both earned 50 Trust Points!");
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleStartChat = async () => {
    try {
      const chatId = `${item.id}_${user.uid}`;
      const chatRef = doc(db, "chats", chatId);
      
      // Create or update the parent chat document with participants
      await setDoc(chatRef, {
        itemId: item.id,
        itemTitle: item.title,
        participants: [item.ownerId || item.finderId, user.uid],
        updatedAt: new Date()
      }, { merge: true });

      // Navigate to the chat room
      router.push(`/chat/${chatId}`);
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  };

  if (loading) return <div className="min-h-screen bg-neo-bg p-10 text-2xl font-black">Loading Details...</div>;
  if (!item) return <div className="min-h-screen bg-neo-bg p-10 text-2xl font-black">Item not found.</div>;

  const isCreator = (type === "found" && user?.uid === item.finderId) || (type === "lost" && user?.uid === item.ownerId);

  return (
    <div className="min-h-screen bg-neo-bg p-6 font-sans flex justify-center">
      <div className="w-full max-w-5xl mt-6">
        <Link href="/" className="font-bold underline text-black hover:text-neo-pink flex items-center gap-2 mb-6 w-fit">
          <ArrowLeft size={16} /> Back to Board
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white neo-card flex flex-col md:flex-row overflow-hidden shadow-[8px_8px_0_#000] border-4 border-black"
        >
          {/* Left Column: Visual Media & Maps ( h-fit flex-grow or fixed widths ) */}
          <div className="w-full md:w-[45%] border-b-4 md:border-b-0 md:border-r-4 border-black flex flex-col bg-gray-50">
            {/* Image Box */}
            <div className="h-64 sm:h-80 w-full bg-gray-200 border-b-4 border-black overflow-hidden relative flex items-center justify-center">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
              ) : (
                <div className="flex flex-col items-center justify-center font-black uppercase text-gray-400 p-8 text-center select-none bg-gray-100 h-full w-full">
                  <span className="text-5xl mb-2">{type === 'lost' ? '🔍' : '📦'}</span>
                  <span className="text-sm">No photo provided</span>
                </div>
              )}
            </div>

            {/* Map Box */}
            <div className="p-4 flex-grow flex flex-col justify-end">
              <h3 className="font-black uppercase text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                <MapPin size={14} className="text-black" /> Pinpoint Location
              </h3>
              {item.coordinates ? (
                <div className="bg-white border-2 border-black p-1 relative z-0 shadow-[2px_2px_0_#000]">
                  <MapDisplay lat={item.coordinates.lat} lng={item.coordinates.lng} />
                </div>
              ) : (
                <div className="bg-white border-2 border-black p-1 relative z-0 shadow-[2px_2px_0_#000]">
                  <iframe 
                    width="100%" 
                    height="200" 
                    style={{ border: 0 }} 
                    loading="lazy" 
                    allowFullScreen 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(item.location)}&output=embed`}
                  ></iframe>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Descriptions & Interactive Panels */}
          <div className="w-full md:w-[55%] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Header Badges */}
              <div className="flex gap-2 items-center mb-4">
                <span className={`px-2.5 py-1 font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] ${type === 'lost' ? 'bg-neo-pink text-black' : 'bg-neo-green text-black'}`}>
                  {type} Item
                </span>
                <span className={`px-2.5 py-1 font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] ${item.status === 'verified_resolved' || item.status === 'resolved' ? 'bg-neo-blue text-white' : 'bg-neo-yellow text-black'}`}>
                  {item.status === 'verified_resolved' || item.status === 'resolved' ? 'Resolved' : 'Active'}
                </span>
              </div>

              {/* Title & Location details */}
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-2 leading-none">{item.title}</h2>
              <p className="text-gray-500 font-bold mb-6 flex items-center gap-1.5 text-sm">
                <MapPin size={16} className="text-black" /> {item.location}
              </p>
            
              {/* Description box */}
              <div className="bg-gray-50 border-3 border-black p-4 mb-6 shadow-[3px_3px_0_#000]">
                <h3 className="font-black uppercase text-xs text-gray-500 mb-2">Detailed Description</h3>
                <p className="font-bold text-base leading-relaxed text-gray-800">{item.description}</p>
              </div>

              {/* Gemini AI Auto description card */}
              {item.aiDescription && (
                <div className="bg-neo-bg border-3 border-black p-4 mb-6 relative shadow-[3px_3px_0_#000]">
                  <div className="absolute -top-3.5 -right-3.5 text-2xl animate-bounce">✨</div>
                  <h3 className="font-black uppercase text-xs text-neo-pink mb-2 flex items-center gap-1">
                    <Sparkles size={14} className="fill-neo-pink text-neo-pink" /> AI Vision Analysis (Gemini Flash)
                  </h3>
                  <p className="font-bold text-sm leading-relaxed text-gray-700 mb-3">{item.aiDescription}</p>
                  
                  {item.aiTags && item.aiTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.aiTags.map(tag => (
                        <span key={tag} className="bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Secure verification module (Passcode Terminal) */}
              {user && item.status !== "verified_resolved" && item.status !== "resolved" && (
                <div className="bg-neo-yellow border-3 border-black p-5 mb-6 text-center shadow-[4px_4px_0_#000]">
                  <h3 className="font-black uppercase mb-3 text-lg flex items-center justify-center gap-2 border-b-2 border-black pb-2">
                    <Trophy className="text-black" size={20} /> Secure Exchange Verification
                  </h3>
                  
                  {isCreator ? (
                    <div>
                      <p className="text-xs font-bold mb-2">Give this secure 4-digit code to the other student when you meet in-person to return the item:</p>
                      <div className="text-4xl font-black bg-white border-4 border-black py-2 px-6 inline-block font-mono tracking-widest text-neo-pink shadow-[2px_2px_0_#000]">
                        {item.handshakeCode || "0000"}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-bold mb-3">Meet the poster and ask them for the 4-digit Handshake Code to claim points:</p>
                      <input 
                        type="text" 
                        maxLength={4}
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        placeholder="XXXX"
                        className="text-center text-3xl font-black font-mono bg-white border-4 border-black py-2 px-4 w-40 mb-3 tracking-widest focus:outline-none focus:bg-neo-pink shadow-[2px_2px_0_#000]"
                      />
                      <button 
                        onClick={handleVerifyHandshake}
                        className="bg-black text-white px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-800 neo-button w-full"
                      >
                        <ShieldCheck size={16} className="text-neo-yellow" /> Verify PIN & Resolve Return
                      </button>
                    </div>
                  )}
                </div>
              )}

              {item.status === "verified_resolved" && (
                <div className="bg-neo-green border-3 border-black p-4 mb-6 text-center font-black uppercase text-sm flex items-center justify-center gap-2 shadow-[3px_3px_0_#000]">
                  🎉 Resolved return verified! +50 Trust Points earned by each.
                </div>
              )}
            </div>

            {/* Bottom Actions section */}
            <div className="mt-4 border-t-2 border-gray-200 pt-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">POSTED BY</span>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 bg-neo-yellow/20 px-3 py-1.5 border border-black shadow-[1px_1px_0_#000]">
                  <Mail size={14} className="text-black shrink-0" />
                  <span className="font-black text-xs truncate max-w-[200px]">{item.ownerEmail || item.finderEmail}</span>
                </div>
                
                {user && user.uid !== (item.ownerId || item.finderId) && (
                  <button 
                    onClick={handleStartChat}
                    className="bg-neo-blue p-3 text-xs font-black uppercase tracking-wider neo-button flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 text-black shadow-[2px_2px_0_#000]"
                  >
                    <MessageSquare size={16} /> Start Secure Chat
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Matcher Section (Only for Lost Items) */}
        {type === "lost" && (
          <div className="mt-10 mb-20">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 bg-neo-yellow inline-block px-3 py-1 neo-border">
              🤖 Smart AI Matches
            </h2>
            <div className="bg-white neo-card p-6 border-4 border-black shadow-[6px_6px_0_#000]">
              <p className="font-bold text-sm text-gray-700 mb-4">
                Scan our campus database of found items. Gemini AI analyzes details and photos to suggest matches.
              </p>
              <button 
                onClick={handleFindMatches}
                disabled={isMatching}
                className="bg-neo-pink px-5 py-3 text-xs font-black uppercase neo-button flex items-center gap-2 mb-6"
              >
                <Sparkles size={16} />
                {isMatching ? "Scanning Campus Records..." : "Run Smart Scan"}
              </button>

              {/* Match Results */}
              {hasSearchedMatches && matches.length === 0 && (
                <div className="bg-gray-100 p-4 border-3 border-black font-bold text-center text-gray-500 italic">
                  No matches found on campus yet. We'll automatically suggest matches when new found items arrive.
                </div>
              )}

              {matches.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {matches.map(match => (
                    <Link href={`/item/${match.id}?type=found`} key={match.id}>
                      <div className="bg-white neo-card p-4 flex gap-4 hover:bg-gray-50 transition-all cursor-pointer group hover:neo-card-hover border-3 border-black">
                        <div className="w-20 h-20 bg-gray-200 border-2 border-black shrink-0 overflow-hidden relative">
                           {match.imageUrl && <img src={match.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8px] bg-neo-green font-black px-1.5 py-0.5 border border-black uppercase tracking-widest inline-block mb-1 shadow-[1px_1px_0_#000]">
                            AI SUGGESTION
                          </span>
                          <h4 className="font-black uppercase truncate text-sm leading-tight">{match.title}</h4>
                          <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-0.5">
                            📍 {match.location}
                          </p>
                          <div className="text-[9px] bg-black text-white font-black px-1.5 py-0.5 inline-block mt-2">
                            {match.aiTags ? `#${match.aiTags[0]}` : "#match"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
