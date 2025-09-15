import dotenvFlow from "dotenv-flow";

export function loadEnv() {
  const nodeEnv = process.env.NODE_ENV || "development";
  dotenvFlow.config({
    node_env: nodeEnv,
    // default: looks for .env, .env.{NODE_ENV}, and .env.local variants
    purge_dotenv: false
  });
  process.env.NODE_ENV = nodeEnv;
  if (process.env.NODE_ENV !== "test") {
    console.log(`[env] NODE_ENV=${nodeEnv} loaded via dotenv-flow`);
  }
}
