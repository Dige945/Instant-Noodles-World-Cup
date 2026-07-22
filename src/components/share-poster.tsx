"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { Download, LoaderCircle, X } from "lucide-react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { getNoodle } from "@/lib/noodles";
import type { Personality } from "@/lib/personality";
import type { Tournament } from "@/types/tournament";

interface SharePosterProps {
  tournament: Tournament;
  personality: Personality;
}

export function SharePoster({ tournament, personality }: SharePosterProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState("");
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [posterDataUrl, setPosterDataUrl] = useState("");
  const champion = getNoodle(tournament.championId)!;

  function sideStages(side: "left" | "right") {
    const firstRound = tournament.matches.filter((match) => match.round === 1);
    const secondRound = tournament.matches.filter((match) => match.round === 2);
    const thirdRound = tournament.matches.filter((match) => match.round === 3);
    const semifinals = tournament.matches.filter((match) => match.round === 4);
    const firstStart = side === "left" ? 0 : 8;
    const secondStart = side === "left" ? 0 : 4;
    const thirdStart = side === "left" ? 0 : 2;
    const semifinalIndex = side === "left" ? 0 : 1;

    return [
      firstRound.slice(firstStart, firstStart + 8).flatMap((match) => [match.leftNoodleId, match.rightNoodleId]),
      firstRound.slice(firstStart, firstStart + 8).map((match) => match.winnerId),
      secondRound.slice(secondStart, secondStart + 4).map((match) => match.winnerId),
      thirdRound.slice(thirdStart, thirdStart + 2).map((match) => match.winnerId),
      [semifinals[semifinalIndex]?.winnerId ?? null],
    ];
  }

  const leftStages = sideStages("left");
  const rightStages = sideStages("right");

  function renderTree(stages: Array<Array<string | null>>, side: "left" | "right") {
    return stages.map((stage, stageIndex) => stage.map((id, index) => {
      const noodle = getNoodle(id);
      if (!noodle) return null;
      const advances = stageIndex === stages.length - 1
        ? id === tournament.championId
        : stages[stageIndex + 1].includes(id);
      const top = stageIndex === 4
        ? side === "left" ? 42 : 54
        : ((index + 0.5) / stage.length) * 100;
      const offset = stageIndex * 39;
      return (
        <div
          className={`poster-tree-card ${side} ${advances ? "advances" : "eliminated"} stage-${stageIndex} ${index % 2 === 0 ? "pair-even" : "pair-odd"}`}
          style={{ top: `${top}%`, [side]: `${offset}px`, "--pair-gap": `${620 / stage.length}px` } as CSSProperties}
          key={`${side}-${stageIndex}-${id}-${index}`}
        >
          <span className="poster-noodle-thumb"><Image src={noodle.image} alt="" width={18} height={18} loading="eager" unoptimized /></span>
          <strong>{noodle.name}</strong>
        </div>
      );
    }));
  }

  useEffect(() => {
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    const url = configured || window.location.origin;
    QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: "#3a1713", light: "#fffaf0" } })
      .then(setQrCode)
      .catch(() => setQrCode(""));
  }, []);

  useEffect(() => {
    if (!posterDataUrl) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPosterDataUrl("");
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [posterDataUrl]);

  async function inlinePosterImages(root: HTMLElement) {
    const images = Array.from(root.querySelectorAll("img"));
    await Promise.all(images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve, reject) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => reject(new Error(`图片加载失败：${image.src}`)), { once: true });
        });
      }
      if (!image.naturalWidth || !image.naturalHeight) throw new Error(`图片内容为空：${image.src}`);
      await image.decode();
      if (image.src.startsWith("data:")) return;

      const isChampion = Boolean(image.closest(".poster-package"));
      const size = isChampion ? 480 : 72;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("浏览器不支持图片内嵌处理");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, size, size);
      context.drawImage(image, 0, 0, size, size);
      image.removeAttribute("srcset");
      image.src = canvas.toDataURL("image/jpeg", isChampion ? 0.92 : 0.82);
      await image.decode();
    }));
  }

  async function generatePoster() {
    if (!posterRef.current || exporting) return;
    setExporting(true);
    setMessage("正在准备海报素材…");
    try {
      await document.fonts.ready;
      setMessage("正在绘制高清海报…");
      await inlinePosterImages(posterRef.current);
      const dataUrl = await Promise.race([
        toPng(posterRef.current, {
          cacheBust: false,
          skipFonts: true,
          pixelRatio: 2,
          width: 540,
          height: 960,
        }),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("海报绘制超时")), 20000)),
      ]);
      setPosterDataUrl(dataUrl);
      setMessage("海报已生成，可以保存图片、长按图片或直接截图。" );
    } catch {
      setMessage("海报生成失败，请稍后重试或更换浏览器。" );
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <button className="button button-primary" type="button" onClick={generatePoster} disabled={exporting || !qrCode}>
        {exporting ? <LoaderCircle className="spin" size={18} /> : <Download size={18} />}
        {exporting ? "正在生成…" : "生成分享海报"}
      </button>
      {message && <p className="export-message" role="status">{message}</p>}
      {posterDataUrl && (
        <div className="poster-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPosterDataUrl(""); }}>
          <section className="poster-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="poster-preview-title">
            <header>
              <div><span>SHARE POSTER</span><h2 id="poster-preview-title">你的冠军海报</h2></div>
              <button type="button" onClick={() => setPosterDataUrl("")} aria-label="关闭海报预览"><X size={21} /></button>
            </header>
            <div className="poster-preview-image-wrap">
              <Image src={posterDataUrl} alt={`${champion.name}方便面世界杯分享海报`} width={540} height={960} unoptimized priority />
            </div>
            <p>手机端可以长按上方海报保存，也可以直接截图分享。</p>
            <div className="poster-preview-actions">
              <button className="button button-ghost" type="button" onClick={() => setPosterDataUrl("")}>关闭</button>
              <a className="button button-primary" href={posterDataUrl} download={`方便面世界杯-${champion.name}.png`}><Download size={18} /> 保存图片</a>
            </div>
          </section>
        </div>
      )}
      <div className="poster-offscreen" aria-hidden="true">
        <div className="share-poster" ref={posterRef}>
          <div className="poster-stars" />
          <div className="poster-topline"><span>NOODLE CUP</span><span>32 → 1</span></div>
          <header className="poster-title-block">
            <strong>NOODLE CUP</strong>
            <h2>中国方便面世界杯</h2>
            <p>我的完整淘汰赛对阵图</p>
          </header>

          <div className="poster-bracket-stage">
            <div className="poster-center-line" />
            {renderTree(leftStages, "left")}
            {renderTree(rightStages, "right")}

            <div className="poster-champion-focus">
              <div className="poster-crown">♛</div>
              <div className="poster-package">
                <Image src={champion.image} alt="" fill sizes="236px" loading="eager" unoptimized />
                <div><span>{champion.brand}</span><strong>{champion.name}</strong></div>
              </div>
              <div className="poster-champion-badge">🏆 冠军 · CHAMPION</div>
              <h3>{champion.name}</h3>
              <p>{champion.brand} · {personality.name}</p>
            </div>
          </div>

          <div className="poster-bottom">
            <div className="poster-qr-wrap">{qrCode && <Image src={qrCode} alt="网站二维码" width={82} height={82} loading="eager" unoptimized />}</div>
            <div className="poster-bottom-copy"><strong>NOODLE CUP</strong><span>为你的本命方便面办一场世界杯</span><small>32 款方便面，只能留下一碗 · 本结果仅代表个人口味</small></div>
          </div>
        </div>
      </div>
    </>
  );
}
