import { useState } from "react";
import Model, { type Muscle } from "react-body-highlighter";
import { Play } from "lucide-react";

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
    const p = slugs(primary);
    const s = slugs(secondary).filter((m) => !p.includes(m));
    const data = [
        { name: "primary", muscles: p },
        { name: "primary", muscles: p },
        { name: "secondary", muscles: s },
    ];
    return (
        <div className="muscle-map" role="img" aria-label="Diagram otot target">
            {(["anterior", "posterior"] as const).map((type) => (
                <Model
                    key={type}
                    type={type}
                    data={data}
                    bodyColor="var(--border)"
                    highlightedColors={["var(--orange)", "var(--accent)"]}
                    style={{ width: "100%" }}
                />
            ))}
        </div>
    );
}

export function Shots({ id, name }: { id: string; name: string }) {
    return (
        <div className="shots">
            {([0, 1] as const).map((n) => (
                <figure key={n}>
                    <img
                        src={photo(id, n)}
                        alt={`${name} - ${n ? "posisi akhir" : "posisi awal"}`}
                        width={640}
                        height={427}
                        loading="lazy"
                        decoding="async"
                    />
                    <figcaption>{n ? "Posisi akhir" : "Posisi awal"}</figcaption>
                </figure>
            ))}
        </div>
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
