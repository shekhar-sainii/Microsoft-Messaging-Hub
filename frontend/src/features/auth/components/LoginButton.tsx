import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../../auth/msalConfig";
import { LogIn } from "lucide-react";
import { motion } from "framer-motion";

export const LoginButton = () => {
    const { instance } = useMsal();

    const handleLogin = () => {
        instance.loginRedirect(loginRequest).catch((e) => {
            console.error(e);
        });
    };

    return (
        <motion.button
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-4 px-8 py-4.5 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl shadow-slate-200 hover:shadow-slate-300 hover:bg-slate-800 transition-all border border-slate-700/50"
        >
            <div className="bg-white/10 p-1.5 rounded-lg border border-white/10">
                <LogIn size={20} className="text-blue-400" />
            </div>
            <span className="text-base tracking-tight">Sign in with Microsoft</span>
        </motion.button>
    );
};
