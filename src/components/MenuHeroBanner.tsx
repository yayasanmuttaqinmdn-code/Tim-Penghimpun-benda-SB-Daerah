import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Layers } from 'lucide-react';

interface MenuHeroBannerProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  rightElement?: React.ReactNode;
  iconLetter?: string;
}

export default function MenuHeroBanner({
  title,
  subtitle,
  badgeText = 'TIM PENGHIMPUN BENDA SABILILLAH',
  rightElement,
  iconLetter = 'T'
}: MenuHeroBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-r from-sky-800 to-sky-950 dark:from-slate-900 dark:via-sky-950 dark:to-slate-900 p-5 sm:p-6 rounded-3xl text-white shadow-md border border-sky-700/30 dark:border-slate-800 transition-colors duration-200"
    >
      {/* Geometric chevron watermark */}
      <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 pointer-events-none">
        <Layers className="w-80 h-80 text-white" />
      </div>

      <div className="relative z-10 flex flex-col space-y-3">
        {/* Top Row: Pill Badge & Right Action */}
        <div className="flex justify-between items-center gap-3">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>{badgeText}</span>
          </span>

          {rightElement && (
            <div className="flex items-center gap-2">
              {rightElement}
            </div>
          )}
        </div>

        {/* Bottom Row: Logo "T" + Title & Subtitle */}
        <div className="flex items-center gap-3.5 pt-1">
          <div className="w-11 h-11 bg-white text-sky-800 rounded-2xl shadow-md flex items-center justify-center shrink-0 border border-white/40 font-black text-xl select-none">
            {iconLetter}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight uppercase">
              {title}
            </h1>
            <p className="text-sky-200 text-xs mt-1">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
