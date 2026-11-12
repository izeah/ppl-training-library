import { useEffect, useState } from "react";
import Model, { type Muscle } from "react-body-highlighter";
import { ChevronLeft, ChevronRight, Play, X, ZoomIn } from "lucide-react";

export const photo = (id: string, n: 0 | 1) =>
    `${import.meta.env.BASE_URL}exercises/${id}/${n}.webp`;

// Free-text muscle names in exercises.json -> body-highlighter slugs.
// Not drawable (left out): supraspinatus, rotator cuff, shoulder/ankle stabilizers.
const MUSCLES: [RegExp, Muscle[]][] = [
    [/dada|chest|pector/, ["chest"]],
    [/rear delt/, ["back-deltoids"]],
    [/deltoid depan/, ["front-deltoids"]],
    [/samping|^deltoid$/, ["front-deltoids", "back-deltoids"]],
    [/triceps|long-head/, ["triceps"]],
    [/biceps|brachialis/, ["biceps"]],
    [/brachioradialis|forearm|grip/, ["forearm"]],
    [/lats|upper back|mid-back|rhomboid|teres/, ["upper-back"]],
    [/trap/, ["trapezius"]],
    [/erector/, ["lower-back"]],
    [/core/, ["abs", "obliques"]],
    [/glute/, ["gluteal"]],
    [/hamstring/, ["hamstring"]],
    [/quad/, ["quadriceps"]],
    [/adductor/, ["adductor"]],
    [/hip stabilizer/, ["abductors"]],
    [/calves|gastrocnemius/, ["calves"]],
    [/soleus/, ["left-soleus", "right-soleus"]],
];
const slugs = (names: string[]) => [
    ...new Set(
        names.flatMap((n) =>
            MUSCLES.filter(([re]) => re.test(n.toLowerCase())).flatMap(
                ([, s]) => s,
            ),
        ),
    ),
];

// Highlighter colors by frequency: 1 = secondary, 2 = primary (listed twice).
export function MuscleMap({
    primary,
    secondary,
}: {
    primary: string[];
    secondary: string[];
}) {
    const [zoom, setZoom] = useState(false);
    const p = slugs(primary);
    const s = slugs(secondary).filter((m) => !p.includes(m));
    const data = [
        { name: "primary", muscles: p },
        { name: "primary", muscles: p },
        { name: "secondary", muscles: s },
    ];
    const bodies = (["anterior", "posterior"] as const).map((type) => (
        <Model
            key={type}
            type={type}
            data={data}
            bodyColor="var(--border)"
            highlightedColors={["var(--orange)", "var(--accent)"]}
            style={{ width: "100%" }}
        />
    ));
    return (
        <>
            <div
                className="muscle-map"
                role="img"
                aria-label="Diagram otot target"
                onMouseEnter={() => setZoom(true)}
                onMouseLeave={() => setZoom(false)}
            >
                {bodies}
            </div>
            {/* Hover: enlarged map, trained muscles animated (CSS). Overlay is
                pointer-events:none so the hover stays on the small map. */}
            {zoom && (
                <div className="zoom-overlay" aria-hidden="true">
                    <div className="muscle-map muscle-map-zoom">{bodies}</div>
                </div>
            )}
        </>
    );
}

const LABELS = ["Posisi awal", "Posisi akhir"] as const;
const LAST = LABELS.length - 1;

export function Shots({ id, name }: { id: string; name: string }) {
    const [lightbox, setLightbox] = useState<number | null>(null);
    const [hoverZoom, setHoverZoom] = useState<number | null>(null);
    const open = lightbox !== null;
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightbox(null);
            if (e.key === "ArrowLeft")
                setLightbox((i) => Math.max(0, (i ?? 0) - 1));
            if (e.key === "ArrowRight")
                setLightbox((i) => Math.min(LAST, (i ?? 0) + 1));
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);
    return (
        <>
            <div className="shots">
                {([0, 1] as const).map((n) => (
                    <figure
                        key={n}
                        className="shots-fig"
                        onMouseEnter={() => setHoverZoom(n)}
                        onMouseLeave={() => setHoverZoom(null)}
                        onClick={() => {
                            setHoverZoom(null);
                            setLightbox(n);
                        }}
                    >
                        <img
                            src={photo(id, n)}
                            alt={`${name} - ${LABELS[n]}`}
                            width={640}
                            height={427}
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="shot-zoom-hint" aria-hidden="true">
                            <ZoomIn size={18} />
                        </div>
                        <figcaption>{LABELS[n]}</figcaption>
                    </figure>
                ))}
            </div>

            {/* Hover: full-screen zoom, no nav. pointer-events:none in CSS so
                the thumbnail keeps the hover (otherwise enter/leave loops = flicker). */}
            {hoverZoom !== null && (
                <div className="zoom-overlay" aria-hidden="true">
                    <img
                        src={photo(id, hoverZoom as 0 | 1)}
                        alt={`${name} - ${LABELS[hoverZoom]}`}
                        className="zoom-full"
                    />
                </div>
            )}

            {/* Click: lightbox with side nav buttons */}
            {lightbox !== null && (
                <div
                    className="lightbox-overlay"
                    onClick={() => setLightbox(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Lightbox foto"
                >
                    <div
                        className="lightbox-wrapper"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="lightbox-nav-side"
                            style={{
                                visibility:
                                    lightbox > 0 ? "visible" : "hidden",
                            }}
                            onClick={() => setLightbox(lightbox - 1)}
                            aria-label="Sebelumnya"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <div className="lightbox-box">
                            <button
                                className="lightbox-close"
                                onClick={() => setLightbox(null)}
                                aria-label="Tutup"
                            >
                                <X size={18} />
                            </button>
                            <img
                                src={photo(id, lightbox as 0 | 1)}
                                alt={`${name} - ${LABELS[lightbox]}`}
                                className="lightbox-img"
                            />
                            <div className="lightbox-footer">
                                <p className="lightbox-caption">
                                    {LABELS[lightbox]}
                                </p>
                                <span className="lightbox-counter">
                                    {lightbox + 1} / {LAST + 1}
                                </span>
                            </div>
                        </div>
                        <button
                            className="lightbox-nav-side"
                            style={{
                                visibility:
                                    lightbox < LAST ? "visible" : "hidden",
                            }}
                            onClick={() => setLightbox(lightbox + 1)}
                            aria-label="Berikutnya"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

// Click-to-load: no iframe (and no YouTube request beyond the thumbnail) until played.
export function VideoEmbed({
    id,
    title,
    channel,
}: {
    id: string;
    title: string;
    channel: string;
}) {
    const [playing, setPlaying] = useState(false);
    return (
        <figure className="video-embed">
            <div className="video-frame">
                {playing ? (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                        title={title}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setPlaying(true)}
                        aria-label={`Putar video: ${title}`}
                        style={{
                            backgroundImage: `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`,
                        }}
                    >
                        <Play size={26} fill="currentColor" />
                    </button>
                )}
            </div>
            <figcaption>
                {title}
                <span> · {channel}</span>
            </figcaption>
        </figure>
    );
}
