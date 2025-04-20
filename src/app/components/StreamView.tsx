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
import { json } from "stream/consumers";
const REFRESH_INTERVAL_MS = 10 * 1000;

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

export default function StreamView({creatorId,playVideo=false}:{creatorId:string,playVideo:boolean}) {
  const [linkInput, setLinkInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);
  const [playNextLoading,setPlayNextLoading]=useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const { data: session, status } = useSession();

  async function refreshStreams() {
    const response = await fetch(`/api/streams/?creatorId=${creatorId}`, {
      credentials: "include",
    });

    const streamsJson = await response.json();

    setQueue((prevState) =>
      [...streamsJson.streams].sort((a, b) => b.upvotes - a.upvotes)
    );
    setNowPlaying(streamsJson.activeStream.stream);
  }

  useEffect(() => {
    refreshStreams();
    const intervalId = setInterval(refreshStreams, REFRESH_INTERVAL_MS);
  }, []);

  // Function to add a song to the queue
  const addToQueue = async () => {
    setLoading(true);
    if (!linkInput.match(YT_REGEX)) {
      return;
    }
    const response = await fetch("/api/streams", {
      method: "POST",
      body: JSON.stringify({
        creatorId: creatorId,
        url: linkInput,
      }),
    });
    const addedSong = await response.json();

    setLoading(false);
    setLinkInput("");
    setQueue((prevQueue) =>
      [...prevQueue, addedSong].sort((a, b) => b.upvotes - a.upvotes)
    );
  };

  const handleUpvoteSong = async (songId) => {
    setQueue((prevQueue) =>
      prevQueue
        .map((song) => {
          if (song.id === songId) {
            return { ...song, upvotes: song.upvotes + 1, haveUpVoted: true };
          } else {
            return song;
          }
        })
        .sort((a, b) => b.upvotes - a.upvotes)
    );
    const response = await axios.post(
      "/api/streams/upvote",
      {
        streamId: songId,
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  };

  const handleDownvoteSong = async (songId) => {
    setQueue((prevQueue) =>
      prevQueue
        .map((song) => {
          if (song.id === songId) {
            return { ...song, upvotes: song.upvotes - 1, haveUpVoted: false };
          } else {
            return song;
          }
        })
        .sort((a, b) => b.upvotes - a.upvotes)
    );
    const response = await axios.post(
      "/api/streams/downvote",
      {
        streamId: songId,
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  };

  // // Function to handle voting
  // const handleVote = (id: string, voteType: "up" | "down") => {
  //   setQueue(
  //     queue
  //       .map((song) => {
  //         if (song.id === id) {
  //           return {
  //             ...song,
  //             votes: voteType === "up" ? song.votes + 1 : song.votes - 1,
  //           };
  //         }
  //         return song;
  //       })
  //       .sort((a, b) => b.votes - a.votes)
  //   );
  // };

  // Function to play next song
  const playNext = async() => {
    if (queue.length === 0) return;
   try{
        setPlayNextLoading(true);
        const response=await fetch("/api/streams/next",{
          method:"GET",
        });
        const jsonResponse=await response.json();
      
        setNowPlaying(jsonResponse.stream);
       
        setQueue((prev)=>prev.filter(song=>song.id !== jsonResponse.stream?.id));
  }
  catch(err){
    console.log(err);
  }
  setPlayNextLoading(false);
}


  return (
    <div className="container mx-auto px-4 py-8 bg-neutral-950 text-white">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 ">
              <div className="col-span-2">
                <header className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="h-8 w-8 text-purple-500" />
                    <h1 className="text-2xl font-bold">MusicQueue</h1>
                  </div>
                  <Button
                    onClick={() => {
                      const shareableLink = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ""}/creator/${creatorId}`;
                      
                      if (navigator.share) {
                        navigator
                          .share({
                            title: "MusicQueue - Share your music",
                            text: "Check out this music queue I created!",
                            url: shareableLink,
                          })
                          .catch((error) => console.log("Error sharing:", error));
                      } else {
                        navigator.clipboard.writeText(shareableLink);
                        alert("Link copied to clipboard!");
                      }
                    }}
                    variant="outline"
                    className="flex items-center gap-2 border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-share-2"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    Share
                  </Button>
                </header>

                <section className="mb-8">
                  <div className="mb-4 flex flex-col gap-4 md:flex-row">
                    <Input
                      type="text"
                      placeholder="Paste YouTube or Spotify link"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      className="flex-1 bg-neutral-900 border-neutral-800"
                    />
                    <Button
                      disabled={loading}
                      onClick={addToQueue}
                      className="bg-purple-700 hover:bg-purple-800"
                    >
                      {loading ? "Uploading your song to queue" : "Add to Queue"}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                    >
                      <Youtube className="h-4 w-4" /> YouTube
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.5 16.5C13.55 18.11 9.59 17.05 7.95 14.12C6.31 11.19 7.36 7.21 10.32 5.53C13.28 3.85 17.25 4.92 18.91 7.86C20.57 10.8 19.45 14.89 16.5 16.5Z"
                          fill="currentColor"
                        />
                        <path
                          d="M9.5 15C10.3284 15 11 14.3284 11 13.5C11 12.6716 10.3284 12 9.5 12C8.67157 12 8 12.6716 8 13.5C8 14.3284 8.67157 15 9.5 15Z"
                          fill="currentColor"
                        />
                        <path
                          d="M14.5 10C15.3284 10 16 9.32843 16 8.5C16 7.67157 15.3284 7 14.5 7C13.6716 7 13 7.67157 13 8.5C13 9.32843 13.6716 10 14.5 10Z"
                          fill="currentColor"
                        />
                      </svg>
                      Spotify
                    </Button>
                  </div>
                </section>

                {linkInput.match(YT_REGEX) && !loading && (
                  <Card className="bg-gradient-to-r from-purple-900/70 to-neutral-900 border-neutral-800 text-center">
                    <CardContent className="p-6">
                      <LiteYouTubeEmbed id={linkInput.split("?v=")[1]} title="" />
                    </CardContent>
                  </Card>
                )}

                  
                  <section className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold">Now Playing</h2>
                    <Card className="bg-gradient-to-r from-purple-900/70 to-neutral-900 border-neutral-800">
                      <CardContent className="p-6">
                            { nowPlaying ? 
                              <iframe width="420" height="315" src={`http://www.youtube.com/embed/${nowPlaying.extractedId}?autoplay=1&cc_load_policy=1`} frameborder="0"> </iframe>
                            :
                            <p>No video playing</p>
                            }
                              <Button
                            disabled={playNextLoading}
                            onClick={playNext}
                            className="bg-purple-700 hover:bg-purple-800"
                          >
                            {playNextLoading? "Loading" : "Play Next"}
                          </Button>
                      </CardContent>
                    </Card>
                  </section>
                
              </div>

            <div className="col-span-3">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Next Playing</h2>
                  <span className="text-sm text-neutral-400">
                    {queue.length} songs in queue
                  </span>
                </div>

                <div className="space-y-3">
                  {queue.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-3 rounded-lg bg-neutral-900 p-3 transition-all hover:bg-neutral-800 border border-neutral-800"
                    >
                      <Avatar className="h-12 w-12 rounded-md">
                        <AvatarImage src={song.smallThumbnailImage} alt={song.title} />
                        <AvatarFallback className="rounded-md bg-purple-900">
                          {song.title.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate font-medium text-white">{song.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{song.upvotes}</span>
                        <div className="flex flex-col gap-1">
                          {!song.haveUpVoted ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-green-500"
                              onClick={() => handleUpvoteSong(song.id)}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                              onClick={() => handleDownvoteSong(song.id, "down")}
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="ml-2 flex h-6 items-center">
                          {song.type === "Youtube" ? (
                            <Youtube className="h-5 w-5 text-red-500" />
                          ) : (
                            <svg
                              className="h-5 w-5 text-green-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.5 16.5C13.55 18.11 9.59 17.05 7.95 14.12C6.31 11.19 7.36 7.21 10.32 5.53C13.28 3.85 17.25 4.92 18.91 7.86C20.57 10.8 19.45 14.89 16.5 16.5Z"
                                fill="currentColor"
                              />
                              <path
                                d="M9.5 15C10.3284 15 11 14.3284 11 13.5C11 12.6716 10.3284 12 9.5 12C8.67157 12 8 12.6716 8 13.5C8 14.3284 8.67157 15 9.5 15Z"
                                fill="currentColor"
                              />
                              <path
                                d="M14.5 10C15.3284 10 16 9.32843 16 8.5C16 7.67157 15.3284 7 14.5 7C13.6716 7 13 7.67157 13 8.5C13 9.32843 13.6716 10 14.5 10Z"
                                fill="currentColor"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
  </div>
  </div>
)