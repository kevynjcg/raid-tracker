"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Coins, Plus, User, Trash2, Edit, Save, X, GripVertical, History, ArrowLeft, Moon, Sun } from "lucide-react"

interface Raid {
  id: string
  name: string
  goldReward: number
}

interface CharacterRaid extends Raid {
  isCompleted: boolean
}

interface Character {
  id: string
  name: string
  raids: CharacterRaid[]
}

interface Account {
  id: string
  name: string
  characters: Character[]
  availableRaids: Raid[]
  isEditMode: boolean
  editedCharacters: { [key: string]: string }
  editedRaids: Raid[]
}

interface GoldHistoryEntry {
  id: string
  date: string
  accounts: {
    accountId: string
    accountName: string
    totalGold: number
  }[]
  grandTotal: number
}

const initialRaids: Raid[] = [
  { id: "1", name: "Molten Core", goldReward: 250 },
  { id: "2", name: "Blackwing Lair", goldReward: 350 },
  { id: "3", name: "Karazhan", goldReward: 300 },
  { id: "4", name: "Black Temple", goldReward: 600 },
  { id: "5", name: "Sunwell Plateau", goldReward: 750 },
]

export default function SimpleRaidTracker() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [goldHistory, setGoldHistory] = useState<GoldHistoryEntry[]>([])
  const [currentPage, setCurrentPage] = useState<"tracker" | "history">("tracker")
  const [isDarkMode, setIsDarkMode] = useState(false)

  const [newAccountName, setNewAccountName] = useState("")
  const [newCharacterName, setNewCharacterName] = useState("")
  const [newRaidName, setNewRaidName] = useState("")
  const [newRaidGold, setNewRaidGold] = useState("")
  const [draggedRaidIndex, setDraggedRaidIndex] = useState<{ accountId: string; index: number } | null>(null)
  const [draggedCharacterIndex, setDraggedCharacterIndex] = useState<{ accountId: string; index: number } | null>(null)
  const [dragOverRaidIndex, setDragOverRaidIndex] = useState<{ accountId: string; index: number } | null>(null)
  const [dragOverCharacterIndex, setDragOverCharacterIndex] = useState<{
    accountId: string
    index: number
  } | null>(null)

  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<"character" | "raid" | "account" | "history">("character")
  const [deleteItemId, setDeleteItemId] = useState<string>("")
  const [deleteItemName, setDeleteItemName] = useState<string>("")
  const [deleteAccountId, setDeleteAccountId] = useState<string>("")

  const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false)
  const [lastResetDate, setLastResetDate] = useState<string>("")
  const [resetTimer, setResetTimer] = useState<NodeJS.Timeout | null>(null)

  // Dark mode functions
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)

    if (newDarkMode) {
      document.documentElement.classList.add("dark")
      document.body.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
      document.body.classList.remove("dark")
    }

    // Save to localStorage
    localStorage.setItem("darkMode", newDarkMode.toString())
  }

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode")
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === "true"
      setIsDarkMode(isDark)
      // Apply to both html and document element
      if (isDark) {
        document.documentElement.classList.add("dark")
        document.body.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
        document.body.classList.remove("dark")
      }
    } else {
      // Check system preference
      const systemDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
      setIsDarkMode(systemDarkMode)
      if (systemDarkMode) {
        document.documentElement.classList.add("dark")
        document.body.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
        document.body.classList.remove("dark")
      }
    }
  }, [])

  const getTotalGoldAllAccounts = () => {
    return accounts.reduce((total, account) => {
      const accountTotal = account.characters.reduce((accTotal, character) => {
        return (
          accTotal +
          character.raids.filter((raid) => raid.isCompleted).reduce((charTotal, raid) => charTotal + raid.goldReward, 0)
        )
      }, 0)
      return total + accountTotal
    }, 0)
  }

  const getAccountTotalGold = (account: Account) => {
    return account.characters.reduce((total, character) => {
      return (
        total +
        character.raids.filter((raid) => raid.isCompleted).reduce((charTotal, raid) => charTotal + raid.goldReward, 0)
      )
    }, 0)
  }

  const getCharacterTotalGold = (character: Character) => {
    return character.raids.filter((raid) => raid.isCompleted).reduce((total, raid) => total + raid.goldReward, 0)
  }

  // Get overall total from all history entries
  const getOverallTotalGold = () => {
    return goldHistory.reduce((total, entry) => total + entry.grandTotal, 0)
  }

  // Get next Wednesday 6 PM
  const getNextWednesday6PM = () => {
    const now = new Date()
    const nextWednesday = new Date()

    // Get days until next Wednesday (3 = Wednesday, 0 = Sunday)
    const daysUntilWednesday = (3 - now.getDay() + 7) % 7
    if (daysUntilWednesday === 0) {
      // If today is Wednesday, check if it's past 6 PM
      if (now.getHours() >= 18) {
        // Past 6 PM, so next reset is next Wednesday
        nextWednesday.setDate(now.getDate() + 7)
      } else {
        // Before 6 PM, so reset is today
        nextWednesday.setDate(now.getDate())
      }
    } else {
      nextWednesday.setDate(now.getDate() + daysUntilWednesday)
    }

    nextWednesday.setHours(18, 0, 0, 0) // 6 PM
    return nextWednesday
  }

  // Check if reset is needed - improved logic
  const shouldReset = () => {
    if (!lastResetDate) {
      // If no reset date recorded, don't auto-reset (let user manually reset first time)
      return false
    }

    const lastReset = new Date(lastResetDate)
    const now = new Date()

    // Get the most recent Wednesday 6 PM that should have triggered a reset
    const currentWeekWednesday = new Date()
    const daysFromWednesday = (currentWeekWednesday.getDay() + 4) % 7 // Days since last Wednesday
    currentWeekWednesday.setDate(currentWeekWednesday.getDate() - daysFromWednesday)
    currentWeekWednesday.setHours(18, 0, 0, 0) // Set to 6 PM

    // If today is Wednesday and it's past 6 PM, use today's 6 PM
    if (now.getDay() === 3 && now.getHours() >= 18) {
      currentWeekWednesday.setDate(now.getDate())
    }

    // Reset needed if:
    // 1. Current time is past the reset time
    // 2. Last reset was before this reset time
    // 3. We haven't already reset this week
    return now >= currentWeekWednesday && lastReset < currentWeekWednesday
  }

  // Save current gold totals to history
  const saveGoldToHistory = () => {
    const now = new Date()

    const historyEntry: GoldHistoryEntry = {
      id: Date.now().toString(),
      date: now.toISOString(),
      accounts: accounts.map((account) => ({
        accountId: account.id,
        accountName: account.name,
        totalGold: getAccountTotalGold(account),
      })),
      grandTotal: getTotalGoldAllAccounts(),
    }

    // Only save if there's actually some gold earned
    if (historyEntry.grandTotal > 0) {
      setGoldHistory((prev) => [historyEntry, ...prev])
    }
  }

  // Save data to localStorage
  const saveToLocalStorage = () => {
    const data = {
      accounts,
      goldHistory,
      lastResetDate,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem("raidTrackerData", JSON.stringify(data))
  }

  // Load data from localStorage
  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem("raidTrackerData")
      if (saved) {
        const data = JSON.parse(saved)
        setAccounts(data.accounts || [])

        // Ensure all history entries have IDs (for backward compatibility)
        const historyWithIds = (data.goldHistory || []).map((entry: any, index: number) => ({
          ...entry,
          id: entry.id || `history-${Date.now()}-${index}`,
        }))

        setGoldHistory(historyWithIds)
        setLastResetDate(data.lastResetDate || "")
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  // Reset all checkboxes - enhanced with better logging
  const resetWeeklyProgress = () => {
    console.log("Starting weekly reset...")

    // Save current totals to history before resetting
    saveGoldToHistory()

    const resetAccounts = accounts.map((account) => ({
      ...account,
      characters: account.characters.map((character) => ({
        ...character,
        raids: character.raids.map((raid) => ({
          ...raid,
          isCompleted: false,
        })),
      })),
    }))

    setAccounts(resetAccounts)
    setLastResetDate(new Date().toISOString())

    console.log("Weekly reset completed!")
  }

  // Load data on component mount and handle weekly reset
  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  // Save data whenever accounts or history change
  useEffect(() => {
    if (accounts.length > 0 || goldHistory.length > 0) {
      saveToLocalStorage()
    }
  }, [accounts, goldHistory, lastResetDate])

  // Enhanced automatic reset system
  useEffect(() => {
    // Clear any existing timer
    if (resetTimer) {
      clearInterval(resetTimer)
    }

    // Set up a timer that checks every minute for reset time
    const timer = setInterval(() => {
      const now = new Date()
      const nextReset = getNextWednesday6PM()

      // Check if we've passed the reset time and haven't reset yet
      if (shouldReset()) {
        console.log("Automatic weekly reset triggered!")
        resetWeeklyProgress()
      }
    }, 60000) // Check every minute

    setResetTimer(timer)

    // Also check immediately when component mounts
    if (shouldReset()) {
      console.log("Reset needed on component mount")
      resetWeeklyProgress()
    }

    // Cleanup timer on unmount
    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [accounts, lastResetDate]) // Re-run when accounts or lastResetDate changes

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (resetTimer) {
        clearInterval(resetTimer)
      }
    }
  }, [resetTimer])

  // Add this useEffect after the other useEffects, around line 180
  useEffect(() => {
    // Reset delete dialog state when changing pages
    setDeleteDialogOpen(false)
    setDeleteType("character")
    setDeleteItemId("")
    setDeleteItemName("")
    setDeleteAccountId("")
  }, [currentPage])

  const addAccount = () => {
    if (!newAccountName.trim()) return
    setAddAccountDialogOpen(true)
  }

  const confirmAddAccount = () => {
    const newAccount: Account = {
      id: Date.now().toString(),
      name: newAccountName.trim(),
      availableRaids: [],
      characters: [],
      isEditMode: false,
      editedCharacters: {},
      editedRaids: [],
    }

    setAccounts([...accounts, newAccount])
    setNewAccountName("")
    setAddAccountDialogOpen(false)
  }

  const confirmDeleteAccount = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId)
    if (account) {
      setDeleteType("account")
      setDeleteItemId(accountId)
      setDeleteItemName(account.name)
      setDeleteAccountId(accountId)
      setDeleteDialogOpen(true)
    }
  }

  const confirmDeleteHistoryEntry = (historyId: string) => {
    const historyEntry = goldHistory.find((entry) => entry.id === historyId)
    if (historyEntry) {
      setDeleteType("history")
      setDeleteItemId(historyId)
      setDeleteItemName(
        new Date(historyEntry.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      )
      setDeleteDialogOpen(true)
    }
  }

  const deleteAccount = () => {
    if (deleteType === "account" && deleteItemId) {
      setAccounts(accounts.filter((acc) => acc.id !== deleteItemId))
    }
    setDeleteDialogOpen(false)
  }

  const deleteHistoryEntry = () => {
    console.log("Attempting to delete history entry:", deleteItemId, deleteType)
    if (deleteType === "history" && deleteItemId) {
      console.log("Before deletion, history length:", goldHistory.length)
      const newHistory = goldHistory.filter((entry) => entry.id !== deleteItemId)
      console.log("After deletion, history length:", newHistory.length)
      setGoldHistory(newHistory)
    }
    setDeleteDialogOpen(false)
  }

  const startEditing = (accountId: string) => {
    setAccounts(
      accounts.map((account) => {
        if (account.id === accountId) {
          const initialEdits = account.characters.reduce(
            (acc, char) => {
              acc[char.id] = char.name
              return acc
            },
            {} as { [key: string]: string },
          )

          return {
            ...account,
            isEditMode: true,
            editedCharacters: initialEdits,
            editedRaids: [...account.availableRaids],
          }
        }
        return account
      }),
    )
  }

  const saveEdits = (accountId: string) => {
    setAccounts(
      accounts.map((account) => {
        if (account.id === accountId) {
          // Update available raids
          const updatedCharacters = account.characters.map((char) => {
            const updatedRaids = account.editedRaids.map((editedRaid) => {
              const existingRaid = char.raids.find((r) => r.id === editedRaid.id)
              return {
                ...editedRaid,
                isCompleted: existingRaid ? existingRaid.isCompleted : false,
              }
            })

            return {
              ...char,
              name: account.editedCharacters[char.id] || char.name,
              raids: updatedRaids,
            }
          })

          return {
            ...account,
            availableRaids: account.editedRaids,
            characters: updatedCharacters,
            isEditMode: false,
            editedCharacters: {},
            editedRaids: [],
          }
        }
        return account
      }),
    )
  }

  const cancelEdits = (accountId: string) => {
    setAccounts(
      accounts.map((account) =>
        account.id === accountId
          ? {
              ...account,
              isEditMode: false,
              editedCharacters: {},
              editedRaids: [],
            }
          : account,
      ),
    )
  }

  const updateCharacterName = (accountId: string, characterId: string, newName: string) => {
    setAccounts(
      accounts.map((account) =>
        account.id === accountId
          ? {
              ...account,
              editedCharacters: {
                ...account.editedCharacters,
                [characterId]: newName,
              },
            }
          : account,
      ),
    )
  }

  const updateRaidName = (accountId: string, raidId: string, newName: string) => {
    setAccounts(
      accounts.map((account) =>
        account.id === accountId
          ? {
              ...account,
              editedRaids: account.editedRaids.map((raid) => (raid.id === raidId ? { ...raid, name: newName } : raid)),
            }
          : account,
      ),
    )
  }

  const updateRaidGold = (accountId: string, raidId: string, newGold: string) => {
    const goldValue = Number.parseInt(newGold) || 0
    setAccounts(
      accounts.map((account) =>
        account.id === accountId
          ? {
              ...account,
              editedRaids: account.editedRaids.map((raid) =>
                raid.id === raidId ? { ...raid, goldReward: goldValue } : raid,
              ),
            }
          : account,
      ),
    )
  }

  const addNewRaid = (accountId: string) => {
    if (!newRaidName.trim() || !newRaidGold.trim()) return

    const newRaid: Raid = {
      id: Date.now().toString(),
      name: newRaidName.trim(),
      goldReward: Number.parseInt(newRaidGold) || 0,
    }

    setAccounts(
      accounts.map((account) =>
        account.id === accountId
          ? {
              ...account,
              editedRaids: [...account.editedRaids, newRaid],
            }
          : account,
      ),
    )

    setNewRaidName("")
    setNewRaidGold("")
  }

  const confirmDeleteRaid = (accountId: string, raidId: string) => {
    const account = accounts.find((acc) => acc.id === accountId)
    if (account) {
      const raid = account.editedRaids.find((r) => r.id === raidId)
      if (raid) {
        setDeleteType("raid")
        setDeleteItemId(raidId)
        setDeleteItemName(raid.name)
        setDeleteAccountId(accountId)
        setDeleteDialogOpen(true)
      }
    }
  }

  const deleteRaid = () => {
    if (deleteType === "raid" && deleteItemId && deleteAccountId) {
      setAccounts(
        accounts.map((account) =>
          account.id === deleteAccountId
            ? {
                ...account,
                editedRaids: account.editedRaids.filter((raid) => raid.id !== deleteItemId),
              }
            : account,
        ),
      )
    }
    setDeleteDialogOpen(false)
  }

  const addCharacter = (accountId: string) => {
    if (!newCharacterName.trim()) return

    const account = accounts.find((acc) => acc.id === accountId)
    if (!account) return

    const newCharacter: Character = {
      id: Date.now().toString(),
      name: newCharacterName.trim(),
      raids: account.availableRaids.map((raid) => ({ ...raid, isCompleted: false })),
    }

    setAccounts(
      accounts.map((acc) => (acc.id === accountId ? { ...acc, characters: [...acc.characters, newCharacter] } : acc)),
    )

    setNewCharacterName("")
  }

  const confirmDeleteCharacter = (accountId: string, characterId: string) => {
    const account = accounts.find((acc) => acc.id === accountId)
    if (account) {
      const character = account.characters.find((c) => c.id === characterId)
      if (character) {
        setDeleteType("character")
        setDeleteItemId(characterId)
        setDeleteItemName(character.name)
        setDeleteAccountId(accountId)
        setDeleteDialogOpen(true)
      }
    }
  }

  const deleteCharacter = () => {
    if (deleteType === "character" && deleteItemId && deleteAccountId) {
      setAccounts(
        accounts.map((account) =>
          account.id === deleteAccountId
            ? {
                ...account,
                characters: account.characters.filter((char) => char.id !== deleteItemId),
              }
            : account,
        ),
      )
    }
    setDeleteDialogOpen(false)
  }

  const toggleRaidCompletion = (accountId: string, characterId: string, raidId: string) => {
    setAccounts(
      accounts.map((account) =>
        account.id === accountId
          ? {
              ...account,
              characters: account.characters.map((character) =>
                character.id === characterId
                  ? {
                      ...character,
                      raids: character.raids.map((raid) =>
                        raid.id === raidId ? { ...raid, isCompleted: !raid.isCompleted } : raid,
                      ),
                    }
                  : character,
              ),
            }
          : account,
      ),
    )
  }

  // Drag and drop handlers for raids
  const handleRaidDragStart = (e: React.DragEvent, accountId: string, index: number) => {
    setDraggedRaidIndex({ accountId, index })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleRaidDragOver = (e: React.DragEvent, accountId: string, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverRaidIndex({ accountId, index })
  }

  const handleRaidDragLeave = () => {
    setDragOverRaidIndex(null)
  }

  const handleRaidDrop = (e: React.DragEvent, accountId: string, dropIndex: number) => {
    e.preventDefault()
    if (!draggedRaidIndex || draggedRaidIndex.accountId !== accountId) return

    setAccounts(
      accounts.map((account) => {
        if (account.id === accountId) {
          const newRaids = [...account.editedRaids]
          const draggedRaid = newRaids[draggedRaidIndex.index]
          newRaids.splice(draggedRaidIndex.index, 1)
          newRaids.splice(dropIndex, 0, draggedRaid)

          // Also update all characters' raid arrays to maintain the same order and checkbox states
          const updatedCharacters = account.characters.map((character) => {
            const newCharacterRaids = [...character.raids]
            const draggedCharacterRaid = newCharacterRaids[draggedRaidIndex.index]
            newCharacterRaids.splice(draggedRaidIndex.index, 1)
            newCharacterRaids.splice(dropIndex, 0, draggedCharacterRaid)

            return {
              ...character,
              raids: newCharacterRaids,
            }
          })

          return {
            ...account,
            editedRaids: newRaids,
            characters: updatedCharacters,
          }
        }
        return account
      }),
    )

    setDraggedRaidIndex(null)
    setDragOverRaidIndex(null)
  }

  // Drag and drop handlers for characters
  const handleCharacterDragStart = (e: React.DragEvent, accountId: string, index: number) => {
    setDraggedCharacterIndex({ accountId, index })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleCharacterDragOver = (e: React.DragEvent, accountId: string, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverCharacterIndex({ accountId, index })
  }

  const handleCharacterDragLeave = () => {
    setDragOverCharacterIndex(null)
  }

  const handleCharacterDrop = (e: React.DragEvent, accountId: string, dropIndex: number) => {
    e.preventDefault()
    if (!draggedCharacterIndex || draggedCharacterIndex.accountId !== accountId) return

    setAccounts(
      accounts.map((account) => {
        if (account.id === accountId) {
          const newCharacters = [...account.characters]
          const draggedCharacter = newCharacters[draggedCharacterIndex.index]
          newCharacters.splice(draggedCharacterIndex.index, 1)
          newCharacters.splice(dropIndex, 0, draggedCharacter)

          return {
            ...account,
            characters: newCharacters,
          }
        }
        return account
      }),
    )

    setDraggedCharacterIndex(null)
    setDragOverCharacterIndex(null)
  }

  // History Page Component
  const HistoryPage = () => {
    const [selectedMonth, setSelectedMonth] = useState<string>("")

    // Get unique months from history for filter dropdown
    const getAvailableMonths = () => {
      const months = goldHistory.map((entry) => {
        const date = new Date(entry.date)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      })
      return [...new Set(months)].sort().reverse()
    }

    // Filter history by selected month
    const filteredHistory = selectedMonth
      ? goldHistory.filter((entry) => {
          const date = new Date(entry.date)
          const entryMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          return entryMonth === selectedMonth
        })
      : goldHistory

    const formatMonthLabel = (monthString: string) => {
      const [year, month] = monthString.split("-")
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long" })
    }

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setCurrentPage("tracker")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tracker
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Gold History</h1>
            <p className="text-muted-foreground mt-2">Weekly gold earnings history</p>
          </div>
        </div>

        {/* Overall Total */}
        {goldHistory.length > 0 && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-center gap-2">
                <Coins className="h-5 w-5 text-green-500" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {getOverallTotalGold().toLocaleString()} gold
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Total Gold Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {goldHistory.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No history yet. Complete some raids and wait for the weekly reset!
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">History Entries</CardTitle>
                  <CardDescription>Scroll through your weekly gold earnings</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="month-filter" className="text-sm font-medium">
                    Filter by month:
                  </label>
                  <select
                    id="month-filter"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-1 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">All months</option>
                    {getAvailableMonths().map((month) => (
                      <option key={month} value={month}>
                        {formatMonthLabel(month)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No entries found for the selected month.</p>
                  </div>
                ) : (
                  filteredHistory.map((entry) => (
                    <Card key={entry.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-semibold text-base">
                              {new Date(entry.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {entry.grandTotal.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">gold</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDeleteHistoryEntry(entry.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                          {entry.accounts.map((account) => (
                            <div
                              key={account.accountId}
                              className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                            >
                              <span className="font-medium truncate mr-2">{account.accountName}</span>
                              <span className="text-yellow-600 dark:text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {account.totalGold.toLocaleString()}g
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              {filteredHistory.length > 0 && (
                <div className="text-center mt-3 text-sm text-muted-foreground">
                  Showing {filteredHistory.length} of {goldHistory.length} entries
                  {selectedMonth && ` for ${formatMonthLabel(selectedMonth)}`}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Move the AlertDialog components outside of the page-specific content so they're available on both pages. Replace the current return structure at the end of the component with:
  return (
    <>
      {currentPage === "history" ? (
        <HistoryPage />
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Raid Gold Tracker</h1>
            <p className="text-muted-foreground mt-2">Track your weekly raids and gold earnings</p>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4">
            <Button onClick={() => setCurrentPage("history")} variant="outline" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              View Gold History
            </Button>
          </div>

          {/* Total Gold Summary */}
          {accounts.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Coins className="h-6 w-6 text-green-500" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {getTotalGoldAllAccounts().toLocaleString()} gold
                    </div>
                    <div className="text-sm text-muted-foreground">Total Gold Earned This Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Reset Info */}
          {accounts.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium">Next Reset</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {getNextWednesday6PM().toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {lastResetDate && (
                    <div className="text-center">
                      <div className="text-sm font-medium">Last Reset</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(lastResetDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add New Account */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-center">
                <Input
                  placeholder="Enter account name (e.g., Main Account, Alt Account)"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="max-w-md"
                />
                <Button onClick={addAccount}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Sections */}
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {account.name}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({account.characters.length} {account.characters.length === 1 ? "character" : "characters"})
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {account.isEditMode
                      ? "Edit raid names, gold amounts, character names, and drag to reorder"
                      : "Check off completed raids for each character"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                    {getAccountTotalGold(account).toLocaleString()} gold
                  </span>
                  <div className="flex gap-2">
                    {account.isEditMode ? (
                      <>
                        <Button
                          onClick={() => saveEdits(account.id)}
                          variant="default"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          onClick={() => cancelEdits(account.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => startEditing(account.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDeleteAccount(account.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Character */}
                <div className="flex gap-4 justify-center">
                  <Input
                    placeholder="Character name"
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    className="max-w-xs"
                    disabled={account.isEditMode}
                  />
                  <Button onClick={() => addCharacter(account.id)} disabled={account.isEditMode}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Character
                  </Button>
                </div>

                {/* Add New Raid (only in edit mode) */}
                {account.isEditMode && (
                  <div className="flex gap-4 justify-center p-4 bg-muted rounded-lg">
                    <Input
                      placeholder="Raid name"
                      value={newRaidName}
                      onChange={(e) => setNewRaidName(e.target.value)}
                      className="max-w-xs"
                    />
                    <Input
                      placeholder="Gold amount"
                      type="number"
                      value={newRaidGold}
                      onChange={(e) => setNewRaidGold(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button onClick={() => addNewRaid(account.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Raid
                    </Button>
                  </div>
                )}

                {/* Raid Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        {account.isEditMode && <th className="w-8"></th>}
                        <th className="text-left py-3 px-4 font-medium">Character</th>
                        {(account.isEditMode ? account.editedRaids : account.availableRaids).map((raid, index) => (
                          <th
                            key={raid.id}
                            className={`text-center py-3 px-4 font-medium min-w-[140px] relative ${
                              account.isEditMode &&
                              dragOverRaidIndex &&
                              dragOverRaidIndex.accountId === account.id &&
                              dragOverRaidIndex.index === index
                                ? "bg-blue-50 border-2 border-dashed border-blue-300 dark:bg-blue-950 dark:border-blue-700"
                                : ""
                            }`}
                            draggable={account.isEditMode}
                            onDragStart={(e) => handleRaidDragStart(e, account.id, index)}
                            onDragOver={(e) => handleRaidDragOver(e, account.id, index)}
                            onDragLeave={handleRaidDragLeave}
                            onDrop={(e) => handleRaidDrop(e, account.id, index)}
                          >
                            <div className="space-y-2">
                              {account.isEditMode && (
                                <div className="flex justify-center">
                                  <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                </div>
                              )}
                              {account.isEditMode ? (
                                <>
                                  <Input
                                    value={raid.name}
                                    onChange={(e) => updateRaidName(account.id, raid.id, e.target.value)}
                                    className="h-8 text-center text-sm"
                                  />
                                  <div className="flex items-center justify-center gap-1">
                                    <Input
                                      type="number"
                                      value={raid.goldReward}
                                      onChange={(e) => updateRaidGold(account.id, raid.id, e.target.value)}
                                      className="h-6 w-16 text-xs text-center"
                                    />
                                    <span className="text-xs text-yellow-600 dark:text-yellow-400">gold</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => confirmDeleteRaid(account.id, raid.id)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <div className="text-sm">{raid.name}</div>
                                  <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                                    {raid.goldReward} gold
                                  </div>
                                </>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="text-center py-3 px-4 font-medium">Total Gold</th>
                        {account.isEditMode && <th className="text-center py-3 px-4 font-medium">Delete</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {account.characters.map((character, characterIndex) => (
                        <tr
                          key={character.id}
                          className={`border-b hover:bg-muted/50 ${
                            account.isEditMode &&
                            dragOverCharacterIndex &&
                            dragOverCharacterIndex.accountId === account.id &&
                            dragOverCharacterIndex.index === characterIndex
                              ? "bg-blue-50 border-2 border-dashed border-blue-300 dark:bg-blue-950 dark:border-blue-700"
                              : ""
                          }`}
                          draggable={account.isEditMode}
                          onDragStart={(e) => handleCharacterDragStart(e, account.id, characterIndex)}
                          onDragOver={(e) => handleCharacterDragOver(e, account.id, characterIndex)}
                          onDragLeave={handleCharacterDragLeave}
                          onDrop={(e) => handleCharacterDrop(e, account.id, characterIndex)}
                        >
                          {account.isEditMode && (
                            <td className="py-4 px-2">
                              <div className="flex justify-center">
                                <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                              </div>
                            </td>
                          )}
                          <td className="py-4 px-4">
                            {account.isEditMode ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <Input
                                  value={account.editedCharacters[character.id] || character.name}
                                  onChange={(e) => updateCharacterName(account.id, character.id, e.target.value)}
                                  className="h-8 w-32"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">{character.name}</span>
                              </div>
                            )}
                          </td>
                          {character.raids.map((raid) => (
                            <td key={raid.id} className="text-center py-4 px-4">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={raid.isCompleted}
                                  onCheckedChange={() => toggleRaidCompletion(account.id, character.id, raid.id)}
                                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                  disabled={account.isEditMode}
                                />
                              </div>
                            </td>
                          ))}
                          <td className="text-center py-4 px-4">
                            <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                              {getCharacterTotalGold(character).toLocaleString()}
                            </span>
                          </td>
                          {account.isEditMode && (
                            <td className="text-center py-4 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDeleteCharacter(account.id, character.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {account.characters.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No characters added yet. Add your first character above!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {accounts.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No accounts added yet. Add your first account above!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Account Confirmation Dialog - Available on both pages */}
      <AlertDialog open={addAccountDialogOpen} onOpenChange={setAddAccountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              Add New Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to add the account <span className="font-semibold">"{newAccountName}"</span>?
              <p className="mt-2 text-muted-foreground">
                This will create a new account with the default raids and no characters.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddAccount} className="bg-blue-500 hover:bg-blue-600">
              Add Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog - Available on both pages */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteType} <span className="font-semibold">{deleteItemName}</span>?
              {deleteType === "raid" && (
                <p className="mt-2 text-red-500">
                  This will remove the raid from all characters and any associated gold earnings.
                </p>
              )}
              {deleteType === "character" && (
                <p className="mt-2 text-red-500">This will remove all raid progress for this character.</p>
              )}
              {deleteType === "account" && (
                <p className="mt-2 text-red-500">
                  This will permanently delete the account and all its characters and raid progress.
                </p>
              )}
              {deleteType === "history" && (
                <p className="mt-2 text-red-500">
                  This will permanently delete this history entry. This action cannot be undone.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                deleteType === "character"
                  ? deleteCharacter
                  : deleteType === "raid"
                    ? deleteRaid
                    : deleteType === "account"
                      ? deleteAccount
                      : deleteHistoryEntry
              }
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fixed Dark Mode Toggle - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleDarkMode}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-background border-2 hover:scale-110 transition-all duration-200"
          variant="outline"
        >
          {isDarkMode ? <Sun className="h-6 w-6 text-yellow-500" /> : <Moon className="h-6 w-6 text-blue-600" />}
        </Button>
      </div>
    </>
  )
}
