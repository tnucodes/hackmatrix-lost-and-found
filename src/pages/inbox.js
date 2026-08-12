import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, ArrowRight, Calendar, User } from "lucide-react";

export default function Inbox() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchChats() {
      try {
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", user.uid));
        const snapshot = await getDocs(q);
        
        const chatList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by most recently updated
        chatList.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : 0);
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : 0);
          return timeB - timeA;
        });

        setChats(chatList);
      } catch (err) {
        console.error("Error fetching inbox:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchChats();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Recently";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!user) {
    return <div className="p-10 font-black text-2xl">Please log in to view your inbox.</div>;
  }

  return (
    <div className="min-h-screen bg-neo-bg font-sans">
      <header className="bg-neo-purple p-6 border-b-4 border-black flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-3xl font-black uppercase tracking-widest flex items-center gap-3 text-white">
          <MessageSquare size={32} className="drop-shadow-[1.5px_1.5px_0_#000]" /> My Inbox
        </h1>
        <Link href="/" className="font-black uppercase text-xs text-white hover:text-black bg-black/20 px-4 py-2.5 neo-button border-2">
          &larr; Back to Dashboard
        </Link>
      </header>

      <main className="p-6 max-w-4xl mx-auto mt-10">
        {loading ? (
          <div className="text-2xl font-black text-center p-12 bg-white neo-card">
            🔄 Retrieving active chats...
          </div>
        ) : chats.length === 0 ? (
          <div className="bg-white neo-card p-10 text-center border-4 border-black shadow-[6px_6px_0_#000]">
            <h2 className="text-2xl font-black uppercase mb-4">Your inbox is empty</h2>
            <p className="font-bold text-gray-600 mb-6">You don't have any active claims or conversations right now.</p>
            <Link href="/" className="bg-neo-blue px-6 py-3 font-black uppercase neo-button inline-block text-black">
              Browse Active Feed
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {chats.map(chat => (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                key={chat.id} 
              >
                <Link href={`/chat/${chat.id}`}>
                  <div className="bg-white neo-card p-6 flex justify-between items-center group cursor-pointer hover:bg-gray-50 border-4 border-black shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] hover:-translate-y-0.5 transition-all">
                    <div className="min-w-0 flex-grow">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className="bg-neo-yellow px-2 py-0.5 border-2 border-black font-black uppercase text-[10px] shadow-[1px_1px_0_#000]">
                          CLAIM CHAT
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                          <Calendar size={12} /> {formatDate(chat.updatedAt)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-black uppercase truncate pr-4">
                        {chat.itemTitle}
                      </h3>
                      
                      <p className="text-gray-500 font-bold text-xs mt-2 flex items-center gap-1.5">
                        <User size={14} className="text-black" /> Click to join secure communication channel
                      </p>
                    </div>
                    
                    <div className="bg-black text-white p-3.5 border-3 border-black group-hover:bg-neo-pink transition-colors shrink-0 shadow-[2px_2px_0_#000] group-hover:text-black">
                      <ArrowRight size={22} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
