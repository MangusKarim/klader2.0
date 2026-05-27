'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gradient-bg-accent">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-20 h-20 animate-pulse-subtle">
          <Image 
            src="/logo.svg" 
            alt="Klader Logo" 
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="w-10 h-1 bg-klader-burgundy/10 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-gradient-to-r from-klader-burgundy via-klader-crimson to-klader-peach animate-infinite animate-duration-1000 origin-left" style={{
            animation: 'loading-bar 1.5s infinite ease-in-out'
          }}></div>
        </div>
        <span className="text-xs font-semibold text-slate-400 tracking-widest font-display">KLADER</span>
        <style jsx global>{`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    </div>
  );
}
