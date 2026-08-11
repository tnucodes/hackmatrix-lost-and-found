import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, MessageSquare, Plus } from "lucide-react";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  // Auto-hide the splash screen after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-neo-bg font-sans relative">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neo-yellow neo-border"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
              className="bg-white neo-card px-12 py-10 flex flex-col items-center justify-center"
            >
              <div className="text-6xl mb-4">🕵️‍♂️</div>
              <h1 className="text-5xl font-black text-center tracking-tight mb-2 uppercase">
                Hackmatrix
              </h1>
              <h2 className="text-2xl font-bold text-center bg-neo-blue px-3 py-1 neo-border">
                Lost & Found
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dashboard - Visible after splash */}
      {!showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6 max-w-5xl mx-auto"
        >
          {/* Header */}
          <header className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              <span className="bg-neo-pink px-2 py-1 neo-border">L&F</span> Board
            </h1>
            <div className="flex gap-4">
              <button className="bg-neo-blue px-4 py-2 font-bold neo-card hover:neo-card-hover flex items-center gap-2">
                <Search size={20} /> Browse
              </button>
              <button className="bg-neo-green px-4 py-2 font-bold neo-card hover:neo-card-hover flex items-center gap-2">
                <Plus size={20} /> Report Item
              </button>
            </div>
          </header>

          {/* Grid of features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white neo-card hover:neo-card-hover p-8">
              <div className="bg-neo-purple p-3 inline-block neo-border mb-4">
                <MapPin size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Live Map View</h3>
              <p className="text-lg font-medium text-gray-700">
                Pinpoint exactly where items were lost or found on campus.
              </p>
            </div>
            
            <div className="bg-white neo-card hover:neo-card-hover p-8">
              <div className="bg-neo-pink p-3 inline-block neo-border mb-4">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Real-time Chat</h3>
              <p className="text-lg font-medium text-gray-700">
                Instantly connect with the finder and arrange a safe meetup.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
