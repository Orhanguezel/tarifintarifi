"use client";
import styled from "styled-components";
import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import type { SupportedLocale } from "@/types/common";

/** Opsiyonel görsel tipi — projede merkezi bir tip yoksa içeride tutuyoruz. */
export type ImageType = "recipe" | "about" | "avatar" | string;

/** Bu komponentin beklediği mevcut görsel yapısı */
export type UploadImage = {
  _id?: string;
  url: string;
  thumbnail?: string;
  webp?: string;
  publicId?: string;
  type?: ImageType;
};

type Messages = Partial<Record<
  | "add" | "hint" | "paste" | "removeExisting" | "removeNew" | "remove"
  | "typeMismatch" | "tooLarge" | "count" | "sizeLimit"
, string>>;

type Props = {
  existing: UploadImage[];
  onExistingChange: (next: UploadImage[]) => void;

  /** Silinecek mevcutların tutulduğu liste (opsiyonel ama önerilir) */
  removedExisting?: UploadImage[];
  onRemovedExistingChange?: (next: UploadImage[]) => void;

  files: File[];
  onFilesChange: (next: File[]) => void;

  /** Maksimum toplam görsel (existing + files) */
  maxFiles?: number;
  /** input accept (örn: "image/*" veya "image/webp,image/png,.jpg") */
  accept?: string;
  /** tek dosya boyut limiti (MB) */
  sizeLimitMB?: number;
  /** devre dışı */
  disabled?: boolean;
  /** dropzone’a yapıştırma ile eklemeyi aç/kapat */
  allowPaste?: boolean;

  /** opsiyonel açıklama */
  helpText?: string;

  /** Dil ayarı ve mesaj override’ları */
  locale?: SupportedLocale;
  messages?: Messages;
};

/* -------- basit yerel çeviri sistemi (hook yok) -------- */
const DICT: Record<SupportedLocale | "en", Required<Messages>> = {
  tr: {
    add: "+ Görsel ekle ({left} kaldı)",
    hint: "Sürükle-bırak veya tıkla",
    paste: "veya yapıştır",
    removeExisting: "Mevcut görseli kaldır",
    removeNew: "Yeni dosyayı kaldır",
    remove: "Kaldır",
    typeMismatch: "Bazı dosyalar kabul edilen türlerle uyuşmuyor",
    tooLarge: "Bazı dosyalar boyut limitini aşıyor",
    count: "{used}/{max} kullanıldı",
    sizeLimit: "Maks {n}MB/dosya",
  },
  en: {
    add: "+ Add Images ({left} left)",
    hint: "Drag & drop, click to browse",
    paste: "or paste",
    removeExisting: "Remove image",
    removeNew: "Remove new file",
    remove: "Remove",
    typeMismatch: "Some files are not allowed by the accept filter",
    tooLarge: "Some files exceed size limit",
    count: "{used}/{max} used",
    sizeLimit: "Max {n}MB/file",
  },
  // diğer diller DICT.en’e düşer (SupportedLocale union’ı geniş olabilir)
} as any;

function tKey(
  key: keyof Required<Messages>,
  locale: SupportedLocale | undefined,
  overrides?: Messages
) {
  const base =
    (overrides?.[key]) ??
    (DICT[(locale as keyof typeof DICT) || "en"]?.[key]) ??
    DICT.en[key];
  return base;
}

export default function ImageUploader({
  existing,
  onExistingChange,
  removedExisting,
  onRemovedExistingChange,
  files,
  onFilesChange,
  maxFiles = 5,
  accept = "image/*",
  sizeLimitMB = 15,
  disabled,
  allowPaste = true,
  helpText,
  locale,
  messages,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(
    () =>
      files.map((f) => ({
        key: `${f.name}-${f.size}-${f.lastModified}`,
        name: f.name,
        url: URL.createObjectURL(f),
      })),
    [files]
  );

  // objectURL cleanup
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  const totalCount = (existing?.length || 0) + (files?.length || 0);
  const left = Math.max(0, (maxFiles || 0) - totalCount);

  const pickLabel = tKey("add", locale, messages).replace("{left}", String(left));

  const resetErrorSoon = () => {
    window.setTimeout(() => setError(null), 2500);
  };

  /** accept ile dosya tipinin eşleşmesini kontrol et (basit ama pratik) */
  const matchesAccept = useCallback(
    (file: File) => {
      if (!accept) return true;
      const tokens = accept
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (tokens.length === 0) return true;

      const mime = (file.type || "").toLowerCase();
      const ext = "." + (file.name.split(".").pop() || "").toLowerCase();

      for (const tok of tokens) {
        if (tok === "*/*") return true;
        if (tok.endsWith("/*")) {
          // örn: image/* → image/ ile başlıyorsa olur
          const prefix = tok.slice(0, tok.length - 1); // "image/"
          if (mime.startsWith(prefix)) return true;
        } else if (tok.startsWith(".")) {
          // uzantı eşleşmesi (.png, .jpg)
          if (ext === tok) return true;
        } else {
          // tam mime (image/webp)
          if (mime === tok) return true;
        }
      }
      return false;
    },
    [accept]
  );

  const filterIncoming = useCallback(
    (incoming: File[]) => {
      const next: File[] = [];
      const nameset = new Set(files.map((f) => `${f.name}-${f.size}`)); // dup guard
      const maxBytes = sizeLimitMB * 1024 * 1024;

      for (const f of incoming) {
        if (left <= next.length) break;
        const sig = `${f.name}-${f.size}`;
        if (nameset.has(sig)) continue;

        if (!matchesAccept(f)) {
          setError(tKey("typeMismatch", locale, messages));
          continue;
        }
        if (maxBytes > 0 && f.size > maxBytes) {
          setError(tKey("tooLarge", locale, messages));
          continue;
        }
        next.push(f);
        nameset.add(sig);
      }
      if (!next.length && incoming.length) resetErrorSoon();
      return next;
    },
    [files, left, sizeLimitMB, matchesAccept, locale, messages]
  );

  const handlePick = (picked: File[]) => {
    if (!picked.length) return;
    const filtered = filterIncoming(picked).slice(0, left);
    if (!filtered.length) return;
    onFilesChange([...files, ...filtered]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setDragOver(false);
    const picked = Array.from(e.dataTransfer.files || []);
    handlePick(picked);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (disabled || !allowPaste) return;
    const items = Array.from(e.clipboardData.items || []);
    const imgs: File[] = [];
    items.forEach((it) => {
      const f = it.getAsFile?.();
      if (f && f.type?.startsWith("image/")) imgs.push(f);
    });
    if (imgs.length) handlePick(imgs);
  };

  const removeExisting = (img: UploadImage) => {
    // ✅ _id varsa onunla sil; yoksa url ile
    const next = existing.filter((x) => (img._id ? x._id !== img._id : x.url !== img.url));
    onExistingChange(next);
    if (onRemovedExistingChange) {
      onRemovedExistingChange([...(removedExisting || []), img]);
    }
  };

  const removeFile = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  const canAdd = left > 0 && !disabled;

  return (
    <Wrap onPaste={onPaste}>
      <Drop
        ref={dropRef}
        $dragOver={dragOver}
        role="button"
        tabIndex={0}
        aria-disabled={!canAdd}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (canAdd) inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => canAdd && inputRef.current?.click()}
      >
        <DropTitle>{pickLabel}</DropTitle>
        <DropSub>
          {tKey("hint", locale, messages)}
          {allowPaste ? ` • ${tKey("paste", locale, messages)}` : ""}
          {helpText ? ` • ${helpText}` : ""}
        </DropSub>
      </Drop>

      {error && <ErrorText role="alert">{error}</ErrorText>}

      <Grid>
        {existing.map((img) => (
          <Item key={img._id || img.url}>
            <Thumb $bg={img.thumbnail || img.webp || img.url} role="img" aria-label={short(img.url)} />
            <Row>
              <span className="mono small" title={img.url}>
                {short(img.url)}
              </span>
              <Danger
                type="button"
                onClick={() => removeExisting(img)}
                aria-label={tKey("removeExisting", locale, messages)}
              >
                {tKey("remove", locale, messages)}
              </Danger>
            </Row>
          </Item>
        ))}

        {previews.map((p, i) => (
          <Item key={p.key}>
            <Thumb $bg={p.url} role="img" aria-label={p.name} />
            <Row>
              <span className="mono small" title={p.name}>
                {p.name}
              </span>
              <Danger
                type="button"
                onClick={() => removeFile(i)}
                aria-label={tKey("removeNew", locale, messages)}
              >
                {tKey("remove", locale, messages)}
              </Danger>
            </Row>
          </Item>
        ))}
      </Grid>

      <Actions>
        <Btn
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!canAdd}
          aria-disabled={!canAdd}
        >
          {pickLabel}
        </Btn>

        <HiddenInput
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          disabled={!canAdd}
          onChange={(e) => {
            const picked = Array.from(e.target.files || []);
            handlePick(picked);
            e.currentTarget.value = "";
          }}
        />
      </Actions>

      <SmallInfo>
        {tKey("count", locale, messages)
          .replace("{used}", String(totalCount))
          .replace("{max}", String(maxFiles))}
        {sizeLimitMB
          ? ` • ${tKey("sizeLimit", locale, messages).replace("{n}", String(sizeLimitMB))}`
          : ""}
      </SmallInfo>
    </Wrap>
  );
}

const short = (s: string) => s.split("/").pop() || s;

/* styled */
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.sm};
`;

const Drop = styled.div<{ $dragOver: boolean }>`
  border: ${({ theme }) => theme.borders.thin}
    ${({ theme, $dragOver }) => ($dragOver ? theme.colors.borderHighlight : theme.colors.border)};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacings.md};
  text-align: center;
  cursor: pointer;
  transition: ${({ theme }) => theme.transition.normal};
  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
  }
  opacity: ${({ $dragOver }) => ($dragOver ? 0.95 : 1)};
`;

const DropTitle = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  color: ${({ theme }) => theme.colors.title};
  margin-bottom: ${({ theme }) => theme.spacings.xs};
`;

const DropSub = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacings.xs};
`;

const BaseButton = styled.button`
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.buttons.secondary.background};
  color: ${({ theme }) => theme.buttons.secondary.text};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: ${({ theme }) => theme.transition.normal};
  &:disabled, &[aria-disabled="true"] { opacity: ${({ theme }) => theme.opacity.disabled}; cursor: not-allowed; }
  &:hover { background: ${({ theme }) => theme.buttons.secondary.backgroundHover}; color: ${({ theme }) => theme.buttons.secondary.textHover}; }
  &:focus-visible { outline: none; box-shadow: ${({ theme }) => theme.colors.shadowHighlight}; }
`;

const Btn = styled(BaseButton)``;

const HiddenInput = styled.input`
  display: none;
`;

const SmallInfo = styled.div`
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/* === layout tweaks === */
const Grid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacings.sm};
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
`;

const Item = styled.div`
  position: relative;
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.cardBackground};
  transition: transform .06s ease, box-shadow .12s ease;
  &:hover { transform: translateY(-1px); box-shadow: ${({ theme }) => theme.colors.shadowHighlight}; }
`;

const Thumb = styled.div<{ $bg: string }>`
  width: 100%;
  padding-top: 66%;
  background-image: ${({ $bg }) => `url(${$bg})`};
  background-size: cover;
  background-position: center;
  border-bottom: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderBright};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;

  .mono.small {
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const Danger = styled(BaseButton)`
  flex: 0 0 auto;
  padding: 6px 10px;
  line-height: 1;
  background: ${({ theme }) => theme.colors.dangerBg};
  color: ${({ theme }) => theme.colors.danger};
  border-color: ${({ theme }) => theme.colors.danger};
  &:hover { filter: brightness(0.98); }
`;
