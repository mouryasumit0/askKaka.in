import * as cheerio from 'cheerio'
import { JSDOM } from 'jsdom'
import DOMPurify from 'isomorphic-dompurify'

interface ScrapedPage {
  url: string
  title: string
  content: string
  metadata: {
    description?: string
    keywords?: string[]
    headings: string[]
  }
}

export class WebScraper {
  private visited = new Set<string>()
  private maxPages = 50
  private maxDepth = 3

  async scrapeWebsite(startUrl: string): Promise<ScrapedPage[]> {
    const pages: ScrapedPage[] = []
    const urlsToVisit = [{ url: startUrl, depth: 0 }]
    
    while (urlsToVisit.length > 0 && pages.length < this.maxPages) {
      const { url, depth } = urlsToVisit.shift()!
      
      if (this.visited.has(url) || depth > this.maxDepth) {
        continue
      }
      
      try {
        const page = await this.scrapePage(url)
        if (page) {
          pages.push(page)
          this.visited.add(url)
          
          // Extract links for further crawling
          if (depth < this.maxDepth) {
            const links = await this.extractLinks(url, page.content)
            links.forEach(link => {
              if (!this.visited.has(link)) {
                urlsToVisit.push({ url: link, depth: depth + 1 })
              }
            })
          }
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error)
      }
    }
    
    return pages
  }

  private async scrapePage(url: string): Promise<ScrapedPage | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AskKaka.in Bot 1.0'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, .menu, .navigation').remove()
      
      // Extract content
      const title = $('title').text().trim() || $('h1').first().text().trim()
      const description = $('meta[name="description"]').attr('content')
      const keywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim())
      
      // Extract headings
      const headings: string[] = []
      $('h1, h2, h3, h4, h5, h6').each((_, el) => {
        const text = $(el).text().trim()
        if (text) headings.push(text)
      })
      
      // Extract main content
      let content = ''
      const contentSelectors = [
        'main',
        '[role="main"]',
        '.content',
        '.main-content',
        'article',
        '.post-content',
        'body'
      ]
      
      for (const selector of contentSelectors) {
        const element = $(selector).first()
        if (element.length) {
          content = element.text()
          break
        }
      }
      
      // Fallback to body text
      if (!content) {
        content = $('body').text()
      }
      
      // Clean and sanitize content
      content = this.cleanContent(content)
      
      if (!content || content.length < 100) {
        return null
      }
      
      return {
        url,
        title,
        content,
        metadata: {
          description,
          keywords,
          headings
        }
      }
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error)
      return null
    }
  }

  private async extractLinks(baseUrl: string, content: string): Promise<string[]> {
    const $ = cheerio.load(content)
    const links: string[] = []
    const baseUrlObj = new URL(baseUrl)
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).toString()
          const urlObj = new URL(absoluteUrl)
          
          // Only include links from the same domain
          if (urlObj.hostname === baseUrlObj.hostname) {
            links.push(absoluteUrl)
          }
        } catch (error) {
          // Invalid URL, skip
        }
      }
    })
    
    return [...new Set(links)] // Remove duplicates
  }

  private cleanContent(text: string): string {
    // Remove extra whitespace and clean up text
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()
  }
}

export function chunkContent(content: string, maxLength = 1000): string[] {
  const chunks: string[] = []
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  let currentChunk = ''
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}