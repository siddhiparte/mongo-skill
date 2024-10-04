// app/api/users/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/app/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("users");
    
    const users = await db.collection("skillset").find({}).toArray();
    
    return NextResponse.json(users);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}