"use client";
import styled from "styled-components";
import { useMemo, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/files";
import { fetchAllFilesAdmin, linkFile, unlinkFile, deleteFile } from "@/modules/files/slice/filesSlice";
import type { IFileObject, FilesAdminFilters } from "@/modules/files/types";

type Props = {
  items: IFileObject[];
  loading?: boolean;
};

const fmtBytes = (b?: number, t?: (k:string, f?:string)=>string) => {
  if (!b && b !== 0) return "-";
  const k = 1024;
  if (b < k) return `${b} ${t?.("bytes","B")||"B"}`;
  const kb = b / k; if (kb < k) return `${kb.toFixed(1)} ${t?.("kb","KB")||"KB"}`;
  const mb = kb / k; if (mb < k) return `${mb.toFixed(1)} ${t?.("mb","MB")||"MB"}`;
  const gb = mb / k; return `${gb.toFixed(1)} ${t?.("gb","GB")||"GB"}`;
};

const pickThumb = (f: IFileObject) => {
  const vs = f.versions || [];
  const t = vs.find(v=>v.kind==="thumbnail") || vs.find(v=>v.kind==="preview") || vs.find(v=>v.kind==="webp") || vs.find(v=>v.kind==="original");
  return t?.url || f.url;
};

export default function FileList({ items, loading }: Props) {
  const { t } = useI18nNamespace("files", translations);
  const dispatch = useAppDispatch();

  const [filters, setFilters] = useState<FilesAdminFilters>({ active: true });
  const onChange = (k: keyof FilesAdminFilters, v: any) =>
    setFilters(s => ({ ...s, [k]: v === "" ? undefined : v }));

  const [linkEdit, setLinkEdit] = useState<{ id: string; module: string; refId: string } | null>(null);

  const apply = () => dispatch(fetchAllFilesAdmin(filters));
  const reset = () => { const base: FilesAdminFilters = { active: true }; setFilters(base); dispatch(fetchAllFilesAdmin(base)); };

  const cols = useMemo(()=>[
    t("preview","Preview"), t("filename","Filename"), t("kind","Kind"),
    "MIME", t("size","Size"), t("createdAt","Created"), t("links","Links"), t("active","Active?"), t("actions","Actions")
  ],[t]);

  return (
    <Wrap>
      {/* Filters */}
      <Toolbar aria-label={t("filters","Filters")}>
        <FilterRow>
          <Select value={filters.kind || ""} onChange={(e)=>onChange("kind", e.target.value || undefined)}>
            <option value="">{t("kind","Kind")}</option>
            {["image","pdf","doc","other"].map(k=><option key={k} value={k}>{k}</option>)}
          </Select>
          <Input placeholder={t("mime","MIME")} value={filters.mime||""} onChange={(e)=>onChange("mime", e.target.value)} />
          <Input placeholder={t("module","Module")} value={filters.module||""} onChange={(e)=>onChange("module", e.target.value)} />
          <Input placeholder={t("refId","Ref ID")} value={filters.refId||""} onChange={(e)=>onChange("refId", e.target.value)} />
          <Select value={filters.active===undefined?"":String(filters.active)}
            onChange={(e)=>onChange("active", e.target.value===""? undefined : e.target.value==="true")}>
            <option value="">{t("active","Active?")}</option>
            <option value="true">{t("yes","Yes")}</option>
            <option value="false">{t("no","No")}</option>
          </Select>
        </FilterRow>
        <Actions>
          <Btn onClick={apply} disabled={loading}>{t("apply","Apply")}</Btn>
          <Btn onClick={reset} disabled={loading}>{t("reset","Reset")}</Btn>
        </Actions>
      </Toolbar>

      {/* Desktop table */}
      <Table aria-live="polite" aria-busy={loading}>
        <thead><tr>{cols.map((c,i)=><th key={i}>{c}</th>)}</tr></thead>
        <tbody>
          {!loading && items.length===0 && <tr><td colSpan={cols.length}><Empty>∅</Empty></td></tr>}
          {items.map(f=>(
            <tr key={f._id}>
              <td>
                {f.kind==="image" ? <Img src={pickThumb(f)} alt={f.filename} /> : <Mono>{f.ext?.toUpperCase() || f.kind.toUpperCase()}</Mono>}
              </td>
              <td title={f.filename}><Mono>{f.filename}</Mono></td>
              <td>{f.kind}</td>
              <td>{f.mime}</td>
              <td className="mono">{fmtBytes(f.size)}</td>
              <td>{f.createdAt ? new Date(f.createdAt).toLocaleString() : "-"}</td>
              <td>{f.links?.length || 0}</td>
              <td><Badge $on={f.isActive}>{f.isActive ? t("yes","Yes") : t("no","No")}</Badge></td>
              <td className="actions">
                <Row>
                  {linkEdit?.id===f._id ? (
                    <>
                      <Input small placeholder={t("module","Module")} value={linkEdit.module} onChange={(e)=>setLinkEdit(s=>({...s!, module:e.target.value}))}/>
                      <Input small placeholder={t("refId","Ref ID")} value={linkEdit.refId} onChange={(e)=>setLinkEdit(s=>({...s!, refId:e.target.value}))}/>
                      <Secondary onClick={()=>{
                        if (!linkEdit?.module || !linkEdit?.refId) return;
                        dispatch(linkFile({ id: f._id, module: linkEdit.module, refId: linkEdit.refId }));
                        setLinkEdit(null);
                      }}>{t("link_save","Save")}</Secondary>
                      <Secondary onClick={()=>setLinkEdit(null)}>{t("link_cancel","Cancel")}</Secondary>
                    </>
                  ) : (
                    <>
                      <Secondary onClick={()=>setLinkEdit({ id: f._id, module:"", refId:"" })}>{t("link_to","Link to")}</Secondary>
                      {f.links?.length>0 && (
                        <Secondary onClick={()=>{
                          const l = f.links[0]; // hızlı kullanım: ilkini kaldır
                          if (l) dispatch(unlinkFile({ id: f._id, module: l.module, refId: l.refId }));
                        }}>{t("unlink","Unlink")}</Secondary>
                      )}
                      <Danger onClick={()=>dispatch(deleteFile(f._id))}>{t("delete","Delete")}</Danger>
                    </>
                  )}
                </Row>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Mobile cards */}
      <CardsWrap aria-live="polite" aria-busy={loading}>
        {items.length===0 && !loading && <Empty>∅</Empty>}
        {items.map(f=>(
          <Card key={f._id}>
            <CardTop>
              <ThumbBox>
                {f.kind==="image" ? <Img src={pickThumb(f)} alt={f.filename} /> : <Mono>{f.ext?.toUpperCase() || f.kind.toUpperCase()}</Mono>}
              </ThumbBox>
              <div>
                <Title className="mono" title={f.filename}>{f.filename}</Title>
                <Meta>{f.mime} • {fmtBytes(f.size)}</Meta>
              </div>
              <Status $on={f.isActive}>{f.isActive ? t("yes","Yes") : t("no","No")}</Status>
            </CardTop>

            <Grid>
              <Field>{t("kind","Kind")}</Field><Value>{f.kind}</Value>
              <Field>{t("createdAt","Created")}</Field><Value>{f.createdAt ? new Date(f.createdAt).toLocaleString() : "-"}</Value>
              <Field>{t("links","Links")}</Field><Value>{f.links?.length || 0}</Value>
            </Grid>

            <Buttons>
              {linkEdit?.id===f._id ? (
                <>
                  <Input small placeholder={t("module","Module")} value={linkEdit.module} onChange={(e)=>setLinkEdit(s=>({...s!, module:e.target.value}))}/>
                  <Input small placeholder={t("refId","Ref ID")} value={linkEdit.refId} onChange={(e)=>setLinkEdit(s=>({...s!, refId:e.target.value}))}/>
                  <Secondary onClick={()=>{
                    if (!linkEdit?.module || !linkEdit?.refId) return;
                    dispatch(linkFile({ id: f._id, module: linkEdit.module, refId: linkEdit.refId }));
                    setLinkEdit(null);
                  }}>{t("link_save","Save")}</Secondary>
                  <Secondary onClick={()=>setLinkEdit(null)}>{t("link_cancel","Cancel")}</Secondary>
                </>
              ) : (
                <>
                  <Secondary onClick={()=>setLinkEdit({ id: f._id, module:"", refId:"" })}>{t("link","Link")}</Secondary>
                  {f.links?.length>0 && <Secondary onClick={()=>{
                    const l = f.links[0];
                    if (l) dispatch(unlinkFile({ id: f._id, module: l.module, refId: l.refId }));
                  }}>{t("unlink","Unlink")}</Secondary>}
                  <Danger onClick={()=>dispatch(deleteFile(f._id))}>{t("delete","Delete")}</Danger>
                </>
              )}
            </Buttons>
          </Card>
        ))}
      </CardsWrap>
    </Wrap>
  );
}

/* styled */
const Wrap = styled.div`display:flex;flex-direction:column;gap:${({theme})=>theme.spacings.md};`;

/* Filters */
const Toolbar = styled.div`
  display:flex;align-items:center;justify-content:space-between;gap:${({theme})=>theme.spacings.sm};
  background:${({theme})=>theme.colors.cardBackground};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};
  padding:${({theme})=>theme.spacings.md};
  ${({theme})=>theme.media.tablet}{flex-direction:column;align-items:stretch;}
`;
const FilterRow = styled.div`
  display:grid;gap:${({theme})=>theme.spacings.sm};
  grid-template-columns:180px 1fr 1fr 1fr 140px;
  ${({theme})=>theme.media.tablet}{grid-template-columns:repeat(3,1fr);}
  ${({theme})=>theme.media.mobile}{grid-template-columns:1fr;}
`;
const Actions = styled.div`display:flex;gap:${({theme})=>theme.spacings.sm};`;
const Input = styled.input<{small?:boolean}>`
  min-width:0;padding:${({small})=>small?"8px 10px":"10px 12px"};border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
`;
const Select = styled.select`
  min-width:0;padding:10px 12px;border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background};color:${({theme})=>theme.inputs.text};
`;
const Btn = styled.button`
  padding:10px 14px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  &:disabled{opacity:${({theme})=>theme.opacity.disabled};cursor:not-allowed;}
`;

/* Desktop table */
const Table = styled.table`
  width:100%;border-collapse:collapse;
  background:${({theme})=>theme.colors.cardBackground};
  border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};
  overflow:hidden;
  thead th{
    background:${({theme})=>theme.colors.tableHeader};
    color:${({theme})=>theme.colors.textSecondary};
    font-weight:${({theme})=>theme.fontWeights.semiBold};
    font-size:${({theme})=>theme.fontSizes.sm};
    padding:${({theme})=>theme.spacings.md};
    text-align:left;white-space:nowrap;
  }
  td{
    padding:${({theme})=>theme.spacings.md};
    border-bottom:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
    font-size:${({theme})=>theme.fontSizes.sm};
    vertical-align:middle;
  }
  td.actions{text-align:right;}
  ${({theme})=>theme.media.mobile}{display:none;}
`;
const Empty = styled.div`padding:${({theme})=>theme.spacings.md} 0;color:${({theme})=>theme.colors.textSecondary};text-align:center;`;
const Row = styled.div`display:flex;gap:${({theme})=>theme.spacings.xs};flex-wrap:wrap;justify-content:flex-end;`;
const Mono = styled.span`font-family:${({theme})=>theme.fonts.mono};`;
const Img = styled.img`width:52px;height:52px;object-fit:cover;border-radius:${({theme})=>theme.radii.md};border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};`;
const Badge = styled.span<{ $on:boolean }>`
  display:inline-block;padding:.2em .6em;border-radius:${({theme})=>theme.radii.pill};
  background:${({$on,theme})=>$on?theme.colors.successBg:theme.colors.inputBackgroundLight};
  color:${({$on,theme})=>$on?theme.colors.success:theme.colors.textSecondary};
`;

/* Mobile cards */
const CardsWrap = styled.div`
  display:none; ${({theme})=>theme.media.mobile}{
    display:grid;grid-template-columns:1fr;gap:${({theme})=>theme.spacings.md};
  }
`;
const Card = styled.article`
  background:${({theme})=>theme.colors.cardBackground};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderBright};
  border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};
  overflow:hidden;padding:${({theme})=>theme.spacings.md};
`;
const CardTop = styled.div`display:flex;align-items:center;gap:${({theme})=>theme.spacings.md};`;
const ThumbBox = styled.div`width:56px;height:56px;display:flex;align-items:center;justify-content:center;`;
const Title = styled.div`white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60vw;`;
const Meta = styled.div`color:${({theme})=>theme.colors.textSecondary};font-size:${({theme})=>theme.fontSizes.xsmall};`;
const Status = styled.span<{ $on:boolean }>`
  margin-left:auto;padding:.2em .6em;border-radius:${({theme})=>theme.radii.pill};
  background:${({$on,theme})=>$on?theme.colors.successBg:theme.colors.inputBackgroundLight};
  color:${({$on,theme})=>$on?theme.colors.success:theme.colors.textSecondary};
`;
const Grid = styled.div`
  display:grid;grid-template-columns:120px 1fr;gap:${({theme})=>theme.spacings.xs};margin:${({theme})=>theme.spacings.sm} 0;
`;
const Field = styled.span`color:${({theme})=>theme.colors.textSecondary};font-size:${({theme})=>theme.fontSizes.xsmall};`;
const Value = styled.span`font-size:${({theme})=>theme.fontSizes.xsmall};word-break:break-word;`;
const Buttons = styled.div`display:flex;gap:${({theme})=>theme.spacings.xs};justify-content:flex-end;margin-top:${({theme})=>theme.spacings.sm};`;
const Secondary = styled.button`
  padding:8px 10px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
`;
const Danger = styled(Secondary)`
  background:${({theme})=>theme.colors.dangerBg};
  color:${({theme})=>theme.colors.danger};
  border-color:${({theme})=>theme.colors.danger};
`;
