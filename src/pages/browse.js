import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, ArrowLeft, AlertTriangle } from "lucide-react";

export default function Browse() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'lost', 'found'
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    let foundData = [];
    let lostData = [];

    const updateItemsList = () => {
      // Combine and sort by date (newest first)
      const combined = [...lostData, ...foundData].sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      setItems(combined);
      setLoading(false);
    };

    const foundQuery = query(collection(db, "foundItems"), orderBy("createdAt", "desc"));
    const lostQuery = query(collection(db, "lostItems"), orderBy("createdAt", "desc"));

    const unsubFound = onSnapshot(foundQuery, (snapshot) => {
      foundData = snapshot.docs.map(doc => ({ id: doc.id, type: "found", ...doc.data() }));
      updateItemsList();
    }, (err) => {
      console.error("Found subscription failed:", err);
      setLoading(false);
    });

    const unsubLost = onSnapshot(lostQuery, (snapshot) => {
      lostData = snapshot.docs.map(doc => ({ id: doc.id, type: "lost", ...doc.data() }));
      updateItemsList();
    }, (err) => {
      console.error("Lost subscription failed:", err);
      setLoading(false);
    });

    return () => {
      unsubFound();
      unsubLost();
    };
  }, []);

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === "all" || item.type === filter;
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
    <div className="min-h-screen bg-neo-bg p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b-4 border-black pb-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            <span className="bg-neo-yellow px-3 py-1.5 neo-border">Campus Feed</span>
          </h1>
          <Link href="/" className="font-bold underline text-black hover:text-neo-pink flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </header>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex gap-2 flex-wrap shrink-0">
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-2 font-black uppercase text-sm border-3 border-black transition-colors ${filter === "all" ? "bg-black text-white shadow-[2px_2px_0_#000]" : "bg-white hover:bg-gray-100 shadow-[2px_2px_0_#000]"}`}
            >
              All Items
            </button>
            <button 
              onClick={() => setFilter("lost")}
              className={`px-4 py-2 font-black uppercase text-sm border-3 border-black transition-colors ${filter === "lost" ? "bg-neo-pink text-black shadow-[2px_2px_0_#000]" : "bg-white hover:bg-neo-pink shadow-[2px_2px_0_#000]"}`}
            >
              Lost Alerts
            </button>
            <button 
              onClick={() => setFilter("found")}
              className={`px-4 py-2 font-black uppercase text-sm border-3 border-black transition-colors ${filter === "found" ? "bg-neo-green text-black shadow-[2px_2px_0_#000]" : "bg-white hover:bg-neo-green shadow-[2px_2px_0_#000]"}`}
            >
              Found Reports
            </button>
          </div>

          <div className="relative flex-grow shadow-[2px_2px_0_#000]">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search feed by titles, locations, descriptions, or AI tags..."
              className="w-full pl-10 pr-4 py-2 text-sm font-bold border-3 border-black bg-white focus:outline-none focus:bg-gray-50 focus:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-2xl font-black text-center p-12 bg-white neo-card border-4 border-black shadow-[6px_6px_0_#000]">
            🔄 Scanning college registers...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white neo-card flex flex-col border-4 border-black shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] hover:-translate-y-0.5 transition-all group"
              >
                {/* Image Section */}
                <div className="h-48 border-b-4 border-black bg-gray-200 overflow-hidden relative flex items-center justify-center shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center font-black uppercase text-gray-400 select-none bg-gray-100">
                      <span className="text-4xl mb-1">{item.type === 'lost' ? '🔍' : '📦'}</span>
                      <span className="text-xs">No image provided</span>
                    </div>
                  )}

                  {/* Top corner status/type badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                    <span className={`font-black text-[9px] uppercase px-2 py-0.5 border-2 border-black shadow-[1.5px_1.5px_0_#000] ${item.type === "lost" ? "bg-neo-pink text-black" : "bg-neo-green text-black"}`}>
                      {item.type}
                    </span>
                    <span className={`font-black text-[9px] uppercase px-2 py-0.5 border-2 border-black shadow-[1.5px_1.5px_0_#000] ${item.status === 'verified_resolved' || item.status === 'resolved' ? 'bg-neo-blue text-white' : 'bg-neo-yellow text-black'}`}>
                      {item.status === 'verified_resolved' || item.status === 'resolved' ? 'Resolved' : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-black uppercase line-clamp-1 group-hover:text-neo-pink transition-colors">{item.title}</h3>
                  
                  <div className="flex gap-4 items-center text-[10px] font-bold text-gray-500 my-2">
                    <span className="flex items-center gap-0.5 shrink-0">
                      <MapPin size={12} className="text-black" /> {item.location}
                    </span>
                    <span className="flex items-center gap-0.5 shrink-0">
                      <Calendar size={12} /> {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <p className="font-medium text-sm text-gray-700 line-clamp-3 mb-4 flex-grow">
                    {item.description}
                  </p>

                  {/* AI Tags */}
                  {item.aiTags && item.aiTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.aiTags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <Link 
                    href={`/item/${item.id}?type=${item.type}`}
                    className="w-full bg-neo-blue py-3 font-black uppercase border-3 border-black text-xs hover:bg-blue-300 text-center block shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#000]"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white border-4 border-black shadow-[6px_6px_0_#000]">
                <AlertTriangle size={48} className="mx-auto mb-4 text-neo-yellow drop-shadow-[2px_2px_0_#000]" />
                <h3 className="text-2xl font-black uppercase mb-2">No Items Listed</h3>
                <p className="font-bold text-gray-500">
                  No active lost or found items matched your search query in this category!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
