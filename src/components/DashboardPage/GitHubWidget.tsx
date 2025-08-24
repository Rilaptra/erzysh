// src/components/DashboardPage/GitHubWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";
import { Button } from "../ui/button";

interface GitHubStats {
  public_repos: number;
  followers: number;
  following: number;
}

export const GitHubWidget = ({ username }: { username: string }) => {
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/users/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error("User not found or API limit reached.");
        return res.json();
      })
      .then((data) => setStats(data))
      .catch((err) => setError(err.message));
  }, [username]);

  return (
    <Card className="bg-gunmetal/30 border-gunmetal/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-off-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="text-teal-muted" />
            GitHub Stats
          </div>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm" className="text-xs">
              @{username}
            </Button>
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.public_repos}</p>
              <p className="text-off-white/70 text-xs">Repos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.followers}</p>
              <p className="text-off-white/70 text-xs">Followers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.following}</p>
              <p className="text-off-white/70 text-xs">Following</p>
            </div>
          </div>
        ) : (
          <div className="flex h-16 items-center justify-center">
            <p className="text-off-white/70 text-sm">{error || "Loading..."}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
