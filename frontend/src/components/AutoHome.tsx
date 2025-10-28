"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";

export default function AutoHome({to, delay = 1000}: {to: string; delay?: number}) {
  const router = useRouter();
  useEffect(() => {
    const id = setTimeout(() => router.replace(to), delay);
    return () => clearTimeout(id);
  }, [to, delay, router]);
  return null;
}
