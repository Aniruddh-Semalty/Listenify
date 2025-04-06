"use client";
import { signIn, useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
export default function Appbar() {
  const session = useSession();
  console.log(session);
  return (
    <div className="flex justify-between text-white font-bold text-xl p-8 items-center">
      <div className="flex flex-col justify-center">
      Listenify
      </div>
      <div className="flex flex-col justify-center">
        {!session.data?.user && (
          <Button
            className="bg-purple-600 text-white hover:bg-purple-700"
            onClick={() => signIn()}
          >
            Sign in
          </Button>
        )}
        {session.data?.user && (
          <Button
            className="bg-purple-600 text-white hover:bg-purple-700"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        )}
      </div>
    </div>
  );
}
