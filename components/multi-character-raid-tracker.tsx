"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Coins, Trophy, Plus, User, Trash2 } from "lucide-react"

interface Raid {
  id: string
  name: string
  difficulty: string
  goldReward: number
}

interface CharacterRaid extends Raid {
  isCompleted: boolean
}

interface Character {
  id: string
  name: string
  class: string
  raids: CharacterRaid[]
}

const availableRaids: Raid[] = [
  { id: "1", name: "Molten Core", difficulty: "Normal", goldReward: 250 },
  { id: "2", name: "Blackwing Lair", difficulty: "Normal", goldReward: 350 },
  { id: "3", name: "Ahn'Qiraj Temple", difficulty: "Normal", goldReward: 400 },
  { id: "4", name: "Naxxramas", difficulty: "Normal", goldReward: 500 },
  { id: "5", name: "Karazhan", difficulty: "Normal", goldReward: 300 },
  { id: "6", name: "Gruul's Lair", difficulty: "Normal", goldReward: 200 },
  { id: "7", name: "Magtheridon's Lair", difficulty: "Normal", goldReward: 225 },
  { id: "8", name: "Serpentshrine Cavern", difficulty: "Normal", goldReward: 375 },
  { id: "9", name: "Tempest Keep", difficulty: "Normal", goldReward: 400 },
  { id: "10", name: "Black Temple", difficulty: "Normal", goldReward: 600 },
  { id: "11", name: "Sunwell Plateau", difficulty: "Normal", goldReward: 750 },
  { id: "12", name: "Ulduar", difficulty: "Normal", goldReward: 450 },
]

export default function MultiCharacterRaidTracker() {
  const [characters, setCharacters] = useState<Character[]>([
    {
      id: "1",
      name: "Thorgar",
      class: "Warrior",
      raids: availableRaids.map((raid) => ({ ...raid, isCompleted: false })),
    },
    {
      id: "2",
      name: "Elaria",
      class: "Mage",
      raids: availableRaids.map((raid) => ({ ...raid, isCompleted: false })),
    },
  ])

  const [newCharacterName, setNewCharacterName] = useState("")
  const [newCharacterClass, setNewCharacterClass] = useState("")

  const addCharacter = () => {
    if (!newCharacterName.trim() || !newCharacterClass.trim()) return

    const newCharacter: Character = {
      id: Date.now().toString(),
      name: newCharacterName.trim(),
      class: newCharacterClass.trim(),
      raids: availableRaids.map((raid) => ({ ...raid, isCompleted: false })),
    }

    setCharacters([...characters, newCharacter])
    setNewCharacterName("")
    setNewCharacterClass("")
  }

  const deleteCharacter = (characterId: string) => {
    setCharacters(characters.filter((char) => char.id !== characterId))
  }

  const toggleRaidCompletion = (characterId: string, raidId: string) => {
    setCharacters(
      characters.map((character) =>
        character.id === characterId
          ? {
              ...character,
              raids: character.raids.map((raid) =>
                raid.id === raidId ? { ...raid, isCompleted: !raid.isCompleted } : raid,
              ),
            }
          : character,
      ),
    )
  }

  const getCharacterTotalGold = (character: Character) => {
    return character.raids.filter((raid) => raid.isCompleted).reduce((total, raid) => total + raid.goldReward, 0)
  }

  const getCharacterCompletedCount = (character: Character) => {
    return character.raids.filter((raid) => raid.isCompleted).length
  }

  const getTotalGoldAllCharacters = () => {
    return characters.reduce((total, character) => total + getCharacterTotalGold(character), 0)
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Multi-Character Raid Tracker</h1>
        <p className="text-muted-foreground mt-2">
          Track raid completions and gold earnings across all your characters
        </p>
      </div>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Total Gold Across All Characters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-600">{getTotalGoldAllCharacters().toLocaleString()} gold</div>
          <p className="text-sm text-muted-foreground mt-1">From {characters.length} characters</p>
        </CardContent>
      </Card>

      {/* Add New Character */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Character
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Character name"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
            />
            <Input
              placeholder="Class"
              value={newCharacterClass}
              onChange={(e) => setNewCharacterClass(e.target.value)}
            />
            <Button onClick={addCharacter}>
              <Plus className="h-4 w-4 mr-2" />
              Add Character
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Character Raid Lists */}
      {characters.map((character) => (
        <Card key={character.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" />
                <div>
                  <CardTitle className="text-xl">{character.name}</CardTitle>
                  <CardDescription>{character.class}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-yellow-600">
                      {getCharacterTotalGold(character).toLocaleString()} gold
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    <span>
                      {getCharacterCompletedCount(character)}/{character.raids.length} raids
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCharacter(character.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {character.raids.map((raid) => (
                <div
                  key={raid.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-all hover:bg-muted/50 ${
                    raid.isCompleted
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : "bg-background"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={raid.isCompleted}
                      onCheckedChange={() => toggleRaidCompletion(character.id, raid.id)}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <div className="space-y-1">
                      <div
                        className={`font-medium text-sm ${raid.isCompleted ? "line-through text-muted-foreground" : ""}`}
                      >
                        {raid.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getDifficultyColor(raid.difficulty)}`}>{raid.difficulty}</Badge>
                        <span
                          className={`text-xs font-semibold ${raid.isCompleted ? "text-green-600" : "text-yellow-600"}`}
                        >
                          {raid.goldReward} gold
                        </span>
                      </div>
                    </div>
                  </div>
                  {raid.isCompleted && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {characters.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No characters added yet. Add your first character above!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
