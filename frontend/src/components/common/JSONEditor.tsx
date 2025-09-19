"use client";
import styled from "styled-components";
import { useEffect, useState } from "react";
import type { SupportedLocale } from "@/types/common";

type Props = {
  label: string;
  value?: any;
  onChange: (v: any) => void;
  placeholder?: string;
  /** Dil / mesaj override’ı (hook yok) */
  locale?: SupportedLocale;
  messages?: { jsonInvalid?: string };
};

export default function JSONEditor({
  label,
  value,
  onChange,
  placeholder,
  locale,
  messages,
}: Props) {
  const [text, setText] = useState<string>(() => toStr(value));
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setText(toStr(value));
  }, [value]);

  const jsonInvalid =
    messages?.jsonInvalid ||
    (locale === "tr" ? "Geçersiz JSON" : "Invalid JSON");

  const blur = () => {
    try {
      const v = text.trim() ? JSON.parse(text) : undefined;
      setErr(null);
      onChange(v);
    } catch (e: any) {
      setErr(e?.message || jsonInvalid);
    }
  };

  return (
    <Wrap>
      <Label>{label}</Label>
      <Area
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={blur}
        placeholder={placeholder || "{ }"}
        spellCheck={false}
        aria-invalid={!!err}
      />
      {err && <Err>{err}</Err>}
    </Wrap>
  );
}

const toStr = (v: any) => {
  try {
    return v ? JSON.stringify(v, null, 2) : "";
  } catch {
    return "";
  }
};

/* styled */
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
`;
const Area = styled.textarea`
  width: 100%;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  line-height: 1.45;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  transition: box-shadow ${({ theme }) => theme.durations.fast},
    border-color ${({ theme }) => theme.durations.fast};
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
    box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
  }
`;
const Err = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
`;
