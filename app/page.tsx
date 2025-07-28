import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Globe, Zap, Shield, BarChart3, Code } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4">
      {/* Header */}
      <header className="py-6 border-b border-gray-200">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AskKaka.in</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Multilingual AI Chatbots for
            <span className="text-blue-600"> Indian Businesses</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Create intelligent chatbots that understand English, Hindi, and Hinglish. 
            Train them on your website content and provide 24/7 customer support in your customers' preferred language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="px-8 py-4">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="px-8 py-4">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose AskKaka.in?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Globe className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Multilingual Support</CardTitle>
                <CardDescription>
                  Natural conversations in English, Hindi, and Hinglish
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our AI understands the nuances of Indian languages and can seamlessly switch between them based on customer preference.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-12 w-12 text-yellow-600 mb-4" />
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Responses in under 4 seconds guaranteed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Optimized for speed with advanced caching and vector search to ensure your customers never wait.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your data stays protected with enterprise-grade security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Built on Supabase with row-level security, ensuring your business data and customer conversations remain private.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Code className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Easy Integration</CardTitle>
                <CardDescription>
                  One line of code to add to any website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Simple JavaScript widget that works with any website, CMS, or platform. No technical expertise required.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Smart Analytics</CardTitle>
                <CardDescription>
                  Detailed insights into customer interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Track conversations, response times, language preferences, and customer satisfaction to improve your service.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Auto-Learning</CardTitle>
                <CardDescription>
                  Learns from your website content automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Just provide your website URL and our AI will crawl, understand, and learn from your content to answer customer questions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 -mx-4">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Add Your Website</h3>
              <p className="text-gray-600">
                Simply enter your website URL and we'll automatically crawl and understand your content.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Training</h3>
              <p className="text-gray-600">
                Our AI processes your content and creates a knowledge base for multilingual conversations.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Deploy & Chat</h3>
              <p className="text-gray-600">
                Add one line of code to your website and start serving customers in their preferred language.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Customer Support?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of Indian businesses already using AskKaka.in to provide better customer experiences.
          </p>
          <Link href="/signup">
            <Button size="lg" className="px-12 py-4 text-lg">
              Get Started for Free
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AskKaka.in</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
              <Link href="/contact" className="hover:text-gray-900">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © 2024 AskKaka.in. All rights reserved. Made with ❤️ for Indian businesses.
          </div>
        </div>
      </footer>
    </div>
  )
}