<div align="center">

# ⚡ NexusAI

### AI-Powered Productivity Toolkit

**10 free, open-source AI tools in one beautiful platform.**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Demo](#) · [Documentation](#) · [Contributing](CONTRIBUTING.md) · [Report Bug](../../issues)

</div>

---

## 🚀 What is NexusAI?

NexusAI is a **free, open-source** AI productivity platform that replaces 10+ separate paid tools with one unified interface. Every tool runs locally — your data never leaves your machine.

### 🛠️ Developer Tools
| Tool | Description |
|------|-------------|
| 📄 **README Generator** | Generate professional READMEs from any codebase |
| 📝 **Changelog Generator** | Create formatted changelogs from git commits |
| 🔍 **Codebase Explainer** | Explain any code in plain English (3 levels) |
| 🧪 **Unit Test Generator** | Generate tests for Python, JavaScript, and Java |

### 📝 Content Tools
| Tool | Description |
|------|-------------|
| 🌐 **Webpage Summarizer** | Summarize any webpage into key points |
| 🎬 **YouTube → Blog Post** | Convert any YouTube video into a blog article |
| 💼 **LinkedIn Post Writer** | Polish bullet points into viral LinkedIn posts |

### 🎯 Productivity & Finance
| Tool | Description |
|------|-------------|
| 🎙️ **Voice → Tasks** | Convert voice memos into prioritized task lists |
| 📋 **Resume Optimizer** | Match your resume to job descriptions with AI |
| 🧾 **Receipt Tracker** | Read receipts and track expenses automatically |

---

## ⚡ Quick Start

### Prerequisites
- **Node.js 20+** and **pnpm**
- **Python 3.11+**
- **Groq API key** (free at [console.groq.com](https://console.groq.com)) — or **Ollama** for fully offline use

### 1. Clone & Setup

```bash
git clone https://github.com/yonlysuraj/Nexus-AI.git
cd Nexus-AI
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
pnpm install
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 5. Run

```bash
# Terminal 1 — Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### Docker (Alternative)

```bash
cp .env.example .env
docker-compose up
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | FastAPI, Python 3.11+ |
| **AI** | Groq API (free), Ollama (local), OpenAI (optional) |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Speech** | Whisper (local, free) |
| **OCR** | Tesseract (local, free) |

---

## 📁 Project Structure

```
nexus-ai/
├── frontend/          # Next.js 14 application
├── backend/           # FastAPI application
├── planner/           # Project planning docs
├── docker-compose.yml
├── .env.example
├── LICENSE            # MIT
└── README.md
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

[MIT](LICENSE) — free for personal and commercial use.

---

<div align="center">

**Built with ❤️ by the open-source community**

⭐ Star this repo if you find it useful!

</div>
