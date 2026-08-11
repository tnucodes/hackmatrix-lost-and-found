import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents page reload
    try {
      await login(email, password);
      router.push("/"); // Redirect to home on success
    } catch (err) {
      setError("Failed to log in. Check your email and password.");
    }
  };

  return (
    <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white neo-card p-8"
      >
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 bg-neo-yellow inline-block px-2 neo-border">
          Welcome Back
        </h2>

        {error && (
          <div className="bg-red-200 text-red-900 border-2 border-red-900 p-2 font-bold mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block font-bold mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full p-3 neo-border focus:outline-none focus:bg-gray-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full p-3 neo-border focus:outline-none focus:bg-gray-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="w-full bg-neo-green p-3 text-xl mt-2 neo-button">
            Log In
          </button>
        </form>

        <p className="mt-6 font-medium text-center">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-600 underline font-bold hover:text-blue-800">
            Sign up here!
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
