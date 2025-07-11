"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Coins } from "lucide-react"

interface RaidEntry {
  id: string
  characterName: string
  raidName: string
  goldAmount: number
  isCompleted: boolean
  dateAdded: Date
}

export default function RaidTracker() {
  const [raids, setRaids] = useState<RaidEntry[]>([])
  const [characterName, setCharacterName] = useState("")
  const [raidName, setRaidName] = useState("")
  const [goldAmount, setGoldAmount] = useState("")

  const addRaid = () => {
    if (!characterName.trim() || !raidName.trim() || !goldAmount.trim()) {
      return
    }

    const newRaid: RaidEntry = {
      id: Date.now().toString(),
      characterName: characterName.trim(),
      raidName: raidName.trim(),
      goldAmount: Number.parseInt(goldAmount),
      isCompleted: false,
      dateAdded: new Date(),
    }

    setRaids([...raids, newRaid])
    setCharacterName("")
    setRaidName("")
    setGoldAmount("")
  }

  const toggleRaidCompletion = (id: string) => {
    setRaids(raids.map((raid) => (raid.id === id ? { ...raid, isCompleted: !raid.isCompleted } : raid)))
  }

  const deleteRaid = (id: string) => {
    setRaids(raids.filter((raid) => raid.id !== id))
  }

  const getTotalGold = () => {
    return raids.filter((raid) => raid.isCompleted).reduce((total, raid) => total + raid.goldAmount, 0)
  }

  const getCharacterTotals = () => {
    const characterTotals: { [key: string]: number } = {}
    raids
      .filter((raid) => raid.isCompleted)
      .forEach((raid) => {
        characterTotals[raid.characterName] = (characterTotals[raid.characterName] || 0) + raid.goldAmount
      })
    return characterTotals
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Raid Gold Tracker</h1>
        <p className="text-muted-foreground mt-2">Track your character raids and gold earnings</p>
      </div>

      {/* Add New Raid Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Raid
          </CardTitle>
          <CardDescription>Enter character name, raid, and gold amount</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="character">Character Name</Label>
              <Input
                id="character"
                placeholder="Enter character name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raid">Raid Name</Label>
              <Input
                id="raid"
                placeholder="Enter raid name"
                value={raidName}
                onChange={(e) => setRaidName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gold">Gold Amount</Label>
              <Input
                id="gold"
                type="number"
                placeholder="Enter gold amount"
                value={goldAmount}
                onChange={(e) => setGoldAmount(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addRaid} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Raid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gold Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              Total Gold Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{getTotalGold().toLocaleString()} gold</div>
            <p className="text-sm text-muted-foreground mt-1">
              From {raids.filter((r) => r.isCompleted).length} completed raids
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Character Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(getCharacterTotals()).map(([character, total]) => (
                <div key={character} className="flex justify-between items-center">
                  <span className="font-medium">{character}</span>
                  <Badge variant="secondary">{total.toLocaleString()} gold</Badge>
                </div>
              ))}
              {Object.keys(getCharacterTotals()).length === 0 && (
                <p className="text-sm text-muted-foreground">No completed raids yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raids List */}
      <Card>
        <CardHeader>
          <CardTitle>Raid Entries</CardTitle>
          <CardDescription>Check off completed raids to add them to your gold total</CardDescription>
        </CardHeader>
        <CardContent>
          {raids.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No raids added yet. Add your first raid above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {raids.map((raid) => (
                <div
                  key={raid.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    raid.isCompleted
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : "bg-background"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox checked={raid.isCompleted} onCheckedChange={() => toggleRaidCompletion(raid.id)} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{raid.characterName}</span>
                        <Badge variant="outline">{raid.raidName}</Badge>
                        {raid.isCompleted && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {raid.goldAmount.toLocaleString()} gold • Added {raid.dateAdded.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRaid(raid.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
