import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { Send, ArrowLeft, Trophy, ShieldAlert, Sparkles } from "lucide-react";

export default function ChatRoom() {
  const router = useRouter();
  const { id: chatId } = router.query;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [itemMeta, setItemMeta] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch parent item metadata
  useEffect(() => {
    if (!chatId) return;

    async function fetchChatAndItemMeta() {
      try {
        const chatDocRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatDocRef);
        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          
          // Look up the item in lostItems
          let itemDocSnap = await getDoc(doc(db, "lostItems", chatData.itemId));
          let resolvedType = "lost";
          
          // Fallback to foundItems
          if (!itemDocSnap.exists()) {
            itemDocSnap = await getDoc(doc(db, "foundItems", chatData.itemId));
            resolvedType = "found";
          }
          
          if (itemDocSnap.exists()) {
            setItemMeta({ id: itemDocSnap.id, type: resolvedType, ...itemDocSnap.data() });
          }
        }
      } catch (err) {
        console.error("Failed to load chat item metadata:", err);
      }
    }

    fetchChatAndItemMeta();
  }, [chatId]);

  // Listen to messages in real-time!
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    // onSnapshot automatically updates whenever a new message is added to Firestore
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe(); // Cleanup listener when we leave the page
  }, [chatId]);

  // Auto-scroll to bottom whenever messages array changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        senderEmail: user.email,
        createdAt: serverTimestamp()
      });
      setNewMessage(""); // Clear the input
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (!user) return <div className="p-10 font-black text-xl">Please log in to chat.</div>;

  const isCreator = itemMeta && (
    (itemMeta.type === "found" && user.uid === itemMeta.finderId) || 
    (itemMeta.type === "lost" && user.uid === itemMeta.ownerId)
  );

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-neo-bg flex flex-col font-sans">
      {/* Chat Header */}
      <header className="bg-neo-blue p-4 border-b-4 border-black flex justify-between items-center sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/inbox" className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#000]">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight leading-none">Live Claim Chat</h1>
            {itemMeta && (
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mt-1 block">
                Item: {itemMeta.title}
              </span>
            )}
          </div>
        </div>

        {itemMeta && (
          <Link 
            href={`/item/${itemMeta.id}?type=${itemMeta.type}`}
            className="bg-white border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_#000] hover:bg-neo-yellow transition-colors"
          >
            View Item
          </Link>
        )}
      </header>

      {/* Message Info/Verification Banner */}
      {itemMeta && itemMeta.status !== "verified_resolved" && itemMeta.status !== "resolved" && (
        <div className="bg-neo-yellow border-b-4 border-black p-3 text-xs font-bold text-black flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-black shrink-0" />
            <span>
              {itemMeta.type === "found" ? (
                isCreator ? (
                  <>Give this PIN to the owner when meeting: <strong className="font-mono bg-white px-1.5 py-0.5 border border-black">{itemMeta.handshakeCode}</strong></>
                ) : (
                  <>Meet the finder and ask for their 4-digit Handshake Code to verify return & get points.</>
                )
              ) : (
                isCreator ? (
                  <>Coordinate with the finder to retrieve your item. Once they report it as found, verify the exchange using their found report PIN.</>
                ) : (
                  <>If you found this item, report it to generate a secure Handshake PIN, or coordinate details here.</>
                )
              )}
            </span>
          </div>
          {itemMeta.type === "found" && !isCreator && (
            <Link 
              href={`/item/${itemMeta.id}?type=found`}
              className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase tracking-wide shrink-0 border border-black hover:bg-gray-800"
            >
              Verify Code &rarr;
            </Link>
          )}
          {itemMeta.type === "lost" && !isCreator && (
            <Link 
              href="/report-found"
              className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase tracking-wide shrink-0 border border-black hover:bg-gray-800"
            >
              Report Found &rarr;
            </Link>
          )}
        </div>
      )}

      {itemMeta && (itemMeta.status === "verified_resolved" || itemMeta.status === "resolved") && (
        <div className="bg-neo-green border-b-4 border-black p-3 text-xs font-black uppercase text-center flex items-center justify-center gap-1.5 shrink-0">
          <Sparkles size={16} /> Return Completed! Both participants earned 50 Trust Points.
        </div>
      )}

      {/* Messages Area */}
      <main className="flex-grow p-6 flex flex-col gap-4 overflow-y-auto max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="bg-white neo-card p-8 text-center font-bold border-4 border-black shadow-[4px_4px_0_#000]">
            💬 No messages yet. Coordinate a safe campus meeting point to return the item!
          </div>
        )}
        
        <div className="flex flex-col gap-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === user.uid;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-[10px] font-black text-gray-500 mb-1 px-1">
                  {isMe ? "You" : msg.senderEmail.split("@")[0]}
                </span>
                <div 
                  className={`px-4 py-3 border-3 border-black font-bold max-w-[80%] text-sm shadow-[3px_3px_0_#000] ${
                    isMe ? "bg-neo-green text-black" : "bg-white text-black"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input Form */}
      <footer className="bg-white p-4 border-t-4 border-black shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Suggest a safe campus meeting location..."
            className="flex-grow p-4 border-4 border-black focus:outline-none focus:bg-gray-50 font-bold shadow-[2px_2px_0_#000]"
          />
          <button 
            type="submit" 
            className="bg-neo-pink px-6 py-4 neo-button font-black uppercase flex items-center gap-2 text-black shadow-[2px_2px_0_#000]"
          >
            Send <Send size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
}
