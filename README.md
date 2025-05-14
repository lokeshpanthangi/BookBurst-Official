<div align="center">

# 📚 BookBurst

<img src="public/logo.png" alt="BookBurst Logo" width="200"/>

### Your Personal Reading Journey Companion

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.io/)
[![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

## 🌟 Overview

BookBurst is a modern web application designed for book enthusiasts to track, discover, and share their reading journey. With an intuitive interface and powerful features, BookBurst helps you organize your reading life and connect with a community of fellow readers.

## ✨ Features

- 📖 **Personal Bookshelf**: Track books you're reading, want to read, and have finished
- 🔍 **Book Discovery**: Explore new books and get personalized recommendations
- 👥 **Community**: Connect with other readers and see what they're reading
- 📊 **Reading Stats**: Visualize your reading habits and progress
- ⭐ **Reviews & Ratings**: Share your thoughts on books and see what others think
- 📱 **Responsive Design**: Enjoy a seamless experience on any device
- 🌙 **Dark Mode**: Easy on the eyes with light and dark themes
- 📝 **Personal Notes**: Keep private notes on books you're reading
- 📅 **Timeline**: Track your reading journey over time

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bookburst.git

# Navigate to the project directory
cd bookburst

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the development server
npm run dev
```

## 🏗️ Project Structure

```
bookburst/
├── public/            # Static assets
├── src/
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React contexts for state management
│   ├── hooks/         # Custom React hooks
│   ├── integrations/  # External API integrations
│   ├── lib/           # Utility functions and helpers
│   ├── pages/         # Page components
│   ├── services/      # Service layer for data fetching
│   ├── styles/        # Global styles
│   └── types/         # TypeScript type definitions
├── .env.example       # Example environment variables
└── vite.config.ts     # Vite configuration
```

## 🔧 Technologies

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: React Query, Context API
- **Backend**: Supabase (Auth, Database, Storage)
- **Build Tool**: Vite
- **Deployment**: Netlify, Render

## 📱 Screenshots

<div align="center">
<img src="public/screenshots/home.png" alt="Home Page" width="400"/>
<img src="public/screenshots/bookshelf.png" alt="Bookshelf" width="400"/>
</div>

## 🔄 Deployment

BookBurst can be easily deployed to various platforms:

### Netlify

The project includes a `netlify.toml` configuration file for easy deployment to Netlify.

```bash
# Deploy to Netlify
npm run build
npx netlify deploy --prod
```

### Render

Use the included `render.yaml` configuration file to deploy to Render.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

Have questions or suggestions? Reach out to us:

- Email: contact@bookburst.app
- Twitter: [@BookBurstApp](https://twitter.com/BookBurstApp)

---

<div align="center">

📚 **Happy Reading with BookBurst!** 📚

</div>
