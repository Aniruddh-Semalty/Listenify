"use client";

import { useState, useEffect } from "react";
import { Music, ThumbsDown, ThumbsUp, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { clearInterval } from "timers";
import axios from "axios";
import { useSession } from "next-auth/react";
import { YT_REGEX } from "../lib/utils";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { randomUUID } from "crypto";
import StreamView from "../components/StreamView";
const REFRESH_INTERVAL_MS = 10 * 1000000;
const creatorId="7eb5c934-798e-4cac-b223-5897b7ad9e43";
// Define the Song type
type Song = {
  active: boolean;
  extractedId: string;
  id: string;
  largeThumbnailImage: string;
  smallThumbnailImage: string;
  title: string;
  type: "Youtube" | "Spotify";
  upvotes: number;
  url: string;
  userId: string;
  haveUpVoted: boolean;
};

export default function MusicApp() {
return <StreamView creatorId={creatorId} playVideo={true}></StreamView>
}