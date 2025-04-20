import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
import { prismaClient } from "@/app/lib/db";
import { YT_REGEX } from "@/app/lib/utils";
import { getServerSession } from "next-auth";

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
    const videoData = await youtubesearchapi.GetVideoDetails(extractedId);
    const thumbnails = videoData.thumbnail.thumbnails;
    thumbnails.sort((a: { width: number }, b: { width: number }) =>
      a.width < b.width ? -1 : 1
    );

    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        title: videoData.title ?? "Cant find video",
        type: "Youtube",
        largeThumbnailImage:
          thumbnails[thumbnails.length - 1].url ??
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT41L4BPm7EChD1_zZczgBrRsTgxw9sOkhoECdUEm4qcH8twMEUTooa01g&s",
        smallThumbnailImage:
          (thumbnails.length > 1
            ? thumbnails[thumbnails.length - 2].url
            : thumbnails[thumbnails.length - 1].url) ??
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT41L4BPm7EChD1_zZczgBrRsTgxw9sOkhoECdUEm4qcH8twMEUTooa01g&s",
      },
    });
    return NextResponse.json(
      {
        ...stream,
        haveUpVoted: false,
        upvotes: 0,
      },
      {
        status: 201,
      }
    );
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

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  const user = await prismaClient.user.findFirst({
    where: {
      email: session?.user?.email ?? "",
    },
  });
  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthenticated",
      },
      {
        status: 403,
      }
    );
  }
  const creatorId = req.nextUrl.searchParams.get("creatorId");
  if (!creatorId)
    return NextResponse.json(
      {
        message: "Error",
      },
      {
        status: 411,
      }
    );
  const [streams, activeStream] = await Promise.all([
    prismaClient.stream.findMany({
      where: {
        userId: creatorId ?? "",
        played:false,
      },
      include: {
        _count: {
          select: {
            upvotes: true,
          },
        },
        upvotes: {
          where: {
            userId: user.id,
          },
        },
      },
    }),
    await prismaClient.currentStream.findFirst({
      where: {
        userId: creatorId,
      },
      include: {
        stream: true,
      },
    }),
  ]);
 
  
  return NextResponse.json({
    streams: streams.map(({ _count, ...rest }) => ({
      ...rest,
      upvotes: _count.upvotes,
      haveUpVoted: rest.upvotes.length ? true : false,
    })),
    activeStream,
  });
}
