import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, ArrowRight } from "lucide-react";

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
          const timeA = a.updatedAt?.toMillis() || 0;
          const timeB = b.updatedAt?.toMillis() || 0;
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

  if (!user) {
    return <div className="p-10 font-black text-2xl">Please log in to view your inbox.</div>;
  }

  return (
    <div className="min-h-screen bg-neo-bg font-sans">
      <header className="bg-neo-purple p-6 border-b-4 border-black flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-3xl font-black uppercase tracking-widest flex items-center gap-3 text-white">
          <MessageSquare size={32} /> My Inbox
        </h1>
        <Link href="/" className="font-bold underline text-white hover:text-black bg-black/20 px-3 py-1 neo-border">
          &larr; Back to Dashboard
        </Link>
      </header>

      <main className="p-6 max-w-4xl mx-auto mt-10">
        {loading ? (
          <div className="text-2xl font-black">Loading messages...</div>
        ) : chats.length === 0 ? (
          <div className="bg-white neo-card p-10 text-center">
            <h2 className="text-2xl font-black uppercase mb-4">Your inbox is empty</h2>
            <p className="font-bold text-gray-600 mb-6">You don't have any active conversations right now.</p>
            <Link href="/browse" className="bg-neo-blue px-6 py-3 font-black uppercase neo-button inline-block">
              Browse Feed
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {chats.map(chat => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                key={chat.id} 
              >
                <Link href={`/chat/${chat.id}`}>
                  <div className="bg-white neo-card p-6 flex justify-between items-center group cursor-pointer hover:bg-gray-50">
                    <div>
                      <h3 className="text-xl font-black uppercase flex items-center gap-2">
                        <span className="bg-neo-yellow px-2 py-1 neo-border border-2 text-sm">Item</span> 
                        {chat.itemTitle}
                      </h3>
                      <p className="text-gray-500 font-bold mt-2">
                        Click to view conversation
                      </p>
                    </div>
                    <div className="bg-black text-white p-3 neo-border group-hover:bg-neo-pink transition-colors">
                      <ArrowRight size={24} />
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
