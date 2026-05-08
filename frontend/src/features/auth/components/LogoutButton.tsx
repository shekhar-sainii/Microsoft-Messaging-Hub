import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../../auth/useAuth";

export const LogoutButton = () => {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout().catch((e) => {
            console.error(e);
        });
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            title="Sign Out"
            className="w-12 h-12 flex items-center justify-center text-white/50 bg-white/5 rounded-xl transition-all border border-white/5 mx-auto"
        >
            <LogOut size={20} strokeWidth={2.5} />
        </motion.button>
    );
};
