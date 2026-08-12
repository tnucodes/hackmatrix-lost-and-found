import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../../lib/firebase";
import { doc, getDoc, collection, getDocs, query, updateDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, MapPin, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import dynamic from "next/dynamic";

const MapDisplay = dynamic(() => import("../../components/MapDisplay"), { ssr: false });

export default function ItemDetails() {
  const router = useRouter();
  // We grab the dynamic 'id' and 'type' from the URL (e.g., /item/12345?type=lost)
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
    // If the router isn't ready yet, wait.
    if (!id || !type) return;

    async function fetchItem() {
      try {
        // The collection name depends on the type
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

  return (
    <div className="min-h-screen bg-neo-bg p-6 font-sans flex justify-center">
      <div className="w-full max-w-4xl mt-10">
        <Link href="/browse" className="font-bold underline text-blue-600 hover:text-blue-800 mb-6 inline-block">
          &larr; Back to Feed
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white neo-card flex flex-col md:flex-row overflow-hidden"
        >
          {/* Image Section */}
          <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black min-h-[300px]">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
            ) : (
              <span className="font-bold text-gray-500 text-xl">No Image Provided</span>
            )}
          </div>

          {/* Details Section */}
            <div className="md:w-1/2 p-8 flex flex-col">
              <div className="flex gap-2 items-center mb-4">
                <span className={`px-3 py-1 font-black text-sm uppercase tracking-widest border-2 border-black ${type === 'lost' ? 'bg-neo-pink' : 'bg-neo-green'}`}>
                  {type}
                </span>
                <span className={`px-3 py-1 font-black text-sm uppercase tracking-widest border-2 border-black ${item.status === 'verified_resolved' || item.status === 'resolved' ? 'bg-neo-blue text-white' : 'bg-neo-yellow'}`}>
                  {item.status === 'verified_resolved' || item.status === 'resolved' ? '✅ Resolved' : '🔴 Active'}
                </span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">{item.title}</h2>
              <p className="text-gray-500 font-bold mb-6 flex items-center gap-2">
                <MapPin size={18} /> {item.location}
              </p>
            
            <div className="bg-gray-50 border-2 border-black p-4 mb-6">
              <h3 className="font-bold uppercase text-sm text-gray-500 mb-2">Description</h3>
              <p className="font-medium text-lg leading-relaxed">{item.description}</p>
            </div>

            {/* Map View */}
            {item.coordinates ? (
              <div className="bg-white border-2 border-black p-2 mb-6 relative z-0">
                <h3 className="font-bold uppercase text-sm text-gray-500 mb-2">Map View</h3>
                <MapDisplay lat={item.coordinates.lat} lng={item.coordinates.lng} />
              </div>
            ) : (
              <div className="bg-white border-2 border-black p-2 mb-6">
                <h3 className="font-bold uppercase text-sm text-gray-500 mb-2">Map View (Legacy)</h3>
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

            {item.aiDescription && (
              <div className="bg-neo-bg border-2 border-black p-4 mb-6 relative">
                <div className="absolute -top-4 -right-4 text-3xl">✨</div>
                <h3 className="font-black uppercase text-sm text-neo-pink mb-2">AI Analysis (Gemini Flash)</h3>
                <p className="font-medium text-lg leading-relaxed mb-4">{item.aiDescription}</p>
                <div className="flex flex-wrap gap-2">
                  {item.aiTags?.map(tag => (
                    <span key={tag} className="bg-black text-white px-2 py-1 text-xs font-bold uppercase">#{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Gamification Action: Handshake Verification */}
            {user && item.status !== "verified_resolved" && item.status !== "resolved" && (
              <div className="bg-neo-yellow border-2 border-black p-6 mb-6 text-center">
                <h3 className="font-black uppercase mb-4 text-2xl flex items-center justify-center gap-2">
                  <Trophy className="text-black" /> Trust Point Verification
                </h3>
                
                {/* User is the creator: Show their code */}
                {((type === "found" && user.uid === item.finderId) || (type === "lost" && user.uid === item.ownerId)) ? (
                  <div>
                    <p className="font-bold mb-2">Give this code to the person you are exchanging this item with in person:</p>
                    <div className="text-5xl font-black bg-white border-4 border-black p-4 inline-block tracking-[0.25em]">
                      {item.handshakeCode || "0000"}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <p className="font-bold mb-2">Ask the poster for their 4-digit Handshake Code when you meet them:</p>
                    <input 
                      type="text" 
                      maxLength={4}
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      placeholder="XXXX"
                      className="text-center text-4xl font-black bg-white border-4 border-black p-4 w-48 mb-4 tracking-widest focus:outline-none focus:bg-neo-pink"
                    />
                    <button 
                      onClick={handleVerifyHandshake}
                      className="bg-black text-white px-6 py-3 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 neo-button"
                    >
                      <Trophy size={20} className="text-neo-yellow" /> Verify & Claim Points
                    </button>
                  </div>
                )}
              </div>
            )}
            {item.status === "resolved" && (
              <div className="bg-neo-green border-2 border-black p-4 mb-6 text-center font-black uppercase text-xl">
                🎉 This item has been returned!
              </div>
            )}

            <div className="mt-auto">
              <p className="font-bold text-sm text-gray-500 mb-2 uppercase">Contact Info</p>
              <p className="font-black text-xl mb-4 bg-neo-yellow px-2 py-1 inline-block neo-border">
                {item.ownerEmail || item.finderEmail}
              </p>
              
              {user && user.uid !== (item.ownerId || item.finderId) && (
                <button 
                  onClick={handleStartChat}
                  className="w-full bg-neo-blue p-4 text-xl font-black uppercase tracking-widest neo-button flex items-center justify-center gap-3"
                >
                  <MessageSquare size={24} /> Start Chat
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* AI Matcher Section (Only for Lost Items) */}
        {type === "lost" && (
          <div className="mt-10 mb-20">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 bg-neo-yellow inline-block px-2 neo-border">
              Smart Matcher
            </h2>
            <div className="bg-white neo-card p-6">
              <p className="font-bold text-gray-700 mb-4">
                Let our AI scan the database of found items to see if anyone has reported your item!
              </p>
              <button 
                onClick={handleFindMatches}
                disabled={isMatching}
                className="bg-neo-pink px-6 py-3 font-black uppercase neo-button flex items-center gap-2 mb-6"
              >
                <Sparkles size={20} />
                {isMatching ? "Scanning Database..." : "Find Potential Matches"}
              </button>

              {/* Match Results */}
              {hasSearchedMatches && matches.length === 0 && (
                <div className="bg-gray-100 p-4 border-2 border-black font-bold">
                  No close matches found yet. We'll keep an eye out!
                </div>
              )}

              {matches.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {matches.map(match => (
                    <Link href={`/item/${match.id}?type=found`} key={match.id}>
                      <div className="border-4 border-black p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="w-24 h-24 bg-gray-200 border-2 border-black shrink-0 overflow-hidden">
                           {match.imageUrl && <img src={match.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />}
                        </div>
                        <div>
                          <h4 className="font-black uppercase line-clamp-1">{match.title}</h4>
                          <p className="text-sm font-bold text-gray-600 mb-2">📍 {match.location}</p>
                          <div className="text-xs bg-neo-green font-bold px-2 py-1 inline-block border-2 border-black">
                            {match.aiTags ? match.aiTags[0] : "MATCH"}
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
