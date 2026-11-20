import { useState } from "react";
import { Expand, ZoomIn, Play, ChevronLeft, ChevronRight } from "lucide-react";
import type { Media } from "../catalog/model";
import { Modal } from "../../shared/Modal";
export function MediaGallery({
  media,
  variantId,
}: {
  media: Media[];
  variantId: string;
}) {
  const entries = media
    .filter((m) => !m.variantId || m.variantId === variantId)
    .sort((a, b) => a.position - b.position);
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [start, setStart] = useState<number | null>(null);
  const current = entries[index % entries.length];
  const move = (delta: number) =>
    setIndex((i) => (i + delta + entries.length) % entries.length);
  if (!current) return <p>No media available.</p>;
  const visual = (
    <>
      {current.kind === "video" ? (
        <>
          <video
            key={current.id}
            src={current.src}
            poster={current.poster}
            controls
            preload="none"
            aria-label={current.alt}
          />
          <small>{current.alt}</small>
        </>
      ) : (
        <img
          className={zoom ? "zoomed" : ""}
          src={current.src}
          alt={current.alt}
          loading="lazy"
        />
      )}
    </>
  );
  return (
    <div
      className="gallery"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          move(1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      <div
        className="gallery-main"
        onTouchStart={(e) => setStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (
            start !== null &&
            Math.abs(e.changedTouches[0].clientX - start) > 40
          )
            move(e.changedTouches[0].clientX < start ? 1 : -1);
          setStart(null);
        }}
      >
        {visual}
        <div className="gallery-tools">
          <button aria-label="Previous media" onClick={() => move(-1)}>
            <ChevronLeft />
          </button>
          <button aria-label="Next media" onClick={() => move(1)}>
            <ChevronRight />
          </button>
          <button
            aria-label="Open fullscreen viewer"
            onClick={() => setFull(true)}
          >
            <Expand />
          </button>
          {current.kind === "image" && (
            <button
              aria-label="Toggle image zoom"
              aria-pressed={zoom}
              onClick={() => setZoom(!zoom)}
            >
              <ZoomIn />
            </button>
          )}
        </div>
      </div>
      <div className="thumbnails" aria-label="Product media">
        {entries.map((m, i) => (
          <button
            key={m.id}
            aria-label={`View ${m.kind} ${i + 1}`}
            aria-pressed={index % entries.length === i}
            onClick={() => {
              setIndex(i);
              setZoom(false);
            }}
          >
            <img src={m.poster || m.src} alt="" loading="lazy" />
            {m.kind === "video" && <Play size={16} />}
          </button>
        ))}
      </div>
      {full && (
        <Modal title="Product media viewer" onClose={() => setFull(false)} wide>
          <div className="fullscreen-media">{visual}</div>
          <div className="viewer-nav">
            <button onClick={() => move(-1)}>Previous</button>
            <span>
              {(index % entries.length) + 1} / {entries.length}
            </span>
            <button onClick={() => move(1)}>Next</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
