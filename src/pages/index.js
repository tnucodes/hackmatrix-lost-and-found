import { useState, useEffect } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, Search, Plus, MapPin, Trophy, LogOut, 
  MessageSquare, ArrowRight, User, Calendar, CheckCircle2, 
  AlertTriangle, Sparkles, Filter 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, logout } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [stats, setStats] = useState({ active: 0, resolved: 0, points: 0 });
  const [loadingItems, setLoadingItems] = useState(true);
  const [feedFilter, setFeedFilter] = useState("all"); // 'all', 'lost', 'found'
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoadingItems(true);
        const foundSnapshot = await getDocs(collection(db, "foundItems"));
        const lostSnapshot = await getDocs(collection(db, "lostItems"));
        
        const foundData = foundSnapshot.docs.map(doc => ({ id: doc.id, type: "found", ...doc.data() }));
        const lostData = lostSnapshot.docs.map(doc => ({ id: doc.id, type: "lost", ...doc.data() }));
        
        // Combine and sort by date (newest first)
        const combined = [...lostData, ...foundData].sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });
        
        setAllItems(combined);
        
        // Calculate Stats
        const activeCount = combined.filter(item => item.status === "active").length;
        const resolvedCount = combined.filter(item => item.status === "verified_resolved" || item.status === "resolved").length;
        const totalPointsAwarded = resolvedCount * 100;
        setStats({ active: activeCount, resolved: resolvedCount, points: totalPointsAwarded });
        
        // Calculate Leaderboard
        const userPoints = {};
        const processDoc = (data, creatorEmailField) => {
          if (data.status === "verified_resolved" || data.status === "resolved") {
            if (data[creatorEmailField]) {
              userPoints[data[creatorEmailField]] = (userPoints[data[creatorEmailField]] || 0) + 50;
            }
            if (data.status === "verified_resolved" && data.verifiedUserEmail) {
              userPoints[data.verifiedUserEmail] = (userPoints[data.verifiedUserEmail] || 0) + 50;
            }
          }
        };

        foundData.forEach(item => processDoc(item, "finderEmail"));
        lostData.forEach(item => processDoc(item, "ownerEmail"));

        const sorted = Object.keys(userPoints)
          .map(email => ({ email, points: userPoints[email] }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 4);

        setLeaderboard(sorted);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoadingItems(false);
      }
    }
    
    fetchDashboardData();
  }, [user]);

  // Split user items dynamically
  const myLost = allItems.filter(item => item.type === "lost" && (item.ownerId === user?.uid || item.ownerEmail === user?.email));
  const myFound = allItems.filter(item => item.type === "found" && (item.finderId === user?.uid || item.finderEmail === user?.email));

  // Filter and search feed
  const filteredFeed = allItems.filter(item => {
    const matchesFilter = feedFilter === "all" || item.type === feedFilter;
    const matchesSearch = 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.aiTags && item.aiTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

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

  return (
    <div className="min-h-screen bg-neo-bg font-sans relative">
      <Head>
        <title>Campus Trust | Lost & Found Network</title>
        <meta name="description" content="AI-powered, verified lost and found platform for your college campus." />
      </Head>

      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neo-yellow neo-border"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
              className="bg-white neo-card px-12 py-10 flex flex-col items-center justify-center"
            >
              <div className="text-7xl mb-4">🕵️‍♂️</div>
              <h1 className="text-6xl font-black text-center tracking-tighter mb-2 uppercase">
                CAMPUS TRUST
              </h1>
              <h2 className="text-xl font-bold text-center bg-neo-pink px-4 py-1 neo-border uppercase tracking-widest">
                Lost & Found Network
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && (
        <div className="w-full">
          {/* Main Top Header Navigation */}
          <header className="border-b-4 border-black bg-white sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <Link href="/">
                <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2 cursor-pointer">
                  <span className="bg-neo-pink px-2.5 py-1 neo-border text-lg sm:text-2xl">TRUST</span>
                  <span className="hidden sm:inline">LOST & FOUND</span>
                </h1>
              </Link>
              
              <div className="flex gap-4 items-center">
                {user ? (
                  <div className="flex gap-3 items-center">
                    <div className="hidden md:flex flex-col items-end">
                      <span className="font-black text-sm text-black">{user.email.split("@")[0]}</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Student Account</span>
                    </div>
                    <Link href="/inbox" className="bg-neo-purple p-2.5 font-bold neo-button text-white relative">
                      <MessageSquare size={20} />
                      {/* Optional notification indicator */}
                      <span className="absolute -top-2 -right-2 bg-red-500 border-2 border-black text-white text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center">
                        !
                      </span>
                    </Link>
                    <button 
                      onClick={logout}
                      className="bg-red-400 px-4 py-2.5 text-xs font-black uppercase neo-button"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Link href="/login" className="bg-neo-yellow px-4 py-2.5 text-xs font-black uppercase neo-button">
                      Log In
                    </Link>
                    <Link href="/signup" className="bg-neo-blue px-4 py-2.5 text-xs font-black uppercase neo-button">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Premium Landing Hero Section */}
          <section className="bg-neo-yellow border-b-4 border-black py-16 px-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none text-[25vw] font-black tracking-tighter uppercase whitespace-nowrap">
              TRUST BOARD
            </div>
            
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              <div className="lg:col-span-7 flex flex-col items-start">
                <div className="bg-white px-3 py-1 neo-border text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sparkles size={14} className="text-neo-pink fill-neo-pink" /> 100% Student Verified Platform
                </div>
                <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-[1.05] mb-6 text-black">
                  RECLAIM WHAT'S YOURS. <br />
                  <span className="bg-white px-2.5 py-0.5 inline-block my-1 border-4 border-black shadow-[4px_4px_0_#000]">
                    RETURN WHAT'S NOT.
                  </span>
                </h2>
                <p className="text-lg font-bold text-black max-w-xl mb-8 leading-relaxed">
                  The campus network powered by Gemini AI smart matching and secure Handshake PINs. No lost wallets, keys, or IDs left behind.
                </p>
                
                <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                  <Link href="/report-lost" className="flex-1 sm:flex-initial bg-neo-pink px-6 py-4 font-black uppercase tracking-widest neo-button flex items-center justify-center gap-2">
                    <Plus size={20} /> Lost Something
                  </Link>
                  <Link href="/report-found" className="flex-1 sm:flex-initial bg-neo-green px-6 py-4 font-black uppercase tracking-widest neo-button flex items-center justify-center gap-2">
                    <Plus size={20} /> Found Something
                  </Link>
                </div>
              </div>

              {/* Dynamic stats cards container */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                <div className="bg-white p-6 neo-border neo-shadow flex flex-col justify-between h-36">
                  <span className="text-sm font-black uppercase tracking-wider text-gray-500">🔴 ACTIVE ALERTS</span>
                  <span className="text-5xl font-black">{stats.active}</span>
                </div>
                <div className="bg-neo-blue p-6 neo-border neo-shadow flex flex-col justify-between h-36">
                  <span className="text-sm font-black uppercase tracking-wider text-black">✅ RESOLVED</span>
                  <span className="text-5xl font-black">{stats.resolved}</span>
                </div>
                <div className="bg-neo-pink p-6 col-span-2 neo-border neo-shadow flex justify-between items-center h-24">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-wider text-black">🏆 COMMUNITY TRUST POINTS</span>
                    <span className="text-3xl font-black">{stats.points} PT</span>
                  </div>
                  <Trophy size={40} className="text-neo-yellow drop-shadow-[2px_2px_0_#000]" />
                </div>
              </div>
            </div>
          </section>

          {/* Main Dashboard Layout */}
          <main className="max-w-7xl mx-auto px-6 py-12">
            
            {/* Concern 3: Logged in Dashboard for My Items */}
            {user && (
              <div className="mb-14">
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-6 bg-neo-pink px-4 py-1.5 inline-block neo-border">
                  My Active Dashboard 🕵️‍♂️
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* My Lost Items */}
                  <div className="bg-white p-6 neo-border neo-shadow flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b-4 border-black">
                      <h4 className="text-xl font-black uppercase flex items-center gap-2">
                        <span className="text-neo-pink text-2xl">❌</span> My Lost Reports
                      </h4>
                      <span className="bg-neo-pink text-xs font-black px-2.5 py-1 neo-border">
                        {myLost.length} Reports
                      </span>
                    </div>

                    {myLost.length === 0 ? (
                      <div className="py-8 text-center bg-gray-50 border-2 border-dashed border-gray-300 font-bold text-gray-500 italic">
                        No lost items reported yet. Keep details accurate to get matches!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-2">
                        {myLost.map(item => (
                          <div key={item.id} className="border-3 border-black p-4 bg-gray-50 flex justify-between items-center gap-4 hover:bg-gray-100 transition-colors">
                            <div className="min-w-0 flex-grow">
                              <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 border border-black mb-1 ${item.status === 'verified_resolved' ? 'bg-neo-blue text-white' : 'bg-neo-yellow'}`}>
                                {item.status === 'verified_resolved' ? 'Resolved' : 'Active'}
                              </span>
                              <h5 className="font-black uppercase truncate text-base leading-tight">{item.title}</h5>
                              <p className="text-xs text-gray-500 font-bold mt-1">📍 {item.location}</p>
                              
                              {item.status === 'active' && (
                                <div className="mt-2 inline-flex items-center gap-1.5 bg-white px-2 py-1 border-2 border-black text-xs font-bold font-mono shadow-[2px_2px_0_#000]">
                                  <span>HANDSHAKE PIN:</span>
                                  <span className="bg-neo-yellow px-1">{item.handshakeCode || "0000"}</span>
                                </div>
                              )}
                            </div>
                            <Link href={`/item/${item.id}?type=lost`} className="bg-neo-blue py-2 px-3 text-xs font-black uppercase neo-button shrink-0 text-center">
                              Details
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* My Found Items */}
                  <div className="bg-white p-6 neo-border neo-shadow flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b-4 border-black">
                      <h4 className="text-xl font-black uppercase flex items-center gap-2">
                        <span className="text-neo-green text-2xl">📦</span> My Found Reports
                      </h4>
                      <span className="bg-neo-green text-xs font-black px-2.5 py-1 neo-border">
                        {myFound.length} Reports
                      </span>
                    </div>

                    {myFound.length === 0 ? (
                      <div className="py-8 text-center bg-gray-50 border-2 border-dashed border-gray-300 font-bold text-gray-500 italic">
                        No found items reported yet. Thank you for reporting what you find!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-2">
                        {myFound.map(item => (
                          <div key={item.id} className="border-3 border-black p-4 bg-gray-50 flex justify-between items-center gap-4 hover:bg-gray-100 transition-colors">
                            <div className="min-w-0 flex-grow">
                              <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 border border-black mb-1 ${item.status === 'verified_resolved' ? 'bg-neo-blue text-white' : 'bg-neo-green'}`}>
                                {item.status === 'verified_resolved' ? 'Resolved' : 'Active'}
                              </span>
                              <h5 className="font-black uppercase truncate text-base leading-tight">{item.title}</h5>
                              <p className="text-xs text-gray-500 font-bold mt-1">📍 {item.location}</p>
                              
                              {item.status === 'active' && (
                                <div className="mt-2 inline-flex items-center gap-1.5 bg-white px-2 py-1 border-2 border-black text-xs font-bold font-mono shadow-[2px_2px_0_#000]">
                                  <span>HANDSHAKE PIN:</span>
                                  <span className="bg-neo-yellow px-1">{item.handshakeCode || "0000"}</span>
                                </div>
                              )}
                            </div>
                            <Link href={`/item/${item.id}?type=found`} className="bg-neo-blue py-2 px-3 text-xs font-black uppercase neo-button shrink-0 text-center">
                              Details
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Core Section: Merged Board & Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Concern 2: Integrated Campus Feed - Left Column (Col-Span 8) */}
              <section className="lg:col-span-8 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b-4 border-black pb-4">
                  <h3 className="text-3xl font-black uppercase tracking-tighter">
                    🏫 Campus Feed
                  </h3>
                  
                  {/* Category switcher */}
                  <div className="flex gap-2 flex-wrap">
                    <button 
                      onClick={() => setFeedFilter("all")}
                      className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black tracking-wider transition-colors ${feedFilter === "all" ? "bg-black text-white" : "bg-white hover:bg-gray-100"}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFeedFilter("lost")}
                      className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black tracking-wider transition-colors ${feedFilter === "lost" ? "bg-neo-pink text-black shadow-[2px_2px_0_#000]" : "bg-white hover:bg-gray-100"}`}
                    >
                      Lost
                    </button>
                    <button 
                      onClick={() => setFeedFilter("found")}
                      className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black tracking-wider transition-colors ${feedFilter === "found" ? "bg-neo-green text-black shadow-[2px_2px_0_#000]" : "bg-white hover:bg-gray-100"}`}
                    >
                      Found
                    </button>
                  </div>
                </div>

                {/* Feed Search Input */}
                <div className="relative mb-8 neo-shadow">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black">
                    <Search size={22} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search by keywords, location descriptions, or AI tags..."
                    className="w-full pl-12 pr-4 py-4 text-base font-bold border-4 border-black bg-white focus:outline-none focus:bg-gray-50 focus:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {loadingItems ? (
                  <div className="p-8 text-center neo-card font-black text-xl bg-white">
                    🔄 Scanning the campus databases...
                  </div>
                ) : filteredFeed.length === 0 ? (
                  <div className="p-12 text-center neo-card bg-white">
                    <AlertTriangle size={48} className="mx-auto mb-4 text-neo-yellow drop-shadow-[2px_2px_0_#000]" />
                    <h4 className="text-xl font-black uppercase mb-2">No Items Found</h4>
                    <p className="font-bold text-gray-500">
                      Try expanding your search query or check back later!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredFeed.map((item) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white neo-card flex flex-col h-full group"
                      >
                        {/* Image Section */}
                        <div className="h-44 border-b-4 border-black bg-gray-200 overflow-hidden relative flex items-center justify-center shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center font-black uppercase text-gray-400 select-none bg-gray-100">
                              <span className="text-3xl mb-1">{item.type === 'lost' ? '🔍' : '📦'}</span>
                              <span className="text-xs">No image provided</span>
                            </div>
                          )}
                          
                          {/* Top corner category badge */}
                          <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                            <span className={`font-black text-[10px] uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0_#000] ${item.type === "lost" ? "bg-neo-pink text-black" : "bg-neo-green text-black"}`}>
                              {item.type}
                            </span>
                            <span className={`font-black text-[10px] uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0_#000] ${item.status === 'verified_resolved' || item.status === 'resolved' ? 'bg-neo-blue text-white' : 'bg-neo-yellow text-black'}`}>
                              {item.status === 'verified_resolved' || item.status === 'resolved' ? 'Resolved' : 'Active'}
                            </span>
                          </div>
                        </div>

                        {/* Card Info Section */}
                        <div className="p-5 flex flex-col flex-grow">
                          <h4 className="text-lg font-black uppercase line-clamp-1 group-hover:text-neo-pink transition-colors">
                            {item.title}
                          </h4>
                          
                          <div className="flex gap-4 items-center text-xs font-bold text-gray-500 my-2">
                            <span className="flex items-center gap-1 shrink-0">
                              <MapPin size={14} className="text-black" /> {item.location}
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Calendar size={14} /> {formatDate(item.createdAt)}
                            </span>
                          </div>

                          <p className="font-medium text-sm text-gray-700 line-clamp-2 mb-4 flex-grow">
                            {item.description}
                          </p>

                          {/* AI tag pill container */}
                          {item.aiTags && item.aiTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {item.aiTags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <Link 
                            href={`/item/${item.id}?type=${item.type}`}
                            className="bg-neo-blue py-2.5 w-full text-center text-xs font-black uppercase neo-button tracking-wider"
                          >
                            View & Interact
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {/* Sidebar Area: Leaders & Info - Right Column (Col-Span 4) */}
              <aside className="lg:col-span-4 flex flex-col gap-8">
                
                {/* Trust Leaders Card */}
                <div className="bg-white p-6 neo-border neo-shadow flex flex-col">
                  <h3 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-4 flex items-center gap-2">
                    <Trophy size={26} className="text-neo-yellow drop-shadow-[1.5px_1.5px_0_#000]" /> Trust Leaders
                  </h3>
                  
                  {leaderboard.length === 0 ? (
                    <p className="font-bold text-gray-500 italic mt-4 text-center">
                      No points awarded yet. Return an item to rank first!
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3 mt-2">
                      {leaderboard.map((leader, index) => {
                        const rankColors = [
                          "bg-neo-yellow border-neo-yellow text-black font-black", // 1st
                          "bg-neo-blue border-neo-blue text-black font-bold", // 2nd
                          "bg-neo-pink border-neo-pink text-black font-bold", // 3rd
                          "bg-gray-100 border-gray-300 text-gray-600 font-bold" // 4th
                        ];
                        const badges = ["👑 1st", "🥈 2nd", "🥉 3rd", "🎖️ 4th"];
                        
                        return (
                          <li 
                            key={index} 
                            className={`flex justify-between items-center border-2 border-black p-3 ${index === 0 ? "shadow-[3px_3px_0_#000]" : ""}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-[10px] uppercase font-black px-2 py-0.5 border-2 border-black ${rankColors[index] || "bg-gray-50"}`}>
                                {badges[index] || `#${index + 1}`}
                              </span>
                              <span className="truncate font-black text-sm">{leader.email.split("@")[0]}</span>
                            </div>
                            <span className="bg-neo-green px-2 py-0.5 border-2 border-black font-black text-xs shrink-0 shadow-[1px_1px_0_#000]">
                              {leader.points} TP
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <p className="text-[10px] font-bold text-gray-500 mt-4 leading-normal bg-gray-50 p-2.5 border border-dashed border-gray-300">
                    ℹ️ Users earn **50 Trust Points** each when an item return is verified using the 4-digit handshake PIN system.
                  </p>
                </div>

                {/* How it Works / Trust Process */}
                <div className="bg-white p-6 neo-border neo-shadow">
                  <h3 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-4">
                    🤝 The Trust Loop
                  </h3>
                  
                  <div className="flex flex-col gap-6 mt-4">
                    <div className="flex gap-4 items-start">
                      <div className="bg-neo-pink border-2 border-black p-2 font-black shadow-[2px_2px_0_#000] shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase">Snap & Report</h4>
                        <p className="text-xs font-bold text-gray-600 mt-0.5">
                          Upload item info. Gemini AI automatically indexes description and keywords.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="bg-neo-blue border-2 border-black p-2 font-black shadow-[2px_2px_0_#000] shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase">Secure Chat</h4>
                        <p className="text-xs font-bold text-gray-600 mt-0.5">
                          Initiate communication on active claims. Chat anonymously inside the platform.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="bg-neo-green border-2 border-black p-2 font-black shadow-[2px_2px_0_#000] shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase">Handshake Verification</h4>
                        <p className="text-xs font-bold text-gray-600 mt-0.5">
                          Exchange code generated for your item. Verification unlocks points and closes cases.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secure Notice */}
                <div className="bg-neo-blue p-6 border-4 border-black shadow-[6px_6px_0_#000]">
                  <div className="bg-white p-2.5 inline-block neo-border mb-3">
                    <ShieldAlert size={28} />
                  </div>
                  <h4 className="text-lg font-black uppercase mb-1">Campus Guard</h4>
                  <p className="text-xs font-bold text-black leading-relaxed">
                    Always meet in populated campus areas (like libraries, cafeterias, or student centers) to verify handshake codes and return items.
                  </p>
                </div>
              </aside>

            </div>
          </main>
        </div>
      )}
    </div>
  );
}

