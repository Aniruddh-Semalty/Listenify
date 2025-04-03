import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";

const YT_REGEX = new RegExp("^https://(www.)?youtube.com/watch?v=[w-]{11}$");

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z
    .string()
    .and(z.string().includes("youtube").or(z.string().includes("spotify"))),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json());
    const isYt = YT_REGEX.test(data.url);
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
    await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "Youtube",
      },
    });
  } catch (err) {
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
