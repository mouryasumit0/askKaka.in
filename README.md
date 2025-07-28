# AskKaka.in - Multilingual AI Chatbots for Indian Businesses

AskKaka.in is a Next.js application that enables Indian businesses to create intelligent chatbots that understand English, Hindi, and Hinglish. The platform automatically trains on website content and provides instant multilingual customer support.

## 🚀 Features

- **Multilingual Support**: Natural conversations in English, Hindi, and Hinglish
- **Auto-Training**: Scrapes and learns from website content automatically
- **Fast Responses**: < 4 second response guarantee with vector search optimization
- **Easy Integration**: One-line script tag integration for any website
- **Real-time Analytics**: Track conversations, response times, and language preferences
- **Secure & Scalable**: Built on Supabase with row-level security

## 🏗️ Architecture

- **Frontend**: Next.js 13+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with serverless functions
- **Database**: Supabase (PostgreSQL) with vector extensions
- **AI/ML**: Google Gemini API for embeddings and chat responses
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Gemini API key
- (Optional) Vercel account for deployment

## 🛠️ Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd askkaka-chatbot-platform
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   
   Copy \`.env.local\` and fill in your credentials:
   \`\`\`bash
   cp .env.local .env.local
   \`\`\`
   
   Update the following variables:
   - \`NEXT_PUBLIC_SUPABASE_URL\`: Your Supabase project URL
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`: Your Supabase anon key
   - \`SUPABASE_SERVICE_ROLE_KEY\`: Your Supabase service role key
   - \`GEMINI_API_KEY\`: Your Google Gemini API key
   - \`NEXT_PUBLIC_APP_URL\`: Your app URL (http://localhost:3000 for development)

4. **Set up the database**
   
   Run the SQL migration in your Supabase SQL editor:
   \`\`\`bash
   # Copy and execute the contents of supabase/migrations/01_create_initial_schema.sql
   \`\`\`

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Usage

### Creating Your First Chatbot

1. **Sign up** for an account at `/signup`
2. **Login** to access your dashboard at `/dashboard`
3. **Create a chatbot** by clicking "Create Chatbot"
4. **Enter your website URL** and click "Create & Train"
5. **Wait for training** to complete (progress will show on dashboard)
6. **Copy the integration script** and add it to your website

### Integration

Once your chatbot is trained, copy the provided script tag and add it to your website:

\`\`\`html
<script>
(function(w,d,s,c){
  w.AskKakaConfig = w.AskKakaConfig || { chatbotId: 'your-chatbot-id' };
  var js = d.createElement(s);
  js.src = 'https://your-domain.com/api/widget/' + c + '.js';
  js.async = true;
  d.head.appendChild(js);
})(window, document, 'script', 'your-chatbot-id');
</script>
\`\`\`

## 🧪 Testing

The chatbot supports conversations in:
- **English**: Standard business English
- **Hindi**: Native Hindi script (देवनागरी)
- **Hinglish**: Natural mix of Hindi and English ("Kya haal hai? How can I help?")

Test messages:
- English: "What are your business hours?"
- Hindi: "आपके व्यापारिक घंटे क्या हैं?"
- Hinglish: "Bhai, kya time pe open rehte ho?"

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub** and connect to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Start production server**
   \`\`\`bash
   npm start
   \`\`\`

## 🔧 Configuration

### Database Setup

The application uses Supabase with the following key tables:
- \`profiles\`: User information
- \`chatbots\`: Chatbot configurations
- \`content_chunks\`: Website content with vector embeddings
- \`conversations\`: Chat conversation tracking
- \`messages\`: Individual chat messages
- \`usage_stats\`: Analytics data

### Security

- Row-level security (RLS) enabled on all tables
- User data isolation with policy-based access control
- API rate limiting and input validation
- Secure token-based authentication

## 📊 Monitoring

The application includes comprehensive logging and monitoring:
- API response times and status codes
- Chat response performance metrics
- Training progress and error tracking
- User analytics and usage patterns

## 🛠️ Development

### Project Structure

\`\`\`
/app
  /api               # API routes
    /chat           # Chat processing
    /chatbots       # Chatbot management
    /train          # Training pipeline
    /widget         # Embeddable widget
  /dashboard        # User dashboard
  /login            # Authentication
  /signup           # User registration
/lib
  /supabase.ts      # Database client
  /gemini.ts        # AI integrations
  /scraper.ts       # Web scraping
  /language.ts      # Language detection
  /monitoring.ts    # Logging & analytics
/supabase
  /migrations       # Database schema
\`\`\`

### Adding Features

1. **Database changes**: Add migrations to \`/supabase/migrations/\`
2. **API endpoints**: Create in \`/app/api/\`
3. **UI components**: Add to \`/components/ui/\` (shadcn/ui)
4. **Pages**: Create in \`/app/\` following App Router conventions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit changes (\`git commit -m 'Add amazing feature'\`)
4. Push to branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@askkaka.in
- 📖 Documentation: [docs.askkaka.in](https://docs.askkaka.in)
- 🐛 Issues: GitHub Issues

## 🙏 Acknowledgments

- Google Gemini AI for language processing
- Supabase for backend infrastructure
- Vercel for hosting and deployment
- Next.js team for the amazing framework

---

Made with ❤️ for Indian businesses by the AskKaka.in team.