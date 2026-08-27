"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, CheckCircle2, Sparkles, Trophy, Zap, HelpCircle } from "lucide-react";
import ReplyzMascot from "@/components/ReplyzMascot";

import quizService from "@/services/quizService";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomeDailyQuizShowcase() {
  const containerRef = useRef(null);
  const pinSectionRef = useRef(null);

  // Scene Refs
  const scene1Ref = useRef(null);
  const scene2Ref = useRef(null);
  const scene3Ref = useRef(null);
  const scene4Ref = useRef(null);

  // Floating Bubbles Container Ref
  const bubblesLayerRef = useRef(null);
  const bubble1Ref = useRef(null);
  const bubble2Ref = useRef(null);
  const bubble3Ref = useRef(null);
  const bubble4Ref = useRef(null);
  const bubble5Ref = useRef(null);

  // Mascot Emotion State
  const [mascotState, setMascotState] = useState("idle");
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);

  // Dynamic Daily Topic from Database
  const [dailyTopic, setDailyTopic] = useState("Cyber Security Best Practices & OWASP Top 10");

  useEffect(() => {
    let isMounted = true;
    quizService
      .getTodayInfo()
      .then((res) => {
        const data = res?.data?.data !== undefined ? res.data.data : res?.data;
        if (data?.topic && isMounted) {
          setDailyTopic(data.topic);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOptionClick = (optionId, correct) => {
    setSelectedOption(optionId);
    setIsCorrect(correct);
    if (correct) {
      setMascotState("happy");
    } else {
      setMascotState("thinking");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Create pinned master timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=2200",
          scrub: 0.7,
          pin: pinSectionRef.current,
          anticipatePin: 1,
          onLeave: () => {
            // Ensure Scene 4 is 100% resting in place when unpinned
            gsap.set(scene4Ref.current, { opacity: 1, scale: 1, y: 0, pointerEvents: "auto" });
            gsap.set([scene1Ref.current, scene2Ref.current, scene3Ref.current, bubblesLayerRef.current], {
              opacity: 0,
              pointerEvents: "none",
            });
            setMascotState("love");
          },
        },
      });

      // Initial States: Scene 1 visible, others hidden
      gsap.set(scene1Ref.current, { opacity: 1, scale: 1, pointerEvents: "auto" });
      gsap.set([scene2Ref.current, scene3Ref.current, scene4Ref.current], {
        opacity: 0,
        pointerEvents: "none",
      });

      // Floating drift on bubbles in scene 1
      gsap.to([bubble1Ref.current, bubble3Ref.current], {
        y: -15,
        x: 8,
        repeat: -1,
        yoyo: true,
        duration: 3,
        ease: "sine.inOut",
      });
      gsap.to([bubble2Ref.current, bubble4Ref.current, bubble5Ref.current], {
        y: 15,
        x: -8,
        repeat: -1,
        yoyo: true,
        duration: 3.5,
        ease: "sine.inOut",
      });

      /* ─── STEP 1 ➔ STEP 2: Bubbles Fly Outward & Replyz Mascot Reveal ─── */
      tl.to(
        scene1Ref.current,
        {
          opacity: 0,
          scale: 0.92,
          duration: 1,
          ease: "power2.inOut",
          pointerEvents: "none",
        },
        0
      );

      // Bubbles Explosion / Fly outward
      tl.to(bubble1Ref.current, { x: -350, y: -300, scale: 2.2, opacity: 0, duration: 1.2 }, 0);
      tl.to(bubble2Ref.current, { x: 380, y: -320, scale: 2.5, opacity: 0, duration: 1.2 }, 0);
      tl.to(bubble3Ref.current, { x: -400, y: 350, scale: 2.4, opacity: 0, duration: 1.2 }, 0);
      tl.to(bubble4Ref.current, { x: 420, y: 300, scale: 2.6, opacity: 0, duration: 1.2 }, 0);
      tl.to(bubble5Ref.current, { x: 0, y: 400, scale: 2.2, opacity: 0, duration: 1.2 }, 0);

      // Scene 2 appears with Replyz
      tl.fromTo(
        scene2Ref.current,
        { opacity: 0, scale: 0.85 },
        {
          opacity: 1,
          scale: 1,
          pointerEvents: "auto",
          duration: 1,
          ease: "power2.out",
          onStart: () => setMascotState("idle"),
        },
        0.6
      );

      /* ─── STEP 2 ➔ STEP 3: Mini-Quiz Interactive UI Simulation ─── */
      tl.to(
        scene2Ref.current,
        {
          opacity: 0,
          y: -40,
          duration: 0.8,
          pointerEvents: "none",
          ease: "power2.in",
        },
        1.8
      );

      // Hide bubbles layer completely from Step 3 onwards
      tl.to(bubblesLayerRef.current, { opacity: 0, duration: 0.4 }, 1.8);

      tl.fromTo(
        scene3Ref.current,
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          pointerEvents: "auto",
          duration: 1,
          ease: "power2.out",
          onStart: () => setMascotState("thinking"),
        },
        2.2
      );

      /* ─── STEP 3 ➔ STEP 4: Active Topic & Final Call-To-Action ─── */
      tl.to(
        scene3Ref.current,
        {
          opacity: 0,
          scale: 0.9,
          y: -30,
          duration: 0.8,
          pointerEvents: "none",
          ease: "power2.in",
        },
        3.4
      );

      tl.fromTo(
        scene4Ref.current,
        { opacity: 0, scale: 0.92, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          pointerEvents: "auto",
          duration: 1,
          ease: "power2.out",
          onStart: () => setMascotState("love"),
        },
        3.8
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-white font-sans text-slate-900 border-t border-slate-200 select-none overflow-hidden"
    >
      {/* ─── Pinned Viewport Container (h-screen) ─── */}
      <div
        ref={pinSectionRef}
        className="relative w-full h-screen min-h-[600px] flex items-center justify-center overflow-hidden px-6 sm:px-12"
      >
        {/* ─── FLOATING DARK BUBBLE PARTICLES LAYER ─── */}
        <div ref={bubblesLayerRef} className="absolute inset-0 pointer-events-none z-10">
          <div
            ref={bubble1Ref}
            className="absolute top-16 left-[12%] w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-900 shadow-md"
          />
          <div
            ref={bubble2Ref}
            className="absolute top-20 right-[15%] w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-slate-900 shadow-lg"
          />
          <div
            ref={bubble3Ref}
            className="absolute bottom-28 left-[18%] w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-slate-900 shadow-md"
          />
          <div
            ref={bubble4Ref}
            className="absolute bottom-20 right-[12%] w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-slate-900 shadow-xl"
          />
          <div
            ref={bubble5Ref}
            className="absolute top-1/2 right-[28%] w-8 h-8 rounded-full bg-slate-900 shadow-xs"
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SCENE 1: The Hook (Jadilah #1 hall of fame di kuis harian!)
        ══════════════════════════════════════════════════════════════ */}
        <div
          ref={scene1Ref}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-20"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-[#2c1ee8] text-xs font-bold uppercase tracking-wider mb-4">
            <Trophy className="w-4 h-4 text-[#2c1ee8]" />
            <span>Leaderboard Kompetisi Harian</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight max-w-2xl leading-[1.12]">
            Jadilah <span className="text-[#2c1ee8]">#1</span> hall of fame <br />
            di kuis harian!
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-4 max-w-md">
            Uji ketangkasan logika coding, raih skor tertinggi, dan puncaki peringkat kejuruan PPLG.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SCENE 2: The Mascot & Focus (Pamerkan pengetahuanmu di sini!)
        ══════════════════════════════════════════════════════════════ */}
        <div
          ref={scene2Ref}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-20 space-y-5"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight leading-tight">
            Pamerkan pengetahuanmu di sini!
          </h2>

          {/* Official Replyz Mascot Component */}
          <div className="relative py-2 flex items-center justify-center">
            <ReplyzMascot state={mascotState} size={150} />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-black uppercase tracking-wider">
              Kuis harian
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              Topik diperbaharui setiap hari!
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SCENE 3: Interactive Mini-Quiz UI Simulation
        ══════════════════════════════════════════════════════════════ */}
        <div
          ref={scene3Ref}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 z-20"
        >
          <div className="w-full max-w-2xl bg-white border border-black p-6 sm:p-8 space-y-5 shadow-xl">
            {/* Header with Replyz Mini Status */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <ReplyzMascot state={isCorrect ? "happy" : mascotState} size={48} />
                <div>
                  <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-wider inline-block">
                    Simulasi Soal 1/5
                  </span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Topik: Teknologi Web Modern</p>
                </div>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#2c1ee8] bg-blue-50 px-2.5 py-1 border border-blue-200">
                <Zap className="w-3.5 h-3.5" />
                <span>Timer: 45s</span>
              </div>
            </div>

            {/* Question Text */}
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Pertanyaan Simulasi:
              </p>
              <h4 className="text-sm sm:text-base font-black text-black leading-snug">
                Manakah protokol komunikasi yang paling efisien untuk realtime bidirectional state streaming pada aplikasi web?
              </h4>
            </div>

            {/* Answer Options (A, B, C, D) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                { id: "A", text: "A. Short HTTP Polling", correct: false },
                { id: "B", text: "B. WebSocket Protocol", correct: true },
                { id: "C", text: "C. FTP Data Stream", correct: false },
                { id: "D", text: "D. SMTP Handshake", correct: false },
              ].map((opt) => {
                const isChosen = selectedOption === opt.id;
                const showSuccess = isChosen && opt.correct;
                const showWrong = isChosen && !opt.correct;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleOptionClick(opt.id, opt.correct)}
                    className={`p-3.5 text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                      showSuccess
                        ? "bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500"
                        : showWrong
                        ? "bg-red-50 border-red-500 text-red-950"
                        : "bg-white border-slate-300 hover:border-black text-black"
                    }`}
                  >
                    <span>{opt.text}</span>
                    {showSuccess && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback Message */}
            {selectedOption && (
              <div className="pt-2 flex items-center justify-between text-xs font-bold border-t border-slate-100">
                {isCorrect ? (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Jawaban Benar! (+100 Poin)
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-red-500" />
                    Kurang tepat! Coba pilih opsi B (WebSocket).
                  </span>
                )}
                <span className="text-slate-400 font-normal">Scroll ke bawah untuk melihat topik aktif →</span>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SCENE 4: Active Topic & Call-To-Action (Final Resting State)
        ══════════════════════════════════════════════════════════════ */}
        <div
          ref={scene4Ref}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-20 space-y-5"
        >
          {/* Header */}
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
              Kuis harian
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              Topik diperbaharui setiap hari!
            </p>
          </div>

          {/* Official Replyz Mascot in Love / Happy State */}
          <div className="relative py-2 flex items-center justify-center">
            <ReplyzMascot state="love" size={150} />
          </div>

          {/* Active Topic Capsule */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Topik Hari Ini:
            </span>
            <div className="px-5 py-2.5 bg-slate-100 border border-slate-300 font-mono text-sm sm:text-base font-black text-black">
              {dailyTopic}
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-2">
            <Link
              href="/kuis"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#2c1ee8] hover:bg-[#2317be] active:bg-[#1d129f] text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-md cursor-pointer group"
            >
              <span>Menuju kuis harian</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
