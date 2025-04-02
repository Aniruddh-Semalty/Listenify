"use client";
import { signIn, useSession ,signOut} from "next-auth/react"
export default  function Appbar(){
    const session=useSession();
    console.log(session);
    return <div className="flex justify-between">
        <div>Listenify</div><div>
           {!session.data?.user && <button  className="m-2 p-2 bg-blue-400" onClick={()=>signIn()}>Sign in</button>}
           {session.data?.user && <button  className="m-2 p-2 bg-blue-400" onClick={()=>signOut()}>Sign Out</button>}
        </div>
    </div>
}