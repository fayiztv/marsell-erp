import { motion } from 'framer-motion';

export function FullScreenLoader() {
  return (
    <div
      className="min-h-screen w-full bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden select-none"
      aria-label="Loading workspace..."
      aria-busy="true"
    >
      {/* Background ambient radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(59,130,246,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-6 z-10">
        {/* Brand Logo with pulse effect */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="size-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_36px_rgba(59,130,246,0.45)] relative z-10"
          >
            <span className="font-bold text-white text-2xl tracking-tight">M</span>
          </motion.div>
          <span className="absolute -inset-1.5 rounded-2xl bg-blue-500/25 animate-ping pointer-events-none" />
        </div>

        {/* Brand Name & Loading Message */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-base font-semibold text-gray-200 tracking-tight">
            Marsell Enterprise ERP
          </span>
          <p className="text-xs text-gray-500 font-medium tracking-wide">
            Initializing workspace session...
          </p>
        </div>

        {/* Subtle bouncing dots loader */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="size-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="size-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="size-2 rounded-full bg-blue-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
