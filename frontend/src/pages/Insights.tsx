import React, { useState, useEffect } from 'react'
import { 
  Brain,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
import { apiClient } from '../lib/api'
import { InsightsData, AIAdvice, Prediction } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getChartColors } from '@/lib/chart-colors'
import { useTheme } from '@/components/ThemeProvider'

export function Insights() {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [adviceLoading, setAdviceLoading] = useState(false)
  const [predictionsLoading, setPredictionsLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(6)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isDark = mounted && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
  const chartColors = getChartColors(isDark)

  useEffect(() => {
    loadInsights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod])

  // Reload insights when window regains focus (but not AI features)
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadInsights()
      }
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadInsights = async () => {
    setLoading(true)
    try {
      // Load insights only (AI features are loaded manually via buttons)
      const insightsRes = await apiClient.getInsights({ months: selectedPeriod }).catch(err => {
        console.warn('Failed to load insights:', err)
        return null
      })
      console.log('Insights data received:', insightsRes) // Debug log
      setInsights(insightsRes)
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAdvice = async () => {
    setAdviceLoading(true)
    try {
      const adviceRes = await apiClient.getAdvice().catch(err => {
        console.warn('Failed to load AI advice:', err)
        return null
      })
      console.log('AI Advice response:', adviceRes) // Debug log
      
      if (adviceRes) {
        console.log('Setting AI advice:', adviceRes) // Debug log
        // Ensure we have the advice object, not wrapped in success/advice
        const adviceData = (adviceRes as any).advice || adviceRes
        setAiAdvice(adviceData)
      } else {
        setAiAdvice(null)
      }
    } catch (error) {
      console.error('Error loading AI advice:', error)
      setAiAdvice(null)
    } finally {
      setAdviceLoading(false)
    }
  }

  const generatePredictions = async () => {
    setPredictionsLoading(true)
    try {
      const predictionsRes = await apiClient.getPredictions().catch(err => {
        console.warn('Failed to load predictions:', err)
        return null
      })
      console.log('Predictions response:', predictionsRes) // Debug log
      
      if (predictionsRes) {
        // Check if it's an error response with insufficient_data
        if (predictionsRes.insufficient_data === true || (predictionsRes.predictions && predictionsRes.predictions.length === 0 && predictionsRes.insufficient_data)) {
          setPredictions([])
        } else if (predictionsRes.predictions && Array.isArray(predictionsRes.predictions)) {
          setPredictions(predictionsRes.predictions)
        } else {
          // If response structure is different, try to extract predictions
          setPredictions([])
        }
      } else {
        setPredictions([])
      }
    } catch (error) {
      console.error('Error loading predictions:', error)
      setPredictions([])
    } finally {
      setPredictionsLoading(false)
    }
  }

  const topMerchants = (insights?.top_merchants ?? []).map(merchant => ({
    name: merchant.merchant,
    amount: Math.abs(merchant.total),
    count: merchant.count
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }


  const safeAdvice = aiAdvice && !aiAdvice.error
    ? {
        ...aiAdvice,
        summary: aiAdvice.summary || '',
        concerns: Array.isArray(aiAdvice.concerns) ? aiAdvice.concerns : [],
        recommendations: Array.isArray(aiAdvice.recommendations) ? aiAdvice.recommendations : [],
        positive_feedback: Array.isArray(aiAdvice.positive_feedback) ? aiAdvice.positive_feedback : [],
        next_steps: Array.isArray((aiAdvice as any).next_steps) ? (aiAdvice as any).next_steps : [],
        confidence_score: aiAdvice.confidence_score || 0,
      }
    : null

  console.log('Safe advice constructed:', safeAdvice) // Debug log
  console.log('Predictions state:', predictions) // Debug log

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Insights</h1>
          <p className="text-muted-foreground">AI-powered financial analysis and predictions</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              loadInsights()
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <label className="text-sm font-medium text-foreground">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => {
              e.stopPropagation()
              setSelectedPeriod(parseInt(e.target.value))
            }}
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
      </div>

      {/* Top Merchants */}
      <Card>
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          {topMerchants.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">No merchant data available</p>
                <p className="text-sm">Add expense transactions with merchants to see top spending locations</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topMerchants.slice(0, 10)}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) - 2px)',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill={chartColors[0]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* AI Predictions */}
      <Card onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-6 w-6 text-primary mr-2" />
              <CardTitle>AI Spending Predictions</CardTitle>
            </div>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                generatePredictions()
              }}
              disabled={predictionsLoading}
              variant="outline"
              size="sm"
            >
              {predictionsLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Prediction
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {predictionsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Generating predictions...</span>
            </div>
          )}
          {!predictionsLoading && predictions.length === 0 && (
            <div className="p-6 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground mb-4">
                Click "Generate Prediction" to get AI-powered spending predictions based on your transaction history.
              </p>
              <p className="text-sm text-muted-foreground">
                Note: You need at least 15 transactions to generate accurate predictions.
              </p>
            </div>
          )}
          {!predictionsLoading && predictions.length > 0 && (
            <div className="space-y-3">
              <p className="text-foreground mb-4">
                Based on your spending patterns, here are the predicted expenses for the upcoming month:
              </p>
              <ul className="space-y-2 text-foreground">
                {predictions.slice(0, 5).map((prediction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 text-primary font-bold">{index + 1}.</span>
                    <span>
                      <span className="font-medium capitalize">{prediction.category}</span>
                      {' '}spending is predicted to be{' '}
                      <span className="font-semibold text-primary">
                        ${Number(prediction.predicted_amount || 0).toFixed(2)}
                      </span>
                      {' '}for{' '}
                      {new Date(prediction.year, prediction.month - 1).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}.
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Financial Advice */}
      <Card onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-6 w-6 text-primary mr-2" />
              <CardTitle>AI Financial Advice</CardTitle>
            </div>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                generateAdvice()
              }}
              disabled={adviceLoading}
              variant="outline"
              size="sm"
            >
              {adviceLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Advice
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {adviceLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Generating AI advice...</span>
            </div>
          )}
          {!adviceLoading && !safeAdvice && (
            <div className="p-6 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground mb-4">
                Click "Generate Advice" to get personalized AI-powered financial advice based on your spending patterns.
              </p>
              <p className="text-sm text-muted-foreground">
                Note: You need at least 10 transactions to generate accurate advice.
              </p>
            </div>
          )}
          {!adviceLoading && safeAdvice && (safeAdvice as any).insufficient_data && (
            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Insufficient Data</h4>
                  <p className="text-yellow-800 dark:text-yellow-200">
                    {safeAdvice.summary || 'We need at least 10 transactions to generate accurate financial advice.'}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                    Add more transactions to unlock personalized AI financial advice.
                  </p>
                </div>
              </div>
            </div>
          )}
          {!adviceLoading && safeAdvice && !(safeAdvice as any).insufficient_data && (
            <div>
              <div className="flex items-center justify-end mb-4">
                {safeAdvice.confidence_score > 0 && (
                  <Badge variant="secondary">
                    {safeAdvice.confidence_score}% confidence
                  </Badge>
                )}
              </div>
            <div className="space-y-4">
              {safeAdvice.summary && (
                <div className="mb-4">
                  <p className="text-foreground leading-relaxed">{safeAdvice.summary}</p>
                </div>
              )}

              {/* Combine all advice into 4-5 key points */}
              <div className="space-y-3">
                {safeAdvice.concerns && safeAdvice.concerns.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Key Concerns
                    </h4>
                    <ul className="text-red-800 dark:text-red-200 space-y-1 text-sm">
                      {safeAdvice.concerns.slice(0, 3).map((concern, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {safeAdvice.recommendations && safeAdvice.recommendations.length > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Top Recommendations
                    </h4>
                    <ul className="text-green-800 dark:text-green-200 space-y-2 text-sm">
                      {safeAdvice.recommendations.slice(0, 5).map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2 font-bold">{index + 1}.</span>
                          <div>
                            <span className="font-medium">{rec.title || `Recommendation ${index + 1}`}:</span>
                            {' '}
                            <span>{rec.description}</span>
                            {rec.potential_savings && (
                              <span className="text-green-700 dark:text-green-300 ml-1">
                                (Potential savings: {rec.potential_savings})
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {safeAdvice.positive_feedback && safeAdvice.positive_feedback.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      Positive Highlights
                    </h4>
                    <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-sm">
                      {safeAdvice.positive_feedback.slice(0, 3).map((feedback, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">✓</span>
                          <span>{feedback}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {safeAdvice.next_steps && safeAdvice.next_steps.length > 0 && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Next Steps
                    </h4>
                    <ul className="text-purple-800 dark:text-purple-200 space-y-1 text-sm">
                      {safeAdvice.next_steps.slice(0, 5).map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2 font-bold">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Show message if advice exists but no sections have data */}
                {!safeAdvice.summary && 
                 (!safeAdvice.concerns || safeAdvice.concerns.length === 0) && 
                 (!safeAdvice.recommendations || safeAdvice.recommendations.length === 0) && 
                 (!safeAdvice.positive_feedback || safeAdvice.positive_feedback.length === 0) &&
                 (!safeAdvice.next_steps || safeAdvice.next_steps.length === 0) && (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-muted-foreground">
                      AI advice is being generated. Please check back in a moment or refresh the page.
                    </p>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}
          </CardContent>
        </Card>
    </div>
  )
}
