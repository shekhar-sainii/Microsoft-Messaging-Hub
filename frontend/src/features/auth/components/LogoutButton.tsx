import { useMsal } from "@azure/msal-react";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";

export const LogoutButton = () => {
    const { instance } = useMsal();

    const handleLogout = () => {
        instance.logoutRedirect().catch((e) => {
            console.error(e);
        });
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", borderColor: "rgba(239, 68, 68, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 text-white/70 bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5 shadow-lg group-hover:text-white"
        >
            <LogOut size={16} strokeWidth={2.5} />
            <span className="leading-none">Sign Out</span>
        </motion.button>
    );
};
