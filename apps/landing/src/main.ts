import './style.css';
import { createIcons, icons } from 'lucide';

type Locale = 'en' | 'zh';

type FeatureItem = {
  icon: string;
  title: string;
  description: string;
};

type LandingCopy = {
  htmlLang: string;
  metaTitle: string;
  metaDescription: string;
  navFeatures: string;
  navDocs: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDescription: string;
  copyTitle: string;
  docsButton: string;
  githubButton: string;
  screenshotAlt: string;
  featuresTitle: string;
  featuresSubtitle: string;
  features: FeatureItem[];
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
  footerProject: string;
  footerLicense: string;
  footerDocs: string;
  footerNpm: string;
  terminalHeader: string;
  terminalStarted: string;
  languageLabel: string;
  languageOptions: Record<Locale, string>;
  copiedText: string;
};

const LOCALE_STORAGE_KEY = 'nextclaw.landing.locale';

const LINKS: Record<'github' | 'npm', string> & { docs: Record<Locale, string> } = {
  github: 'https://github.com/Peiiii/nextclaw',
  npm: 'https://www.npmjs.com/package/nextclaw',
  docs: {
    en: 'https://docs.nextclaw.io/en/',
    zh: 'https://docs.nextclaw.io/zh/'
  }
};

const COPY: Record<Locale, LandingCopy> = {
  en: {
    htmlLang: 'en',
    metaTitle: 'NextClaw - Effortlessly Simple Personal AI Assistant',
    metaDescription:
      'Feature-rich, OpenClaw-compatible personal AI gateway. Multi-provider, multi-channel capabilities with an elegant zero-config interface.',
    navFeatures: 'Features',
    navDocs: 'Docs',
    heroTitleLine1: 'The effortlessly simple',
    heroTitleLine2: 'Personal AI Assistant.',
    heroDescription:
      'Feature-rich, OpenClaw-compatible gateway. Multi-provider, multi-channel capabilities with an elegant zero-config interface.',
    copyTitle: 'Copy commands',
    docsButton: 'Read the Docs',
    githubButton: 'View on GitHub',
    screenshotAlt: 'NextClaw Web Interface',
    featuresTitle: 'Everything you need.',
    featuresSubtitle:
      'A powerful core wrapped in a seamless interface. Run NextClaw locally or expose it safely.',
    features: [
      {
        icon: 'layers',
        title: 'Zero-Config UI',
        description:
          'Manage your providers, models, and agents from an elegant dashboard. No hunting through JSON files.'
      },
      {
        icon: 'cpu',
        title: 'Multi-Provider',
        description: 'OpenRouter, OpenAI, vLLM, DeepSeek, MiniMax, and more. Switch models in minutes.'
      },
      {
        icon: 'message-square',
        title: 'Multi-Channel',
        description: 'Connect Telegram, Discord, Feishu, Slack, and WhatsApp from one gateway.'
      },
      {
        icon: 'blocks',
        title: 'OpenClaw Compatible',
        description: 'Compatible with OpenClaw plugin ecosystem and channel plugin conventions.'
      },
      {
        icon: 'clock',
        title: 'Automation Built-in',
        description: 'Cron and Heartbeat let your assistant run scheduled autonomous tasks.'
      },
      {
        icon: 'zap',
        title: 'Local & Private',
        description: 'Runs on your machine, keeping configs, chat history, and tokens under your control.'
      }
    ],
    ctaTitle: 'Ready to upgrade your AI?',
    ctaDescription: 'Get started with NextClaw in seconds. One command and your gateway is operational.',
    ctaButton: 'View Documentation',
    footerProject: 'NextClaw Project',
    footerLicense: 'Released under the MIT License.',
    footerDocs: 'Docs',
    footerNpm: 'NPM',
    terminalHeader: 'nextclaw - bash',
    terminalStarted: 'NextClaw started',
    languageLabel: 'Language',
    languageOptions: {
      en: 'English',
      zh: '简体中文'
    },
    copiedText: 'Copied'
  },
  zh: {
    htmlLang: 'zh-CN',
    metaTitle: 'NextClaw - 轻量易用的个人 AI 助手',
    metaDescription:
      '功能完整、兼容 OpenClaw 的个人 AI 网关。支持多 Provider、多渠道，并提供零配置体验。',
    navFeatures: '功能',
    navDocs: '文档',
    heroTitleLine1: '轻量易用的',
    heroTitleLine2: '个人 AI 助手。',
    heroDescription: '功能完整、兼容 OpenClaw 的 AI 网关。多 Provider、多渠道，一套界面完成配置。',
    copyTitle: '复制命令',
    docsButton: '查看文档',
    githubButton: '查看 GitHub',
    screenshotAlt: 'NextClaw Web 界面',
    featuresTitle: '你需要的能力都在这里。',
    featuresSubtitle: '强大的核心能力与顺手的交互体验统一在一个入口中。',
    features: [
      {
        icon: 'layers',
        title: '零配置 UI',
        description: '通过统一控制台管理 Provider、模型和 Agent，无需频繁手改 JSON。'
      },
      {
        icon: 'cpu',
        title: '多 Provider',
        description: '支持 OpenRouter、OpenAI、vLLM、DeepSeek、MiniMax 等，切换更灵活。'
      },
      {
        icon: 'message-square',
        title: '多渠道接入',
        description: '可连接 Telegram、Discord、飞书、Slack、WhatsApp 等主流渠道。'
      },
      {
        icon: 'blocks',
        title: '兼容 OpenClaw',
        description: '兼容 OpenClaw 插件生态与渠道插件约定，迁移成本低。'
      },
      {
        icon: 'clock',
        title: '内置自动化',
        description: '通过 Cron 与 Heartbeat 让 AI 按计划执行后台任务。'
      },
      {
        icon: 'zap',
        title: '本地可控',
        description: '本机运行，配置、会话与密钥保留在你自己的环境中。'
      }
    ],
    ctaTitle: '准备好升级你的 AI 工作流了吗？',
    ctaDescription: '一条命令启动 NextClaw，快速进入可用状态。',
    ctaButton: '进入文档',
    footerProject: 'NextClaw 项目',
    footerLicense: '基于 MIT License 发布。',
    footerDocs: '文档',
    footerNpm: 'NPM',
    terminalHeader: 'nextclaw - bash',
    terminalStarted: 'NextClaw 已启动',
    languageLabel: '语言',
    languageOptions: {
      en: 'English',
      zh: '简体中文'
    },
    copiedText: '已复制'
  }
};

class LandingI18nApp {
  private locale: Locale;
  private readonly root: HTMLDivElement;

  constructor() {
    const root = document.querySelector<HTMLDivElement>('#app');
    if (!root) {
      throw new Error('Missing #app mount element');
    }
    this.root = root;
    this.locale = this.resolveInitialLocale();
  }

  start(): void {
    this.render();
  }

  private resolveInitialLocale(): Locale {
    const saved = this.readSavedLocale();
    if (saved) {
      return saved;
    }

    const browserLang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return /^zh\b/i.test(browserLang) ? 'zh' : 'en';
  }

  private readSavedLocale(): Locale | null {
    try {
      const value = localStorage.getItem(LOCALE_STORAGE_KEY);
      return value === 'en' || value === 'zh' ? value : null;
    } catch {
      return null;
    }
  }

  private persistLocale(locale: Locale): void {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // ignore persistence failures in restricted environments
    }
  }

  private setLocale(locale: Locale): void {
    if (this.locale === locale) {
      return;
    }
    this.locale = locale;
    this.persistLocale(locale);
    this.render();
  }

  private docsHome(locale: Locale): string {
    return LINKS.docs[locale];
  }

  private updateMeta(copy: LandingCopy): void {
    document.documentElement.lang = copy.htmlLang;
    document.title = copy.metaTitle;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content = copy.metaDescription;
    }
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.content = copy.metaTitle;
    }
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.content = copy.metaDescription;
    }
    const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.content = copy.metaTitle;
    }
    const twitterDescription = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.content = copy.metaDescription;
    }
  }

  private render(): void {
    const copy = COPY[this.locale];
    const docsLink = this.docsHome(this.locale);

    this.root.innerHTML = `
      <div class="relative min-h-screen flex flex-col bg-gradient-radial overflow-hidden">
        <header class="fixed top-0 w-full z-50 glass border-b transition-all duration-300">
          <div class="container mx-auto px-6 h-16 flex items-center justify-between">
            <div class="flex items-center gap-2 group cursor-pointer">
              <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold shadow-sm transition-transform group-hover:scale-105">
                N
              </div>
              <span class="font-semibold text-lg tracking-tight">NextClaw</span>
            </div>
            <nav class="hidden md:flex gap-8 text-sm font-medium">
              <a href="#features" class="text-muted-foreground hover:text-foreground transition-colors">${copy.navFeatures}</a>
              <a href="${docsLink}" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground transition-colors">${copy.navDocs}</a>
            </nav>
            <div class="flex items-center gap-2">
              <label for="locale-select" class="sr-only">${copy.languageLabel}</label>
              <div class="relative">
                <i data-lucide="languages" class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                <select
                  id="locale-select"
                  class="h-9 rounded-full bg-secondary text-foreground text-sm pl-8 pr-8 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                >
                  <option value="en" ${this.locale === 'en' ? 'selected' : ''}>${copy.languageOptions.en}</option>
                  <option value="zh" ${this.locale === 'zh' ? 'selected' : ''}>${copy.languageOptions.zh}</option>
                </select>
              </div>
              <a href="${LINKS.github}" target="_blank" rel="noopener noreferrer" class="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary" aria-label="GitHub">
                <i data-lucide="github" class="w-5 h-5"></i>
              </a>
            </div>
          </div>
        </header>

        <main class="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 z-10">
          <h1 class="text-5xl md:text-7xl font-bold tracking-tight text-gradient max-w-4xl mb-6 animate-slide-up opacity-0" style="animation-delay: 0.2s">
            ${copy.heroTitleLine1}<br />${copy.heroTitleLine2}
          </h1>

          <p class="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-slide-up opacity-0" style="animation-delay: 0.3s">
            ${copy.heroDescription}
          </p>

          <div class="w-full max-w-2xl mx-auto mb-10 text-left animate-slide-up opacity-0" style="animation-delay: 0.4s">
            <div class="rounded-2xl overflow-hidden bg-[#332c28] shadow-2xl border border-white/5">
              <div class="flex items-center justify-between px-4 py-3 bg-[#2c2522]">
                <div class="flex gap-2">
                  <div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                  <div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                  <div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                </div>
                <div class="text-xs text-[#a0938a] font-mono">${copy.terminalHeader}</div>
                <button id="copy-btn" class="text-[#a0938a] hover:text-white transition-colors" title="${copy.copyTitle}">
                  <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
              </div>
              <div id="terminal-content" class="p-6 font-mono text-sm sm:text-base leading-relaxed">
                <div class="flex items-center text-[#d4c8be]">
                  <span class="text-[#8eb079] mr-2">~</span>
                  <span class="text-[#e29e57] mr-2 font-bold">$</span>
                  <span id="install-cmd"></span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-center gap-4 mb-20 animate-slide-up opacity-0" style="animation-delay: 0.5s">
            <a href="${docsLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 shadow-xl shadow-primary/25 focus:ring-2 focus:ring-primary focus:outline-none text-lg">
              <i data-lucide="book-open" class="w-5 h-5"></i>
              ${copy.docsButton}
            </a>
            <a href="${LINKS.github}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full font-medium bg-foreground text-background hover:bg-foreground/90 transition-all hover:scale-105 shadow-sm focus:ring-2 focus:ring-foreground focus:outline-none text-lg">
              <i data-lucide="github" class="w-5 h-5"></i>
              ${copy.githubButton}
            </a>
          </div>

          <div class="relative w-full max-w-5xl mx-auto animate-fade-in opacity-0" style="animation-delay: 0.6s">
            <div class="absolute inset-0 bg-primary/10 blur-[100px] rounded-full"></div>
            <div class="glass-card rounded-2xl overflow-hidden border border-border/50 shadow-2xl animate-float">
              <div class="w-full bg-background flex flex-col">
                <div class="h-10 border-b flex items-center px-4 gap-2 bg-background/80 shrink-0">
                  <div class="w-3 h-3 rounded-full bg-red-400"></div>
                  <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div class="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <img src="/nextclaw-ui.png" alt="${copy.screenshotAlt}" class="w-full h-auto object-cover border-t border-border/40" />
              </div>
            </div>
          </div>
        </main>

        <section id="features" class="relative py-24 px-6 z-10 w-full max-w-7xl mx-auto">
          <div class="text-center mb-16 animate-slide-up opacity-0 relative" style="animation-delay: 0.1s">
            <h2 class="text-3xl md:text-5xl font-bold tracking-tight mb-4">${copy.featuresTitle}</h2>
            <p class="text-muted-foreground text-lg max-w-2xl mx-auto">${copy.featuresSubtitle}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${copy.features
              .map(
                (feature, index) => `
              <div class="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-transform duration-300 animate-slide-up opacity-0" style="animation-delay: ${0.2 + index * 0.1}s">
                <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <i data-lucide="${feature.icon}" class="w-6 h-6"></i>
                </div>
                <h3 class="text-xl font-semibold mb-2">${feature.title}</h3>
                <p class="text-muted-foreground leading-relaxed">${feature.description}</p>
              </div>
            `
              )
              .join('')}
          </div>
        </section>

        <section class="py-24 px-6 z-10 w-full max-w-4xl mx-auto text-center">
          <div class="glass-card rounded-[2rem] p-12 relative overflow-hidden">
            <div class="absolute inset-0 bg-primary/5"></div>
            <div class="relative z-10">
              <h2 class="text-3xl md:text-5xl font-bold mb-6">${copy.ctaTitle}</h2>
              <p class="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">${copy.ctaDescription}</p>
              <a href="${docsLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105 shadow-xl shadow-primary/20 focus:ring-2 focus:ring-primary focus:outline-none text-lg">
                ${copy.ctaButton}
                <i data-lucide="arrow-right" class="w-5 h-5 ml-1"></i>
              </a>
            </div>
          </div>
        </section>

        <footer class="w-full border-t border-border/40 py-10 z-10 bg-background/50 backdrop-blur-sm mt-auto">
          <div class="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-2 opacity-80">
              <div class="w-6 h-6 rounded bg-foreground flex items-center justify-center text-background font-bold text-xs">N</div>
              <span class="font-medium text-sm">${copy.footerProject}</span>
            </div>
            <div class="text-sm text-muted-foreground">
              ${copy.footerLicense}
            </div>
            <div class="flex gap-4">
              <a href="${docsLink}" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground transition-colors">${copy.footerDocs}</a>
              <a href="${LINKS.github}" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
              <a href="${LINKS.npm}" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground transition-colors">${copy.footerNpm}</a>
            </div>
          </div>
        </footer>

        <div class="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]"></div>
          <div class="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]"></div>
        </div>
      </div>
    `;

    this.updateMeta(copy);
    this.initializeInteractions(copy);
    createIcons({ icons, nameAttr: 'data-lucide' });
  }

  private initializeInteractions(copy: LandingCopy): void {
    this.bindLocaleSwitcher();
    this.bindCopyAction(copy);
    this.runTerminalAnimation(copy);
  }

  private bindLocaleSwitcher(): void {
    const select = document.querySelector<HTMLSelectElement>('#locale-select');
    if (!select) {
      return;
    }
    select.addEventListener('change', (event) => {
      const value = (event.target as HTMLSelectElement).value;
      if (value === 'en' || value === 'zh') {
        this.setLocale(value);
      }
    });
  }

  private bindCopyAction(copy: LandingCopy): void {
    const copyBtn = document.querySelector<HTMLButtonElement>('#copy-btn');
    if (!copyBtn) {
      return;
    }
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('npm install -g nextclaw && nextclaw start');
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = `<span class="text-xs">${copy.copiedText}</span>`;
        setTimeout(() => {
          copyBtn.innerHTML = original;
          createIcons({ icons, nameAttr: 'data-lucide' });
        }, 1500);
      } catch (error) {
        console.error('Failed to copy command', error);
      }
    });
  }

  private runTerminalAnimation(copy: LandingCopy): void {
    const terminalContent = document.querySelector<HTMLElement>('#terminal-content');
    const installCmd = document.querySelector<HTMLElement>('#install-cmd');
    if (!terminalContent || !installCmd) {
      return;
    }

    const startupSequence: Array<{ text: string; icon?: string; color?: string; isCommand?: boolean }> = [
      { text: 'nextclaw start', isCommand: true },
      { text: copy.terminalStarted, icon: '✓', color: '#8eb079' },
      { text: 'UI:  http://127.0.0.1:18791', icon: '→', color: '#7eb6d4' },
      { text: 'API: http://127.0.0.1:18791/api', icon: '→', color: '#7eb6d4' }
    ];

    const typeText = async (element: HTMLElement, text: string, speed = 36): Promise<void> => {
      for (let index = 0; index < text.length; index += 1) {
        element.textContent += text[index];
        await new Promise((resolve) => setTimeout(resolve, speed));
      }
    };

    const addLine = async (content: { text: string; icon?: string; color?: string; isCommand?: boolean }): Promise<void> => {
      const line = document.createElement('div');
      line.className = 'flex items-center mt-3';

      if (content.isCommand) {
        line.innerHTML = `
          <span class="text-[#8eb079] mr-2">~</span>
          <span class="text-[#e29e57] mr-2 font-bold">$</span>
          <span class="text-[#d4c8be]"></span>
        `;
        terminalContent.appendChild(line);
        const textSpan = line.querySelector('span:last-child') as HTMLElement;
        await typeText(textSpan, content.text, 34);
        return;
      }

      line.innerHTML = `
        <span class="mr-2 font-bold" style="color: ${content.color}">${content.icon}</span>
        <span style="color: ${content.color}">${content.text}</span>
      `;
      terminalContent.appendChild(line);
      await new Promise((resolve) => setTimeout(resolve, 120));
    };

    const addCursor = (): void => {
      const cursorLine = document.createElement('div');
      cursorLine.className = 'flex items-center mt-3';
      cursorLine.innerHTML = `
        <span class="text-[#8eb079] mr-2">~</span>
        <span class="text-[#e29e57] mr-2 font-bold">$</span>
        <span class="terminal-cursor"></span>
      `;
      terminalContent.appendChild(cursorLine);
    };

    const run = async (): Promise<void> => {
      await typeText(installCmd, 'npm install -g nextclaw', 34);
      await new Promise((resolve) => setTimeout(resolve, 550));
      for (const item of startupSequence) {
        await addLine(item);
        await new Promise((resolve) => setTimeout(resolve, 180));
      }
      addCursor();
    };

    setTimeout(() => {
      void run();
    }, 360);
  }
}

new LandingI18nApp().start();
