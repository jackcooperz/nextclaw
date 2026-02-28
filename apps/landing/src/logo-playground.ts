import './style.css';
import { createIcons, icons } from 'lucide';

const root = document.getElementById('playground-root');
if (root) {
    root.innerHTML = `
    <div class="max-w-5xl mx-auto px-6 py-12">
      <header class="mb-12 border-b border-gray-200 dark:border-gray-800 pb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold font-sans">NextClaw Logo & Typography Playground</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-2">Explore different visual identities and text arrangements for the landing page header.</p>
        </div>
        <a href="/" class="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          &larr; Back to Home
        </a>
      </header>

      <div class="space-y-12">
        
        <!-- Option 1 -->
        <section>
          <h2 class="text-[13px] font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">Option 1: Minimalist Tech</h2>
          <p class="text-sm text-gray-500 mb-4">Sleek, geometric, tight tracking. Excellent for deep-tech developer tools.</p>
          <div class="p-10 bg-white dark:bg-[#202120] rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center shadow-sm">
            <div class="flex items-center space-x-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="text-emerald-500 rounded-lg">
                <rect width="24" height="24" rx="6" fill="currentColor" fill-opacity="0.1" />
                <path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="text-2xl font-black tracking-tight text-gray-900 dark:text-white">NextClaw</span>
            </div>
          </div>
        </section>

        <!-- Option 2 -->
        <section>
          <h2 class="text-[13px] font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">Option 2: Vibrant Gradient (Web3 / AI Aesthetic)</h2>
          <p class="text-sm text-gray-500 mb-4">Modern, colorful, energetic gradient text and an eye-catching icon container.</p>
          <div class="p-10 bg-white dark:bg-[#202120] rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center shadow-sm">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <i data-lucide="cpu" class="w-5 h-5"></i>
              </div>
              <span class="text-[28px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 tracking-tight">
                NextClaw
              </span>
            </div>
          </div>
        </section>

        <!-- Option 3 -->
        <section>
          <h2 class="text-[13px] font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">Option 3: Terminal / Hacker Style</h2>
          <p class="text-sm text-gray-500 mb-4">Emphasizes the CLI/local nature of the tool. Heavy monospace usage.</p>
          <div class="p-10 bg-[#0a0a0a] rounded-2xl border  flex items-center shadow-lg font-mono">
            <div class="flex items-center space-x-3 text-emerald-400">
              <span class="text-xl font-bold opacity-70">~/</span>
              <span class="text-3xl font-bold tracking-widest text-emerald-300">
                next<span class="text-white">claw</span><span class="animate-pulse font-light">_</span>
              </span>
            </div>
          </div>
        </section>

        <!-- Option 4 -->
        <section>
          <h2 class="text-[13px] font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">Option 4: The Split Signature (Classic SaaS)</h2>
          <p class="text-sm text-gray-500 mb-4">Classic capitalization split. Uses the existing logo SVG.</p>
          <div class="p-10 bg-white dark:bg-[#202120] rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center shadow-sm">
            <div class="flex items-center">
              <img src="/logo.svg" alt="Logo" class="w-10 h-10 mr-3" />
              <span class="text-[28px] font-bold text-gray-900 dark:text-gray-100 font-sans tracking-normal">
                Next<span class="text-emerald-500 dark:text-emerald-400">Claw</span>
              </span>
            </div>
          </div>
        </section>

        <!-- Option 5 -->
        <section>
          <h2 class="text-[13px] font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">Option 5: Elegant Serif / Monospace Hybrid</h2>
          <p class="text-sm text-gray-500 mb-4">A unique, high-end editorial feel contrasting traditional and technical fonts.</p>
          <div class="p-10 bg-[#f5f5f4] dark:bg-[#1c1917] rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center shadow-sm">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-stone-900 dark:bg-stone-100 flex items-center justify-center rounded-br-[1rem] rounded-tl-[1rem]">
                <i data-lucide="terminal-square" class="w-6 h-6 text-stone-100 dark:text-stone-900"></i>
              </div>
              <span class="text-[28px] tracking-wide">
                <span class="font-serif italic font-medium text-stone-900 dark:text-stone-100">Next</span>
                <span class="font-mono font-bold text-stone-600 dark:text-stone-400">CLAW</span>
              </span>
            </div>
          </div>
        </section>

        <!-- Option 6 -->
        <section>
          <h2 class="text-[13px] font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">Option 6: Neobrutalism UI</h2>
          <p class="text-sm text-gray-500 mb-4">Bold shapes, heavy borders, distinct drop shadows. Playful and trendy.</p>
          <div class="p-10 bg-[#ffde59] rounded-2xl border-4 border-black flex items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-white border-4 border-black flex items-center justify-center rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-black"><path d="m15 18-6-6 6-6"/></svg>
              </div>
              <span class="text-3xl font-black text-black tracking-tighter uppercase" style="font-family: system-ui, -apple-system, sans-serif;">
                NextClaw
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  `;
}

createIcons({ icons });
