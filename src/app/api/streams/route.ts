import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
import { prismaClient } from "@/app/lib/db";


const YT_REGEX =/^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z
    .string()
    .and(z.string().includes("youtube").or(z.string().includes("spotify"))),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json());
    const isYt = data.url.match(YT_REGEX);
    if (!isYt) {
      return NextResponse.json(
        {
          message: "Does not provided the correct url",
        },
        {
          status: 411,
        }
      );
    }
    const extractedId = data.url.split("?v=")[1];
    const videoData=await youtubesearchapi.GetVideoDetails(extractedId);
    const thumbnails=videoData.thumbnail.thumbnails;
    thumbnails.sort((a:{width:number},b:{width:number})=>a.width<b.width?-1:1);
    
    
   
    const stream=await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        title:videoData.title ?? "Cant find video",
        type: "Youtube",
        largeThumbnailImage:thumbnails[thumbnails.length-1].url??"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT41L4BPm7EChD1_zZczgBrRsTgxw9sOkhoECdUEm4qcH8twMEUTooa01g&s",
        smallThumbnailImage:(thumbnails.length>1?thumbnails[thumbnails.length-2].url : thumbnails[thumbnails.length-1].url)??"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT41L4BPm7EChD1_zZczgBrRsTgxw9sOkhoECdUEm4qcH8twMEUTooa01g&s"
      },
    });
    return NextResponse.json({
      message:"Added Stream",
      id:stream.id,
    },{
      status:201,
    })
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      {
        message: "Error while adding a stream",
      },
      {
        status: 411,
      }
    );
  }
  
}


export async function GET(req:NextRequest)
{
  const creatorId=req.nextUrl.searchParams.get("creatorId");
  const streams=await prismaClient.stream.findMany({
    where:{
      userId:creatorId??""
    }
  })
  return NextResponse.json({
    streams
  })

}