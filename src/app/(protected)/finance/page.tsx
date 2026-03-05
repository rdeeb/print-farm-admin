'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSettings } from '@/components/providers/SettingsProvider'

type LedgerEntry = {
  id: string
  date: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'SOFT_EXPENSE' | 'ADJUSTMENT'
  source: string
  isNonCash: boolean
  note?: string | null
}

type FinanceSummary = {
  income: number
  expenses: number
  softExpenses: number
  netCash: number
  projectedMargin: number
}

export default function FinancePage() {
  const { settings } = useSettings()
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'SOFT_EXPENSE' | 'ADJUSTMENT'>(
    'ADJUSTMENT'
  )
  const [note, setNote] = useState('')

  const fetchFinance = async () => {
    const [entriesRes, summaryRes] = await Promise.all([
      fetch('/api/finance/ledger?limit=200'),
      fetch('/api/finance/summary?days=30'),
    ])
    if (entriesRes.ok) setEntries(await entriesRes.json())
    if (summaryRes.ok) setSummary(await summaryRes.json())
  }

  useEffect(() => {
    fetchFinance()
  }, [])

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return
    const res = await fetch('/api/finance/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(amount),
        type,
        source: 'MANUAL',
        isNonCash: type === 'SOFT_EXPENSE',
        note: note || undefined,
      }),
    })
    if (res.ok) {
      setAmount('')
      setNote('')
      setType('ADJUSTMENT')
      await fetchFinance()
    }
  }

  const currency = settings.currency || 'USD'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track cash flow, soft expenses, and manual adjustments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Income (30d)</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {summary?.income.toLocaleString(undefined, { style: 'currency', currency }) || '-'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Expenses (30d)</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {summary?.expenses.toLocaleString(undefined, { style: 'currency', currency }) || '-'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Soft Expenses (30d)</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {summary?.softExpenses.toLocaleString(undefined, {
              style: 'currency',
              currency,
            }) || '-'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Cash (30d)</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {summary?.netCash.toLocaleString(undefined, { style: 'currency', currency }) || '-'}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Ledger Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-4" onSubmit={handleAddEntry}>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: typeof type) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="SOFT_EXPENSE">Soft Expense</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Note</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="md:col-span-4">
              <Button type="submit">Add Entry</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="text-sm font-medium">
                  {entry.type} - {entry.source}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(entry.date).toLocaleString()} {entry.note ? `- ${entry.note}` : ''}
                </div>
              </div>
              <div className="text-sm font-semibold">
                {entry.amount.toLocaleString(undefined, { style: 'currency', currency })}
                {entry.isNonCash ? ' (non-cash)' : ''}
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="text-sm text-gray-500">No ledger entries found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
