import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Function to load user data from users.json
const loadUsersData = (): { name: string; id: number; skills: string[] }[] => {
  const filePath = path.join(process.cwd(), "data", "users.json");
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
};

// Handle GET requests to fetch users
export async function GET() {
  const users = loadUsersData();
  return NextResponse.json(users);
}
