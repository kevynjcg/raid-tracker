"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Coins, Trophy } from "lucide-react"

interface Raid {
  id: string
  name: string
  difficulty: string
  goldReward: number
  isCompleted: boolean
}

const initialRaids: Raid[] = [
  { id: "1", name: "Molten Core", difficulty: "Normal", goldReward: 250, isCompleted: false },
  { id: "2", name: "Blackwing Lair", difficulty: "Normal", goldReward: 350, isCompleted: false },
  { id: "3", name: "Ahn'Qiraj Temple", difficulty: "Normal", goldReward: 400, isCompleted: false },
  { id: "4", name: "Naxxramas", difficulty: "Normal", goldReward: 500, isCompleted: false },
  { id: "5", name: "Karazhan", difficulty: "Normal", goldReward: 300, isCompleted: false },
  { id: "6", name: "Gruul's Lair", difficulty: "Normal", goldReward: 200, isCompleted: false },
  { id: "7", name: "Magtheridon's Lair", difficulty: "Normal", goldReward: 225, isCompleted: false },
  { id: "8", name: "Serpentshrine Cavern", difficulty: "Normal", goldReward: 375, isCompleted: false },
  { id: "9", name: "Tempest Keep", difficulty: "Normal", goldReward: 400, isCompleted: false },
  { id: "10", name: "Black Temple", difficulty: "Normal", goldReward: 600, isCompleted: false },
  { id: "11", name: "Sunwell Plateau", difficulty: "Normal", goldReward: 750, isCompleted: false },
  { id: "12", name: "Vault of Archavon", difficulty: "Normal", goldReward: 150, isCompleted: false },
  { id: "13", name: "Naxxramas", difficulty: "Heroic", goldReward: 800, isCompleted: false },
  { id: "14", name: "Ulduar", difficulty: "Normal", goldReward: 450, isCompleted: false },
  { id: "15", name: "Trial of the Crusader", difficulty: "Normal", goldReward: 350, isCompleted: false },
  { id: "16", name: "Icecrown Citadel", difficulty: "Normal", goldReward: 650, isCompleted: false },
  { id: "17", name: "Ruby Sanctum", difficulty: "Normal", goldReward: 300, isCompleted: false },
]

export default function RaidChecklist() {
  const [raids, setRaids] = useState<Raid[]>(initialRaids)

  const toggleRaidCompletion = (id: string) => {
    setRaids(raids.map((raid) => (raid.id === id ? { ...raid, isCompleted: !raid.isCompleted } : raid)))
  }

  const getTotalGold = () => {
    return raids.filter((raid) => raid.isCompleted).reduce((total, raid) => total + raid.goldReward, 0)
  }

  const getCompletedCount = () => {
    return raids.filter((raid) => raid.isCompleted).length
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "heroic":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
      case "mythic":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Weekly Raid Checklist</h1>
        <p className="text-muted-foreground mt-2">Check off completed raids to track your gold earnings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="h-5 w-5 text-yellow-500" />
              Total Gold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getTotalGold().toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Gold earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getCompletedCount()}/{raids.length}
            </div>
            <p className="text-sm text-muted-foreground">Raids cleared</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((getCompletedCount() / raids.length) * 100)}%</div>
            <p className="text-sm text-muted-foreground">Weekly completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Raid Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Available Raids</CardTitle>
          <CardDescription>Check off raids as you complete them to track your gold</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {raids.map((raid) => (
              <div
                key={raid.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all hover:bg-muted/50 ${
                  raid.isCompleted
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : "bg-background"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={raid.isCompleted}
                    onCheckedChange={() => toggleRaidCompletion(raid.id)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${raid.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                      {raid.name}
                    </span>
                    <Badge className={getDifficultyColor(raid.difficulty)}>{raid.difficulty}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${raid.isCompleted ? "text-green-600" : "text-yellow-600"}`}>
                    {raid.goldReward.toLocaleString()} gold
                  </span>
                  {raid.isCompleted && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">✓ Done</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
