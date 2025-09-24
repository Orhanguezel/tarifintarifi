"use client";
import styled from "styled-components";
import { useRef, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/files";
import { uploadFiles, fetchAllFilesAdmin } from "@/modules/files/slice/filesSlice";

export default function FileUpload() {
  const { t } = useI18nNamespace("files", translations);
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = Array.from(e.target.files || []);
    if (!fl.length) return;
    setBusy(true);
    try {
      await dispatch(uploadFiles({ files: fl })).unwrap();
      await dispatch(fetchAllFilesAdmin());
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Wrap>
      <Hint>{t("upload_hint","Select files to upload (max 10 at once).")}</Hint>
      <Input type="file" multiple ref={fileRef} onChange={onPick} disabled={busy} />
      <Primary disabled={busy} onClick={()=>fileRef.current?.click()}>
        {busy ? t("uploading","Uploading...") : t("select_files","Select Files")}
      </Primary>
    </Wrap>
  );
}

/* styled */
const Wrap = styled.div`display:flex;align-items:center;gap:${({theme})=>theme.spacings.sm};flex-wrap:wrap;`;
const Hint = styled.div`color:${({theme})=>theme.colors.textSecondary};font-size:${({theme})=>theme.fontSizes.xsmall};`;
const Input = styled.input`display:none;`;
const Primary = styled.button`
  background:${({theme})=>theme.buttons.primary.background};
  color:${({theme})=>theme.buttons.primary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.buttons.primary.backgroundHover};
  padding:8px 12px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  &:disabled{opacity:${({theme})=>theme.opacity.disabled};cursor:not-allowed;}
`;
