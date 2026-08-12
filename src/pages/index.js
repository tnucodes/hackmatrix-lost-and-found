import { useState, useEffect } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Search, Plus, MapPin, Trophy, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, logout } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const foundSnapshot = await getDocs(collection(db, "foundItems"));
        const lostSnapshot = await getDocs(collection(db, "lostItems"));
        
        const userPoints = {};
        
        const processDoc = (data, creatorEmailField) => {
          if (data.status === "verified_resolved" || data.status === "resolved") {
            // Give 50 points to the person who posted it
            if (data[creatorEmailField]) {
              userPoints[data[creatorEmailField]] = (userPoints[data[creatorEmailField]] || 0) + 50;
            }
            // Give 50 points to the person who verified the transaction
            if (data.status === "verified_resolved" && data.verifiedUserEmail) {
              userPoints[data.verifiedUserEmail] = (userPoints[data.verifiedUserEmail] || 0) + 50;
            }
          }
        };

        foundSnapshot.docs.forEach(doc => processDoc(doc.data(), "finderEmail"));
        lostSnapshot.docs.forEach(doc => processDoc(doc.data(), "ownerEmail"));

        const sorted = Object.keys(userPoints)
          .map(email => ({ email, points: userPoints[email] }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 3);

        setLeaderboard(sorted);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      }
    }
    
    fetchLeaderboard();
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

      {!showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6 max-w-5xl mx-auto"
        >
          <header className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              <span className="bg-neo-pink px-2 py-1 neo-border">L&F</span> Board
            </h1>
            
            <div className="flex gap-4 items-center">
              {user ? (
                <>
                  <span className="font-bold border-b-2 border-black hidden sm:block">
                    {user.email}
                  </span>
                  <button 
                    onClick={logout}
                    className="bg-red-400 px-4 py-2 font-bold neo-card hover:neo-card-hover flex items-center gap-2"
                  >
                    <LogOut size={20} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="bg-neo-yellow px-4 py-2 font-bold neo-card hover:neo-card-hover">
                    Log In
                  </Link>
                  <Link href="/signup" className="bg-neo-blue px-4 py-2 font-bold neo-card hover:neo-card-hover hidden sm:block">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </header>

          <div className="flex gap-4 mb-10 flex-wrap">
            <Link href="/browse" className="bg-neo-blue px-4 py-2 font-bold neo-card hover:neo-card-hover flex items-center gap-2">
              <Search size={20} /> Browse Feed
            </Link>
            <Link href="/report-found" className="bg-neo-green px-4 py-2 font-bold neo-card hover:neo-card-hover flex items-center gap-2">
              <Plus size={20} /> Found Something
            </Link>
            <Link href="/report-lost" className="bg-neo-pink px-4 py-2 font-bold neo-card hover:neo-card-hover flex items-center gap-2">
              <Plus size={20} /> Lost Something
            </Link>
            <Link href="/inbox" className="bg-neo-purple px-4 py-2 font-bold neo-card hover:neo-card-hover flex items-center gap-2 text-white">
              <MessageSquare size={20} /> My Inbox
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neo-yellow p-6 neo-border neo-shadow">
                <div className="bg-white p-3 inline-block neo-border mb-4">
                  <ShieldAlert size={32} />
                </div>
                <h2 className="text-2xl font-black mb-2 uppercase">Secure & Verified</h2>
                <p className="font-bold">Login with your student email to ensure a trusted campus environment.</p>
              </div>

              <div className="bg-neo-blue p-6 neo-border neo-shadow">
                <div className="bg-white p-3 inline-block neo-border mb-4">
                  <MapPin size={32} />
                </div>
                <h2 className="text-2xl font-black mb-2 uppercase">Interactive Maps</h2>
                <p className="font-bold">Pinpoint exactly where you lost or found an item on the campus map.</p>
              </div>
            </div>

            <div className="bg-white p-6 neo-border neo-shadow flex flex-col">
              <h2 className="text-2xl font-black uppercase mb-4 flex items-center gap-2 border-b-4 border-black pb-2">
                <Trophy size={28} className="text-neo-yellow" /> Trust Leaders
              </h2>
              {leaderboard.length === 0 ? (
                <p className="font-bold text-gray-500 italic mt-4">No one has claimed points yet. Be the first!</p>
              ) : (
                <ul className="flex flex-col gap-4 mt-2">
                  {leaderboard.map((leader, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 border-2 border-black p-2 font-bold">
                      <span className="truncate max-w-[150px]">{leader.email.split("@")[0]}</span>
                      <span className="bg-neo-green px-2 py-1 border-2 border-black text-sm">
                        {leader.points} PT
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
