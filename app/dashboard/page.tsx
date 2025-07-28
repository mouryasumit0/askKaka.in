"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Chatbot } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MessageCircle, Plus, Settings, BarChart3, LogOut, Globe, Clock, Users, Copy, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DashboardData {
  profile: any
  chatbots: Chatbot[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    websiteUrl: ''
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadDashboardData()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
  }

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Load chatbots
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setData({
        profile: profile || { email: user.email },
        chatbots: chatbots || []
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateChatbot = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/chatbots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          name: createForm.name || 'My Chatbot',
          website_url: createForm.websiteUrl
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create chatbot')
      }

      const result = await response.json()
      
      setShowCreateForm(false)
      setCreateForm({ name: '', websiteUrl: '' })
      loadDashboardData()
    } catch (error: any) {
      setError(error.message || 'Failed to create chatbot')
    } finally {
      setIsCreating(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const copyScriptTag = async (chatbot: Chatbot) => {
    if (chatbot.script_tag) {
      await navigator.clipboard.writeText(chatbot.script_tag)
      setCopiedScriptId(chatbot.id)
      setTimeout(() => setCopiedScriptId(null), 2000)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'training':
        return <Badge className="bg-yellow-100 text-yellow-800">Training</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge variant="secondary">Inactive</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {data?.profile?.full_name || 'User'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chatbots</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.chatbots?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.chatbots?.filter(bot => bot.status === 'active').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">conversations</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chatbots List */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Chatbots</h2>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Chatbot
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showCreateForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Create New Chatbot</CardTitle>
                  <CardDescription>
                    Add your website URL to start training your chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateChatbot} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Chatbot Name (Optional)</Label>
                      <Input
                        id="name"
                        placeholder="My Customer Support Bot"
                        value={createForm.name}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="websiteUrl">Website URL *</Label>
                      <Input
                        id="websiteUrl"
                        type="url"
                        placeholder="https://yourwebsite.com"
                        value={createForm.websiteUrl}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, websiteUrl: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'Create & Train'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {data?.chatbots?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No chatbots yet</h3>
                    <p className="text-gray-600 mb-4">Create your first chatbot to get started</p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Chatbot
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                data?.chatbots?.map((chatbot) => (
                  <Card key={chatbot.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{chatbot.name}</span>
                            {getStatusBadge(chatbot.status)}
                          </CardTitle>
                          <CardDescription className="flex items-center space-x-4 mt-2">
                            <span className="flex items-center">
                              <Globe className="h-4 w-4 mr-1" />
                              {chatbot.website_url}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(chatbot.created_at).toLocaleDateString()}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {chatbot.status === 'training' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Training Progress</span>
                            <span>{chatbot.training_progress}%</span>
                          </div>
                          <Progress value={chatbot.training_progress} />
                        </div>
                      )}
                      
                      {chatbot.status === 'active' && chatbot.script_tag && (
                        <div className="mb-4">
                          <Label className="text-sm font-medium">Integration Code</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              value={chatbot.script_tag}
                              readOnly
                              className="font-mono text-xs"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyScriptTag(chatbot)}
                            >
                              {copiedScriptId === chatbot.id ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                        {chatbot.status !== 'training' && (
                          <Button size="sm" variant="outline">
                            Retrain
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold text-blue-600">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Create a chatbot</p>
                    <p className="text-xs text-gray-600">Add your website URL to start</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold text-green-600">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Wait for training</p>
                    <p className="text-xs text-gray-600">AI will learn your content</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold text-purple-600">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Add to website</p>
                    <p className="text-xs text-gray-600">Copy the integration code</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Get started with our comprehensive guides and tutorials.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    📖 Documentation
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    🎥 Video Tutorials
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    💬 Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}