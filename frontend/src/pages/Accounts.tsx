import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, CreditCard, DollarSign, Download, Repeat } from 'lucide-react'
import { apiClient } from '../lib/api'
import { Account, RecurringTransaction } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as const,
    balance: '' as number | string
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showExportForm, setShowExportForm] = useState(false)
  const [exportingAccount, setExportingAccount] = useState<Account | null>(null)
  const [exportFormData, setExportFormData] = useState({
    start_date: '',
    end_date: ''
  })
  const [exporting, setExporting] = useState(false)
  const [showRecurringDialog, setShowRecurringDialog] = useState(false)
  const [recurringAccount, setRecurringAccount] = useState<Account | null>(null)
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [loadingRecurring, setLoadingRecurring] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null)
  const [recurringFormData, setRecurringFormData] = useState({
    merchant: '',
    description: '',
    category: '',
    amount: '',
    day_of_month: '',
    end_date: '',
    is_active: true
  })
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  useEffect(() => {
    loadAccounts()
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await apiClient.getCategories()
      setAvailableCategories(response.categories)
    } catch (error) {
      console.error('Error loading categories:', error)
      setAvailableCategories(['food', 'transportation', 'shopping', 'entertainment', 'utilities', 'healthcare', 'education', 'travel', 'insurance', 'other'])
    }
  }

  const loadAccounts = async () => {
    try {
      const response = await apiClient.getAccounts()
      setAccounts(response.accounts)
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    try {
      const balanceValue = typeof formData.balance === 'string' 
        ? (formData.balance === '' ? 0 : parseFloat(formData.balance) || 0)
        : formData.balance

      if (editingAccount) {
        await apiClient.updateAccount(editingAccount.id, {
          name: formData.name,
          type: formData.type,
          balance: balanceValue
        })
        setSuccess('Account updated successfully!')
      } else {
        await apiClient.createAccount(formData.name, formData.type, balanceValue)
        setSuccess('Account created successfully!')
      }
      
      setTimeout(() => {
        setShowForm(false)
        setEditingAccount(null)
        setFormData({ name: '', type: 'checking', balance: '' })
        setSuccess(null)
        loadAccounts()
      }, 1000)
    } catch (error: any) {
      console.error('Error saving account:', error)
      if (error?.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.')
      } else {
        setError(error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to save account. Please try again.')
      }
    }
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance
    })
    setError(null)
    setSuccess(null)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await apiClient.deleteAccount(id)
        loadAccounts()
      } catch (error) {
        console.error('Error deleting account:', error)
      }
    }
  }

  const handleExportClick = (account: Account) => {
    setExportingAccount(account)
    setExportFormData({ start_date: '', end_date: '' })
    setShowExportForm(true)
    setError(null)
  }

  const handleExport = async () => {
    if (!exportingAccount) return

    setExporting(true)
    setError(null)
    try {
      const blob = await apiClient.exportTransactions(
        exportingAccount.id,
        exportFormData.start_date || undefined,
        exportFormData.end_date || undefined
      )
      
      // Check if blob is actually a PDF (check content type or size)
      if (blob.size === 0) {
        throw new Error('Received empty file')
      }
      
      // Check if the blob might be an error JSON response
      if (blob.type === 'application/json' || blob.type === 'text/json') {
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.error || 'Failed to export transactions')
        } catch (e) {
          throw new Error('Failed to export transactions')
        }
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const filename = `transactions_${exportingAccount.name}_${exportFormData.start_date || 'all'}_${exportFormData.end_date || 'all'}.pdf`.replace(/[^a-z0-9._-]/gi, '_')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setShowExportForm(false)
      setExportingAccount(null)
      setSuccess('Transactions exported successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error exporting transactions:', error)
      let errorMessage = 'Failed to export transactions'
      if (error?.response?.data) {
        // If response data is a blob, try to read it as text
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text()
            const errorData = JSON.parse(text)
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            errorMessage = error?.response?.data?.error || error?.message || errorMessage
          }
        } else {
          errorMessage = error?.response?.data?.error || errorMessage
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      setError(errorMessage)
    } finally {
      setExporting(false)
    }
  }

  const handleRecurringClick = async (account: Account) => {
    setRecurringAccount(account)
    setShowRecurringDialog(true)
    setError(null)
    setLoadingRecurring(true)
    try {
      const response = await apiClient.getRecurringTransactions(account.id)
      setRecurringTransactions(response.recurring_transactions)
    } catch (error: any) {
      console.error('Error loading recurring transactions:', error)
      setError(error?.response?.data?.error || 'Failed to load recurring transactions')
    } finally {
      setLoadingRecurring(false)
    }
  }

  const handleEditRecurring = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring)
    setRecurringFormData({
      merchant: recurring.merchant || '',
      description: recurring.description || '',
      category: recurring.category || '',
      amount: recurring.amount.toString(),
      day_of_month: recurring.day_of_month.toString(),
      end_date: recurring.end_date || '',
      is_active: recurring.is_active
    })
    setError(null)
  }

  const handleSaveRecurring = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRecurring) return

    setError(null)
    try {
      await apiClient.updateRecurringTransaction(editingRecurring.id, {
        merchant: recurringFormData.merchant || undefined,
        description: recurringFormData.description || undefined,
        category: recurringFormData.category || undefined,
        amount: recurringFormData.amount ? parseFloat(recurringFormData.amount) : undefined,
        day_of_month: recurringFormData.day_of_month ? parseInt(recurringFormData.day_of_month) : undefined,
        end_date: recurringFormData.end_date || null,
        is_active: recurringFormData.is_active
      })
      
      // Reload recurring transactions
      if (recurringAccount) {
        const response = await apiClient.getRecurringTransactions(recurringAccount.id)
        setRecurringTransactions(response.recurring_transactions)
      }
      
      setEditingRecurring(null)
      setRecurringFormData({
        merchant: '',
        description: '',
        category: '',
        amount: '',
        day_of_month: '',
        end_date: '',
        is_active: true
      })
      setSuccess('Recurring transaction updated successfully!')
      setTimeout(() => setSuccess(null), 2000)
    } catch (error: any) {
      console.error('Error updating recurring transaction:', error)
      setError(error?.response?.data?.error || 'Failed to update recurring transaction')
    }
  }

  const handleDeleteRecurring = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this recurring transaction?')) {
      return
    }

    try {
      await apiClient.deleteRecurringTransaction(id)
      
      // Reload recurring transactions
      if (recurringAccount) {
        const response = await apiClient.getRecurringTransactions(recurringAccount.id)
        setRecurringTransactions(response.recurring_transactions)
      }
      
      setSuccess('Recurring transaction deleted successfully!')
      setTimeout(() => setSuccess(null), 2000)
    } catch (error: any) {
      console.error('Error deleting recurring transaction:', error)
      setError(error?.response?.data?.error || 'Failed to delete recurring transaction')
    }
  }

  const totalBalance = accounts.reduce((sum, account) => sum + (typeof account.balance === 'number' ? account.balance : parseFloat(String(account.balance)) || 0), 0)

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
          <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true)
            setError(null)
            setSuccess(null)
            setFormData({ name: '', type: 'checking', balance: '' })
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Total Balance Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
              <p className="text-3xl font-bold text-foreground">₹{Number(totalBalance || 0).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-muted rounded-lg mr-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{account.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(account)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRecurringClick(account)}
                    title="Recurring Transactions"
                  >
                    <Repeat className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleExportClick(account)}
                    title="Export Transactions"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">₹{Number((account as any).balance || 0).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(account.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-type">Account Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger id="account-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Initial Balance</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || !isNaN(parseFloat(value))) {
                    setFormData({ ...formData, balance: value === '' ? '' : value })
                  }
                }}
                placeholder="0.00"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
              >
                {editingAccount ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingAccount(null)
                  setFormData({ name: '', type: 'checking', balance: '' })
                  setError(null)
                  setSuccess(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Export Transactions Form Modal */}
      <Dialog open={showExportForm} onOpenChange={setShowExportForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Export Transactions - {exportingAccount?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="export-start-date">Start Date (Optional)</Label>
              <Input
                id="export-start-date"
                type="date"
                value={exportFormData.start_date}
                onChange={(e) => setExportFormData({ ...exportFormData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-end-date">End Date (Optional)</Label>
              <Input
                id="export-end-date"
                type="date"
                value={exportFormData.end_date}
                onChange={(e) => setExportFormData({ ...exportFormData, end_date: e.target.value })}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={handleExport}
                className="flex-1"
                disabled={exporting}
              >
                {exporting ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowExportForm(false)
                  setExportingAccount(null)
                  setExportFormData({ start_date: '', end_date: '' })
                  setError(null)
                }}
                className="flex-1"
                disabled={exporting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recurring Transactions Dialog */}
      <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Recurring Transactions - {recurringAccount?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            {loadingRecurring ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recurringTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recurring transactions for this account.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active recurring transactions */}
                {recurringTransactions.filter(rt => rt.is_active).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Active Recurring Transactions</h3>
                    <div className="space-y-4">
                      {recurringTransactions.filter(rt => rt.is_active).map((recurring) => (
                        <React.Fragment key={recurring.id}>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-foreground">
                                      {recurring.merchant || 'Recurring Transaction'}
                                    </h4>
                                    {recurring.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {recurring.category}
                                      </Badge>
                                    )}
                                  </div>
                                  {recurring.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {recurring.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span>
                                      Amount: <span className="font-medium text-foreground">
                                        ₹{Number(recurring.amount || 0).toFixed(2)} {recurring.is_expense ? '(Expense)' : '(Income)'}
                                      </span>
                                    </span>
                                    <span>
                                      Day of Month: <span className="font-medium text-foreground">{recurring.day_of_month}</span>
                                    </span>
                                    <span>
                                      Started: <span className="font-medium text-foreground">
                                        {(() => {
                                          const date = new Date(recurring.start_date);
                                          const day = String(date.getDate()).padStart(2, '0');
                                          const month = String(date.getMonth() + 1).padStart(2, '0');
                                          const year = date.getFullYear();
                                          return `${day}/${month}/${year}`;
                                        })()}
                                      </span>
                                    </span>
                                    {recurring.end_date && (
                                      <span>
                                        Ends: <span className="font-medium text-foreground">
                                          {(() => {
                                            const date = new Date(recurring.end_date);
                                            const day = String(date.getDate()).padStart(2, '0');
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const year = date.getFullYear();
                                            return `${day}/${month}/${year}`;
                                          })()}
                                        </span>
                                      </span>
                                    )}
                                    {recurring.last_processed && (
                                      <span>
                                        Last Processed: <span className="font-medium text-foreground">
                                          {(() => {
                                            const date = new Date(recurring.last_processed);
                                            const day = String(date.getDate()).padStart(2, '0');
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const year = date.getFullYear();
                                            return `${day}/${month}/${year}`;
                                          })()}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditRecurring(recurring)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteRecurring(recurring.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          {editingRecurring && editingRecurring.id === recurring.id && (
                            <Card className="mt-2">
                              <CardHeader>
                                <CardTitle>Edit Recurring Transaction</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <form onSubmit={handleSaveRecurring} className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="recurring-merchant">Merchant</Label>
                                      <Input
                                        id="recurring-merchant"
                                        value={recurringFormData.merchant}
                                        onChange={(e) => setRecurringFormData({ ...recurringFormData, merchant: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="recurring-category">Category</Label>
                                      <Select
                                        value={recurringFormData.category || undefined}
                                        onValueChange={(value) => setRecurringFormData({ ...recurringFormData, category: value })}
                                      >
                                        <SelectTrigger id="recurring-category">
                                          <SelectValue placeholder="Select Category" />
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
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="recurring-description">Description</Label>
                                    <Textarea
                                      id="recurring-description"
                                      value={recurringFormData.description}
                                      onChange={(e) => setRecurringFormData({ ...recurringFormData, description: e.target.value })}
                                      rows={2}
                                    />
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="recurring-amount">Amount</Label>
                                      <Input
                                        id="recurring-amount"
                                        type="number"
                                        step="0.01"
                                        value={recurringFormData.amount}
                                        onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="recurring-day">Day of Month (1-31)</Label>
                                      <Input
                                        id="recurring-day"
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={recurringFormData.day_of_month}
                                        onChange={(e) => setRecurringFormData({ ...recurringFormData, day_of_month: e.target.value })}
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="recurring-end-date">End Date (Optional)</Label>
                                      <Input
                                        id="recurring-end-date"
                                        type="date"
                                        value={recurringFormData.end_date}
                                        onChange={(e) => setRecurringFormData({ ...recurringFormData, end_date: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Status</Label>
                                    <RadioGroup
                                      value={recurringFormData.is_active ? 'active' : 'inactive'}
                                      onValueChange={(value) => setRecurringFormData({ ...recurringFormData, is_active: value === 'active' })}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="active" id="recurring-active" />
                                        <Label htmlFor="recurring-active" className="cursor-pointer">
                                          Active
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="inactive" id="recurring-inactive" />
                                        <Label htmlFor="recurring-inactive" className="cursor-pointer">
                                          Inactive
                                        </Label>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                  <div className="flex space-x-3 pt-4">
                                    <Button type="submit" className="flex-1">
                                      Save Changes
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingRecurring(null)
                                        setRecurringFormData({
                                          merchant: '',
                                          description: '',
                                          category: '',
                                          amount: '',
                                          day_of_month: '',
                                          end_date: '',
                                          is_active: true
                                        })
                                        setError(null)
                                      }}
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </form>
                              </CardContent>
                            </Card>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inactive recurring transactions */}
                {recurringTransactions.filter(rt => !rt.is_active).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Inactive Recurring Transactions</h3>
                    <div className="space-y-4">
                      {recurringTransactions.filter(rt => !rt.is_active).map((recurring) => (
                        <React.Fragment key={recurring.id}>
                          <Card className="opacity-75">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-foreground">
                                      {recurring.merchant || 'Recurring Transaction'}
                                    </h4>
                                    {recurring.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {recurring.category}
                                      </Badge>
                                    )}
                                    <Badge variant="secondary" className="text-xs">
                                      Inactive
                                    </Badge>
                                  </div>
                                  {recurring.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {recurring.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span>
                                      Amount: <span className="font-medium text-foreground">
                                        ₹{Number(recurring.amount || 0).toFixed(2)} {recurring.is_expense ? '(Expense)' : '(Income)'}
                                      </span>
                                    </span>
                                    <span>
                                      Day of Month: <span className="font-medium text-foreground">{recurring.day_of_month}</span>
                                    </span>
                                    <span>
                                      Started: <span className="font-medium text-foreground">
                                        {(() => {
                                          const date = new Date(recurring.start_date);
                                          const day = String(date.getDate()).padStart(2, '0');
                                          const month = String(date.getMonth() + 1).padStart(2, '0');
                                          const year = date.getFullYear();
                                          return `${day}/${month}/${year}`;
                                        })()}
                                      </span>
                                    </span>
                                    {recurring.end_date && (
                                      <span>
                                        Ends: <span className="font-medium text-foreground">
                                          {(() => {
                                            const date = new Date(recurring.end_date);
                                            const day = String(date.getDate()).padStart(2, '0');
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const year = date.getFullYear();
                                            return `${day}/${month}/${year}`;
                                          })()}
                                        </span>
                                      </span>
                                    )}
                                    {recurring.last_processed && (
                                      <span>
                                        Last Processed: <span className="font-medium text-foreground">
                                          {(() => {
                                            const date = new Date(recurring.last_processed);
                                            const day = String(date.getDate()).padStart(2, '0');
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const year = date.getFullYear();
                                            return `${day}/${month}/${year}`;
                                          })()}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditRecurring(recurring)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteRecurring(recurring.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          {editingRecurring && editingRecurring.id === recurring.id && (
                            <Card className="mt-2">
                              <CardHeader>
                                <CardTitle>Edit Recurring Transaction</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <form onSubmit={handleSaveRecurring} className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="recurring-merchant">Merchant</Label>
                                      <Input
                                        id="recurring-merchant"
                                        value={recurringFormData.merchant}
                                        onChange={(e) => setRecurringFormData({ ...recurringFormData, merchant: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="recurring-category">Category</Label>
                                      <Select
                                        value={recurringFormData.category || undefined}
                                        onValueChange={(value) => setRecurringFormData({ ...recurringFormData, category: value })}
                                      >
                                        <SelectTrigger id="recurring-category">
                                          <SelectValue placeholder="Select Category" />
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
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="recurring-description">Description</Label>
                                    <Textarea
                                      id="recurring-description"
                                      value={recurringFormData.description}
                                      onChange={(e) => setRecurringFormData({ ...recurringFormData, description: e.target.value })}
                                      rows={2}
                                    />
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="recurring-amount">Amount</Label>
                                      <Input
                                        id="recurring-amount"
                                        type="number"
                                        step="0.01"
                                        value={recurringFormData.amount}
                                        onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="recurring-day">Day of Month (1-31)</Label>
                                      <Input
                                        id="recurring-day"
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={recurringFormData.day_of_month}
                                        onChange={(e) => setRecurringFormData({ ...recurringFormData, day_of_month: e.target.value })}
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="recurring-end-date">End Date (Optional)</Label>
                                      <Input
                                        id="recurring-end-date"
                                        type="date"
                                        value={recurringFormData.end_date}
                                        onChange={(e) => setRecurringFormData({ ...recurringFormData, end_date: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Status</Label>
                                    <RadioGroup
                                      value={recurringFormData.is_active ? 'active' : 'inactive'}
                                      onValueChange={(value) => setRecurringFormData({ ...recurringFormData, is_active: value === 'active' })}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="active" id="recurring-active" />
                                        <Label htmlFor="recurring-active" className="cursor-pointer">
                                          Active
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="inactive" id="recurring-inactive" />
                                        <Label htmlFor="recurring-inactive" className="cursor-pointer">
                                          Inactive
                                        </Label>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                  <div className="flex space-x-3 pt-4">
                                    <Button type="submit" className="flex-1">
                                      Save Changes
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingRecurring(null)
                                        setRecurringFormData({
                                          merchant: '',
                                          description: '',
                                          category: '',
                                          amount: '',
                                          day_of_month: '',
                                          end_date: '',
                                          is_active: true
                                        })
                                        setError(null)
                                      }}
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </form>
                              </CardContent>
                            </Card>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
