import React, { useEffect, useState } from "react";
import penguinImage from "./assets/pinguin.png";

export default function SplashScreenWithTransition() {
  const [dots, setDots] = useState("");
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Start transition when loading complete
          setTimeout(() => {
            setIsTransitioning(true);
            setTimeout(() => setShowLogin(true), 1000); // Show login after roll animation
          }, 1000);
          return 100;
        }
        return prev + 3;
      });
    }, 100);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="h-screen w-screen relative overflow-hidden" style={{ perspective: '1000px' }}>
      {/* Splash Screen */}
      <div 
        className={`absolute inset-0 transform transition-all duration-1000 ease-in-out ${
          isTransitioning ? '-translate-y-full' : 'translate-y-0'
        }`}
        style={{ 
          transformOrigin: 'bottom',
          transform: isTransitioning ? 'rotateX(-90deg) translateZ(-50vh)' : 'rotateX(0deg)',
          perspective: '1000px'
        }}
      >
        <div className="h-full w-full flex flex-col justify-center items-center">
          {/* Animated Abstract Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#641E20] via-[#8B2635] to-[#330A0C]">
            {/* Abstract curved shapes */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-red-400/20 to-red-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-gradient-to-tl from-red-300/15 to-red-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/3 -right-20 w-64 h-64 bg-gradient-to-bl from-red-200/10 to-red-400/5 rounded-full blur-xl animate-pulse delay-2000"></div>
            
            {/* Curved overlay elements */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'rgba(255,255,255,0.03)', stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:'rgba(255,255,255,0)', stopOpacity:1}} />
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor:'rgba(220,38,38,0.1)', stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:'rgba(220,38,38,0)', stopOpacity:1}} />
                </linearGradient>
              </defs>
              
              {/* First curved layer - moves right to left */}
              <path d="M0,200 Q100,50 200,100 T400,150 L400,400 L0,400 Z" fill="url(#grad1)" className="animate-pulse">
                <animateTransform
                  attributeName="transform"
                  attributeType="XML"
                  type="translate"
                  values="50,0; -50,10; 50,0"
                  dur="12s"
                  repeatCount="indefinite"
                />
              </path>
              
              {/* Second curved layer - moves left to right */}
              <path d="M0,300 Q150,180 300,220 T400,200 L400,400 L0,400 Z" fill="url(#grad2)" className="animate-pulse delay-1000">
                <animateTransform
                  attributeName="transform"
                  attributeType="XML"
                  type="translate"
                  values="-30,0; 30,15; -30,0"
                  dur="15s"
                  repeatCount="indefinite"
                />
              </path>
              
              {/* Third curved layer - diagonal movement */}
              <path d="M0,250 Q200,120 400,180 L400,400 L0,400 Z" fill="url(#grad1)" opacity="0.3">
                <animateTransform
                  attributeName="transform"
                  attributeType="XML"
                  type="translate"
                  values="20,20; -40,-10; 20,20"
                  dur="18s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>

            {/* Floating particles */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-300/40 rounded-full animate-bounce delay-500"></div>
            <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-red-200/60 rounded-full animate-bounce delay-1000"></div>
            <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-red-400/30 rounded-full animate-bounce delay-1500"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Container with Glow Effect */}
            {/* Animated Penguin Logo */}
            <div className="relative mb-8">
                <div className="animate-bounce">
                    <div className="animate-pulse">
                    <img 
                        src={penguinImage}
                        alt="Penguin Logo"
                        className="w-32 h-32 mx-auto transform transition-transform duration-1000 animate-wiggle object-contain"
                        style={{
                        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))',
                        animation: 'bounce 2s infinite, wiggle 3s ease-in-out infinite'
                        }}
                    />
                    </div>
                </div>
            </div>

            {/* Title with Enhanced Typography */}
            <h1 className="text-white text-4xl font-bold mb-3 text-center leading-tight">
              <span className="bg-gradient-to-r from-white via-red-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
                Sistem Pengelolaan PKL
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-red-100/80 text-base mb-8 text-center max-w-xs leading-relaxed font-light">
              SMKN 2 Singosari
            </p>

            {/* Enhanced Loading Bar */}
            <div className="w-48 mb-4">
              <div className="w-full h-1.5 bg-red-900/30 rounded-full overflow-hidden backdrop-blur-sm border border-red-800/20">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 via-red-300 to-red-200 rounded-full shadow-lg transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="h-full bg-white/20 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-red-200/60 mt-1">
                <span>0%</span>
                <span>{progress}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Loading Text with Animation */}
            <p className="text-red-200/90 text-sm font-medium">
              <span className="inline-block animate-pulse">Loading</span>
              <span className="inline-block w-8 text-left">{dots}</span>
            </p>
          </div>

          {/* Bottom Decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent"></div>
          
          {/* Corner Decorations */}
          <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-red-300/20 rounded-tr-3xl"></div>
          <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-red-300/20 rounded-bl-3xl"></div>
        </div>
      </div>

    

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }

        /* Bubble animations - floating up */
        @keyframes float-up-1 {
          0% { transform: translateY(100vh) translateX(0px) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(20px) scale(1); opacity: 0; }
        }
        
        @keyframes float-up-2 {
          0% { transform: translateY(100vh) translateX(0px) scale(0); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(-30px) scale(1); opacity: 0; }
        }
        
        @keyframes float-up-3 {
          0% { transform: translateY(100vh) translateX(0px) scale(0); opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(40px) scale(1); opacity: 0; }
        }
        
        @keyframes float-up-4 {
          0% { transform: translateY(100vh) translateX(0px) scale(0); opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(-20px) scale(1); opacity: 0; }
        }

        /* Bubble animations - diagonal movement */
        @keyframes float-diagonal-1 {
          0% { transform: translateY(100vh) translateX(-50px) scale(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(50px) scale(1); opacity: 0; }
        }
        
        @keyframes float-diagonal-2 {
          0% { transform: translateY(100vh) translateX(50px) scale(0); opacity: 0; }
          18% { opacity: 1; }
          82% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(-50px) scale(1); opacity: 0; }
        }
        
        @keyframes float-diagonal-3 {
          0% { transform: translateY(100vh) translateX(-30px) scale(0); opacity: 0; }
          25% { opacity: 1; }
          75% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(30px) scale(1); opacity: 0; }
        }
        
        @keyframes float-diagonal-4 {
          0% { transform: translateY(100vh) translateX(30px) scale(0); opacity: 0; }
          22% { opacity: 1; }
          78% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(-30px) scale(1); opacity: 0; }
        }

        /* Small bubble animations */
        @keyframes float-small-1 {
          0% { transform: translateY(100vh) translateX(0px) scale(0) rotate(0deg); opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(15px) scale(1) rotate(180deg); opacity: 0; }
        }
        
        @keyframes float-small-2 {
          0% { transform: translateY(100vh) translateX(0px) scale(0) rotate(0deg); opacity: 0; }
          35% { opacity: 1; }
          65% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(-25px) scale(1) rotate(-180deg); opacity: 0; }
        }
        
        @keyframes float-small-3 {
          0% { transform: translateY(100vh) translateX(0px) scale(0) rotate(0deg); opacity: 0; }
          40% { opacity: 1; }
          60% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(35px) scale(1) rotate(360deg); opacity: 0; }
        }
        
        @keyframes float-small-4 {
          0% { transform: translateY(100vh) translateX(0px) scale(0) rotate(0deg); opacity: 0; }
          28% { opacity: 1; }
          72% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(-15px) scale(1) rotate(-360deg); opacity: 0; }
        }
        
        @keyframes float-small-5 {
          0% { transform: translateY(100vh) translateX(0px) scale(0) rotate(0deg); opacity: 0; }
          32% { opacity: 1; }
          68% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(25px) scale(1) rotate(180deg); opacity: 0; }
        }

        /* Tiny bubble animations */
        @keyframes float-tiny-1 {
          0% { transform: translateY(100vh) translateX(0px) scale(0); opacity: 0; }
          50% { opacity: 1; transform: translateY(50vh) translateX(10px) scale(1); }
          100% { transform: translateY(-50px) translateX(20px) scale(0); opacity: 0; }
        }
        
        @keyframes float-tiny-2 {
          0% { transform: translateY(100vh) translateX(0px) scale(0); opacity: 0; }
          45% { opacity: 1; transform: translateY(55vh) translateX(-15px) scale(1); }
          100% { transform: translateY(-50px) translateX(-30px) scale(0); opacity: 0; }
        }
        
        @keyframes float-tiny-3 {
          0% { transform: translateY(100vh) translateX(0px) scale(0); opacity: 0; }
          55% { opacity: 1; transform: translateY(45vh) translateX(25px) scale(1); }
          100% { transform: translateY(-50px) translateX(50px) scale(0); opacity: 0; }
        }
        
        @keyframes float-tiny-4 {
          0% { transform: translateY(100vh) translateX(0px) scale(0); opacity: 0; }
          48% { opacity: 1; transform: translateY(52vh) translateX(-20px) scale(1); }
          100% { transform: translateY(-50px) translateX(-40px) scale(0); opacity: 0; }
        }

        /* Apply animations with different durations and delays */
        .animate-float-up-1 { animation: float-up-1 8s linear infinite; animation-delay: 0s; }
        .animate-float-up-2 { animation: float-up-2 10s linear infinite; animation-delay: 2s; }
        .animate-float-up-3 { animation: float-up-3 12s linear infinite; animation-delay: 4s; }
        .animate-float-up-4 { animation: float-up-4 9s linear infinite; animation-delay: 1s; }
        
        .animate-float-diagonal-1 { animation: float-diagonal-1 11s linear infinite; animation-delay: 3s; }
        .animate-float-diagonal-2 { animation: float-diagonal-2 13s linear infinite; animation-delay: 5s; }
        .animate-float-diagonal-3 { animation: float-diagonal-3 7s linear infinite; animation-delay: 1.5s; }
        .animate-float-diagonal-4 { animation: float-diagonal-4 15s linear infinite; animation-delay: 6s; }
        
        .animate-float-small-1 { animation: float-small-1 6s linear infinite; animation-delay: 0.5s; }
        .animate-float-small-2 { animation: float-small-2 8s linear infinite; animation-delay: 2.5s; }
        .animate-float-small-3 { animation: float-small-3 10s linear infinite; animation-delay: 4.5s; }
        .animate-float-small-4 { animation: float-small-4 7s linear infinite; animation-delay: 1.2s; }
        .animate-float-small-5 { animation: float-small-5 9s linear infinite; animation-delay: 3.8s; }
        
        .animate-float-tiny-1 { animation: float-tiny-1 5s linear infinite; animation-delay: 0.8s; }
        .animate-float-tiny-2 { animation: float-tiny-2 6s linear infinite; animation-delay: 2.3s; }
        .animate-float-tiny-3 { animation: float-tiny-3 7s linear infinite; animation-delay: 4.1s; }
        .animate-float-tiny-4 { animation: float-tiny-4 5.5s linear infinite; animation-delay: 1.7s; }
      `}</style>
    </div>
  );
}

