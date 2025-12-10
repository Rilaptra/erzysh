// src/components/DashboardPage/GitHubWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface GitHubStats {
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  login: string;
  html_url: string;
}

export const GitHubWidget = ({ username }: { username: string }) => {
  const [stats, setStats] = useState<GitHubStats | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/users/${username}`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, [username]);

  if (!stats)
    return (
      <div className="bg-muted/50 h-full w-full animate-pulse rounded-2xl" />
    );

  return (
    <div className="border-border/50 bg-card/50 relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="border-background relative h-12 w-12 overflow-hidden rounded-full border-2">
            <Image
              src={stats.avatar_url}
              alt={username}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="leading-none font-bold">@{stats.login}</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Open Source Contributor
            </p>
          </div>
        </div>
        <Github className="text-foreground/20 h-6 w-6" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-lg font-bold">{stats.public_repos}</p>
          <p className="text-muted-foreground text-[10px] uppercase">Repos</p>
        </div>
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-lg font-bold">{stats.followers}</p>
          <p className="text-muted-foreground text-[10px] uppercase">
            Followers
          </p>
        </div>
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-lg font-bold">{stats.following}</p>
          <p className="text-muted-foreground text-[10px] uppercase">
            Following
          </p>
        </div>
      </div>

      <a
        href={stats.html_url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 block"
      >
        <Button variant="secondary" className="h-8 w-full gap-2 text-xs">
          Visit Profile <ExternalLink className="h-3 w-3" />
        </Button>
      </a>
    </div>
  );
};
