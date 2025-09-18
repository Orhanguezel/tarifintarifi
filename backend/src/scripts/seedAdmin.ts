// scripts/seedAdmin.ts
import "dotenv/config";
import mongoose from "mongoose";
import { UserModel } from "@/modules/users/model";
import { hashPassword } from "@/modules/users/service";

async function main() {
  await mongoose.connect(process.env.MONGO_URL!);
  const email = process.env.SEED_ADMIN_EMAIL || "admin@tarifintarifi.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeThis123!";
  const exists = await UserModel.findOne({ email });
  if (exists) {
    console.log("Admin already exists:", email);
  } else {
    await UserModel.create({
      email,
      passwordHash: await hashPassword(password),
      role: "admin",
      active: true
    });
    console.log("Admin created:", email);
  }
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
