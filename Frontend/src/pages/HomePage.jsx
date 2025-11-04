import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { auth } from "../components/firebase/firebase"; // Adjust the path as needed
import { useToast } from "../components/Context/ToastContext";
import chatinLogo from "../assets/logo.png";

const HomePage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Warna yang selaras dengan homepage
  const colors = {
    primary: "bg-emerald-500",
    primaryHover: "hover:bg-emerald-600",
    primaryText: "text-green-500",
    primaryBorder: "border-green-500",
    lightBg: "bg-green-50",
    darkBg: "bg-green-100"
  };

  // Handle start chat button click
  const handleStartChat = () => {
    // Check if user is logged in
    const user = auth.currentUser;
    
    if (user) {
      // User is logged in, navigate to chat
      navigate("/chat");
    } else {
      // User is not logged in, show notification and navigate to login
      toast.info("Silakan login terlebih dahulu untuk memulai chat.", 5000);
      navigate("/login", { state: { from: "homepage" } });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white to-emerald-200 p-4">
      <motion.div
        layout
        className="bg-white rounded-3xl shadow-lg p-8 md:p-10 max-w-4xl"
      >
        <motion.div
          className="flex flex-col md:flex-row items-center"
        >
          {/* Bagian Kiri - Teks */}
          <div className="text-center md:text-left md:w-1/2 lg:w-3/5">
            <h1 className="text-4xl md:text-5xl text-gray-800 font-pacifico">
              Cha<span className="text-emerald-700">Tin</span>
            </h1>
            <p className="mt-4 font-poppins text-gray-600 leading-relaxed">
              Solusi Cerdas untuk <strong className="text-gray-800">Penjaminan Mutu</strong> Program Studi Anda. 
              Chatin hadir sebagai asisten berbasis <strong className="text-gray-800">AI</strong> untuk 
              mendukung <strong className="text-gray-800">akreditasi</strong> dan <strong className="text-gray-800">penjaminan mutu</strong> pendidikan.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartChat}
              className={`mt-6 px-6 py-3 ${colors.primary} font-poppins text-white font-medium rounded-lg shadow-md ${colors.primaryHover} transition-all`}
            >
              Start Chat
            </motion.button>
          </div>

          {/* Bagian Kanan - Ikon */}
          <div className="md:w-1/2 lg:w-2/5 flex justify-center mt-8 md:mt-0">
            <motion.img 
              src={chatinLogo} 
              alt="Logo" 
              className="w-48 h-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage;