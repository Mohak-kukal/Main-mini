import React, { useState, useEffect } from 'react'
import { Plus, Upload, Edit, Trash2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { apiClient } from '../lib/api'
import { Transaction, Account } from '../types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [formData, setFormData] = useState({
    account_id: 0,
    date: new Date().toISOString().split('T')[0],
    amount: '',
    merchant: '',
    description: '',
    category: ''
  })
  const [isRecurring, setIsRecurring] = useState(false)
  const [isExpense, setIsExpense] = useState(true)
  const [filters, setFilters] = useState({
    account_id: '',
    category: '',
    start_date: '',
    end_date: ''
  })
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [processingRecurring, setProcessingRecurring] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    pages: 1
  })

  useEffect(() => {
    loadCategories()
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [filters.account_id, filters.category, filters.start_date, filters.end_date])

  useEffect(() => {
    loadData()
  }, [currentPage, filters.account_id, filters.category, filters.start_date, filters.end_date])

  const loadCategories = async () => {
    try {
      const response = await apiClient.getCategories()
      setAvailableCategories(response.categories)
    } catch (error) {
      console.error('Error loading categories:', error)
      // Fallback to base categories
      setAvailableCategories(['food', 'transportation', 'shopping', 'entertainment', 'utilities', 'healthcare', 'education', 'travel', 'insurance', 'other'])
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 100
      }
      
      // Add filters to params
      if (filters.account_id && filters.account_id !== 'all') {
        params.account_id = parseInt(filters.account_id)
      }
      if (filters.category && filters.category !== 'all') {
        params.category = filters.category
      }
      if (filters.start_date) {
        params.start_date = filters.start_date
      }
      if (filters.end_date) {
        params.end_date = filters.end_date
      }

      const [transactionsRes, accountsRes] = await Promise.all([
        apiClient.getTransactions(params),
        apiClient.getAccounts()
      ])
      setTransactions(transactionsRes.transactions)
      setAccounts(accountsRes.accounts)
      setPagination(transactionsRes.pagination)
      
      // Reload categories to get any new ones
      await loadCategories()
      
      // Clear selection when data reloads
      setSelectedTransactions(new Set())
      // If no account selected, default to first account
      if ((formData.account_id === 0 || !formData.account_id) && accountsRes.accounts.length > 0) {
        setFormData({ ...formData, account_id: accountsRes.accounts[0].id })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setErrorMsg('')
      if (!formData.account_id || formData.account_id <= 0) {
        setErrorMsg('Please select an account')
        return
      }
      const amt = Math.abs(Number(formData.amount) || 0)
      if (amt === 0) {
        setErrorMsg('Amount cannot be zero')
        return
      }
      const finalAmount = isExpense ? -amt : amt
      
      const transactionData = {
        ...formData,
        amount: finalAmount,
        is_recurring: isRecurring
      }

      if (editingTransaction) {
        await apiClient.updateTransaction(editingTransaction.id, transactionData)
      } else {
        await apiClient.createTransaction(transactionData)
      }
      setShowForm(false)
      setEditingTransaction(null)
      setFormData({
        account_id: 0,
        date: new Date().toISOString().split('T')[0],
        amount: '',
        merchant: '',
        description: '',
        category: ''
      })
      setIsExpense(true)
      setIsRecurring(false)
      // Reset to page 1 to show the newly added/updated transaction
      setCurrentPage(1)
      setSuccessMsg('Transaction saved')
      setTimeout(() => setSuccessMsg(''), 2000)
    } catch (error) {
      console.error('Error saving transaction:', error)
      setErrorMsg((error as any)?.response?.data?.error || 'Failed to save transaction')
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      account_id: transaction.account_id,
      date: transaction.date,
      amount: Math.abs(transaction.amount || 0).toString(),
      merchant: transaction.merchant || '',
      description: transaction.description || '',
      category: transaction.category || ''
    })
    setIsExpense((transaction.amount || 0) < 0)
    setIsRecurring((transaction as any).is_recurring || false)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await apiClient.deleteTransaction(id)
        loadData()
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }

  const handleSelectTransaction = (id: number) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTransactions.size === 0) return

    const count = selectedTransactions.size
    if (!window.confirm(`Are you sure you want to delete ${count} transaction(s)?`)) {
      return
    }

    setDeleting(true)
    try {
      await apiClient.bulkDeleteTransactions(Array.from(selectedTransactions))
      setSelectedTransactions(new Set())
      setSuccessMsg(`${count} transaction(s) deleted successfully`)
      setTimeout(() => setSuccessMsg(''), 3000)
      loadData()
    } catch (error: any) {
      console.error('Error bulk deleting transactions:', error)
      setErrorMsg(error?.response?.data?.error || 'Failed to delete transactions')
    } finally {
      setDeleting(false)
    }
  }

  const handleProcessRecurring = async () => {
    setProcessingRecurring(true)
    try {
      const result = await apiClient.processRecurringTransactions()
      setSuccessMsg(`Processed ${result.processed} recurring transaction(s)`)
      setTimeout(() => setSuccessMsg(''), 3000)
      loadData() // Reload to show new transactions
    } catch (error: any) {
      console.error('Error processing recurring transactions:', error)
      setErrorMsg(error?.response?.data?.error || 'Failed to process recurring transactions')
    } finally {
      setProcessingRecurring(false)
    }
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingReceipt(true)
    try {
      const result = await apiClient.uploadReceipt(file)
      // Handle both shapes: {success, data:{...}} or direct fields
      const extracted = (result as any)?.data?.data || (result as any)?.data || result
      if (extracted && (extracted.merchant || extracted.total_amount || extracted.date)) {
        // Build description from items if available
        let description = ''
        if (extracted.items && Array.isArray(extracted.items) && extracted.items.length > 0) {
          description = extracted.items.map((item: any) => item.description || '').filter(Boolean).join(', ')
        }
        
        // Normalize category to lowercase to match Select values
        let normalizedCategory = ''
        if (extracted.category) {
          const categoryLower = extracted.category.toLowerCase().trim()
          // Map common variations to our category values
          const categoryMap: Record<string, string> = {
            'food': 'food',
            'restaurant': 'food',
            'dining': 'food',
            'groceries': 'food',
            'transportation': 'transportation',
            'transport': 'transportation',
            'travel': 'travel',
            'shopping': 'shopping',
            'retail': 'shopping',
            'entertainment': 'entertainment',
            'utilities': 'utilities',
            'utility': 'utilities',
            'healthcare': 'healthcare',
            'health': 'healthcare',
            'medical': 'healthcare',
            'education': 'education',
            'insurance': 'insurance',
            'other': 'other'
          }
          normalizedCategory = categoryMap[categoryLower] || categoryLower
        }
        
        // Set all form data at once to avoid overwriting
        const newFormData = {
          account_id: accounts.length === 1 ? accounts[0].id : formData.account_id || 0,
          merchant: extracted.merchant || '',
          date: extracted.date || new Date().toISOString().split('T')[0],
          amount: (Number(extracted.total_amount) || 0).toString(),
          category: normalizedCategory,
          description: description || extracted.description || ''
        }
        setFormData(newFormData)
        // If a new category was extracted, add it to available categories
        if (normalizedCategory && !availableCategories.includes(normalizedCategory)) {
          setAvailableCategories(prev => {
            const newCats = [...prev, normalizedCategory].sort()
            return Array.from(new Set(newCats))
          })
        }
        setShowForm(true)
      } else {
        // Fallback: open empty form with today's date
        setErrorMsg('Could not extract fields from receipt. Please fill manually.')
        setFormData({
          ...formData,
          account_id: accounts.length === 1 ? accounts[0].id : formData.account_id || 0,
          date: new Date().toISOString().split('T')[0],
        })
        setShowForm(true)
      }
    } catch (error: any) {
      console.error('Error uploading receipt:', error)
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to process receipt'
      setErrorMsg(`${errorMessage}. You can enter details manually.`)
      // Open form anyway to allow manual entry
      setFormData({
        ...formData,
        account_id: accounts.length === 1 ? accounts[0].id : formData.account_id || 0,
        date: new Date().toISOString().split('T')[0],
      })
      setShowForm(true)
    } finally {
      setUploadingReceipt(false)
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (filters.account_id && filters.account_id !== 'all' && transaction.account_id !== parseInt(filters.account_id)) return false
    if (filters.category && filters.category !== 'all' && transaction.category !== filters.category) return false
    if (filters.start_date && transaction.date < filters.start_date) return false
    if (filters.end_date && transaction.date > filters.end_date) return false
    return true
  })

  // Clear selection when filters change
  useEffect(() => {
    setSelectedTransactions(new Set())
  }, [filters.account_id, filters.category, filters.start_date, filters.end_date])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Track your income and expenses</p>
        </div>
        <div className="flex space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleReceiptUpload}
            className="hidden"
            disabled={uploadingReceipt}
          />
          <Button 
            variant="outline" 
            type="button" 
            disabled={processingRecurring}
            onClick={handleProcessRecurring}
            title="Process recurring transactions"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${processingRecurring ? 'animate-spin' : ''}`} />
            Process Recurring
          </Button>
          <Button 
            variant="default" 
            className="bg-green-600 hover:bg-green-700" 
            type="button" 
            disabled={uploadingReceipt}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Receipt
          </Button>
          <Button
            onClick={() => {
              if (accounts.length > 0) {
                setFormData(prev => ({ ...prev, account_id: prev.account_id || accounts[0].id }))
              }
              setShowForm(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 px-4 py-2 rounded mb-4">
          {successMsg}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={filters.account_id || undefined}
                onValueChange={(value) => setFilters({ ...filters, account_id: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={String(account.id)}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.category || undefined}
                onValueChange={(value) => setFilters({ ...filters, category: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTransactions.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {selectedTransactions.size} transaction(s) selected
              </span>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : `Delete Selected (${selectedTransactions.size})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={filteredTransactions.length > 0 && selectedTransactions.size === filteredTransactions.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Merchant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.has(transaction.id)}
                      onChange={() => handleSelectTransaction(transaction.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {(() => {
                      const date = new Date(transaction.date);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      return `${day}/${month}/${year}`;
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {transaction.merchant || transaction.description || 'Unknown'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className="capitalize">
                      {transaction.category || 'uncategorized'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {transaction.account_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${
                      transaction.amount < 0 ? 'text-destructive' : 'text-green-600'
                    }`}>
                      {transaction.amount < 0 ? '-' : '+'}₹{Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.pages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={currentPage === pagination.pages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </DialogTitle>
          </DialogHeader>
          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded text-sm">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select
                value={String(formData.account_id)}
                onValueChange={(value) => setFormData({ ...formData, account_id: parseInt(value) })}
              >
                <SelectTrigger id="account">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={String(account.id)}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value
                  // Allow empty string, negative sign, or valid numbers
                  if (value === '' || value === '-' || /^-?\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, amount: value })
                  }
                }}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <RadioGroup value={isExpense ? 'expense' : 'income'} onValueChange={(value) => setIsExpense(value === 'expense')}>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="expense" />
                    <Label htmlFor="expense" className="cursor-pointer">Expense</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="income" />
                    <Label htmlFor="income" className="cursor-pointer">Income</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="recurring" className="cursor-pointer">
                  Recurring Transaction
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant</Label>
              <Input
                id="merchant"
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category || undefined}
                onValueChange={(value) => {
                  setFormData({ ...formData, category: value })
                  // If it's a new category, add it to the list
                  if (value && !availableCategories.includes(value.toLowerCase())) {
                    setAvailableCategories(prev => {
                      const newCats = [...prev, value.toLowerCase()].sort()
                      return Array.from(new Set(newCats))
                    })
                  }
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select Category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
              >
                {editingTransaction ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingTransaction(null)
                  setFormData({
                    account_id: 0,
                    date: new Date().toISOString().split('T')[0],
                    amount: '',
                    merchant: '',
                    description: '',
                    category: ''
                  })
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
