import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault(); 
    try {
      await signup(email, password);
      router.push("/"); // Go to homepage after successful signup
    } catch (err) {
      setError(err.message || "Failed to create an account.");
    }
  };

  return (
    <div className="min-h-screen bg-neo-bg flex flex-col items-center justify-center p-6 font-sans">
      <Link href="/" className="font-bold underline text-black hover:text-neo-pink flex items-center gap-2 mb-6 w-fit">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white border-4 border-black p-8 shadow-[8px_8px_0_#000]"
      >
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-6 bg-neo-pink inline-block px-3 py-1.5 border-4 border-black shadow-[3px_3px_0_#000]">
          Join Campus Trust 🤝
        </h2>

        {error && (
          <div className="bg-red-200 text-red-950 border-3 border-black p-3 font-bold mb-5 flex items-start gap-2 shadow-[2px_2px_0_#000]">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div>
            <label className="block font-black uppercase text-xs tracking-wider mb-1.5 text-gray-700">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="name@college.edu"
              className="w-full p-4 border-4 border-black bg-white focus:outline-none focus:bg-neo-bg font-bold shadow-[2px_2px_0_#000]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-black uppercase text-xs tracking-wider mb-1.5 text-gray-700">Password</label>
            <input 
              type="password" 
              required
              minLength="6"
              placeholder="••••••••"
              className="w-full p-4 border-4 border-black bg-white focus:outline-none focus:bg-neo-bg font-bold shadow-[2px_2px_0_#000]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-[10px] font-bold text-gray-500 mt-1">Must be at least 6 characters</p>
          </div>
          
          <button type="submit" className="w-full bg-neo-blue p-4 text-lg mt-2 font-black uppercase tracking-widest neo-button text-black shadow-[3px_3px_0_#000]">
            Sign Up
          </button>
        </form>

        <p className="mt-6 font-bold text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 underline font-black hover:text-blue-800">
            Log in here!
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
