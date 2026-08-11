import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { Send } from "lucide-react";

export default function ChatRoom() {
  const router = useRouter();
  const { id: chatId } = router.query;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-neo-bg flex flex-col font-sans">
      {/* Chat Header */}
      <header className="bg-neo-blue p-4 border-b-4 border-black flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-black uppercase tracking-widest">Live Chat</h1>
        <Link href="/browse" className="font-bold underline hover:text-white">
          &larr; Back to Feed
        </Link>
      </header>

      {/* Messages Area */}
      <main className="flex-grow p-6 flex flex-col gap-4 overflow-y-auto max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="bg-white neo-card p-6 text-center font-bold">
            No messages yet. Send a message to claim or return this item!
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className="text-xs font-bold mb-1 px-1">{msg.senderEmail}</span>
              <div className={`px-4 py-3 border-2 border-black font-medium max-w-[80%] ${isMe ? "bg-neo-green" : "bg-white"}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input Form */}
      <footer className="bg-white p-4 border-t-4 border-black">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-4 neo-border focus:outline-none focus:bg-gray-50 font-bold"
          />
          <button 
            type="submit" 
            className="bg-neo-pink px-6 py-4 neo-button font-black uppercase flex items-center gap-2"
          >
            Send <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}
