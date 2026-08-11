import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Browse() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'lost', 'found'

  useEffect(() => {
    async function fetchItems() {
      try {
        // Fetch Lost Items
        const lostQuery = query(collection(db, "lostItems"), orderBy("createdAt", "desc"));
        const lostSnapshot = await getDocs(lostQuery);
        const lostData = lostSnapshot.docs.map(doc => ({ id: doc.id, type: "lost", ...doc.data() }));

        // Fetch Found Items
        const foundQuery = query(collection(db, "foundItems"), orderBy("createdAt", "desc"));
        const foundSnapshot = await getDocs(foundQuery);
        const foundData = foundSnapshot.docs.map(doc => ({ id: doc.id, type: "found", ...doc.data() }));

        // Combine and sort by date (newest first)
        const combined = [...lostData, ...foundData].sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });

        setItems(combined);
      } catch (err) {
        console.error("Error fetching items:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, []);

  const filteredItems = items.filter(item => filter === "all" || item.type === filter);

  return (
    <div className="min-h-screen bg-neo-bg p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            <span className="bg-neo-yellow px-2 py-1 neo-border">Campus Feed</span>
          </h1>
          <Link href="/" className="font-bold underline text-blue-600 hover:text-blue-800">
            &larr; Back to Dashboard
          </Link>
        </header>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-bold neo-border ${filter === "all" ? "bg-black text-white" : "bg-white hover:bg-gray-100"}`}
          >
            All Items
          </button>
          <button 
            onClick={() => setFilter("lost")}
            className={`px-4 py-2 font-bold neo-border ${filter === "lost" ? "bg-neo-pink" : "bg-white hover:bg-neo-pink"}`}
          >
            Lost
          </button>
          <button 
            onClick={() => setFilter("found")}
            className={`px-4 py-2 font-bold neo-border ${filter === "found" ? "bg-neo-green" : "bg-white hover:bg-neo-green"}`}
          >
            Found
          </button>
        </div>

        {loading ? (
          <p className="text-2xl font-bold">Loading items...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white neo-card flex flex-col"
              >
                {/* Image Section */}
                <div className="h-48 border-b-4 border-black bg-gray-200 overflow-hidden relative flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
                  ) : (
                    <span className="font-bold text-gray-500">No Image</span>
                  )}
                  {/* Tag */}
                  <div className={`absolute top-2 right-2 px-3 py-1 font-black uppercase text-sm border-2 border-black ${item.type === 'lost' ? 'bg-neo-pink' : 'bg-neo-green'}`}>
                    {item.type}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-xl font-black uppercase line-clamp-1">{item.title}</h3>
                  <p className="text-sm font-bold text-gray-600 mb-2 mt-1">📍 {item.location}</p>
                  <p className="font-medium text-gray-800 line-clamp-3 mb-4 flex-grow">
                    {item.description}
                  </p>
                  
                  <Link 
                    href={`/item/${item.id}?type=${item.type}`}
                    className="w-full bg-neo-blue p-2 font-bold uppercase neo-border hover:bg-blue-300 transition-colors mt-auto text-sm tracking-wide text-center block"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}

            {filteredItems.length === 0 && (
              <p className="col-span-full text-xl font-bold p-8 bg-white neo-border text-center">
                No items found for this category!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
