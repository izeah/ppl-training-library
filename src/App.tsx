import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    ArrowLeft,
    ArrowUp,
    ArrowDown,
    BarChart3,
    CalendarDays,
    Check,
    ChevronRight,
    Clock,
    Dumbbell,
    Download,
    FileUp,
    Filter,
    Flame,
    Home,
    Library,
    Moon,
    Play,
    Plus,
    RotateCcw,
    Search,
    Settings,
    Timer,
    Trash2,
    Trophy,
    Weight,
    X,
} from "lucide-react";
import {
    Line,
    LineChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import exercisesData from "./data/exercises.json";
import { templates, schedule } from "./data/templates";
import {
    allSessions,
    saveSession,
    deleteSession,
    allMeasurements,
    saveMeasurement,
    getSetting,
    saveSetting,
    type Session,
    type SessionExercise,
    type SetLog,
} from "./lib/db";
const exercises = exercisesData as any[];
type Page =
    | "home"
    | "library"
    | "planner"
    | "history"
    | "analytics"
    | "settings"
    | "logger"
    | "detail";
const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const uid = () => crypto.randomUUID();
function App() {
    const [page, setPage] = useState<Page>("home"),
        [sessions, setSessions] = useState<Session[]>([]),
        [measurements, setMeasurements] = useState<any[]>([]),
        [active, setActive] = useState<Session | null>(null),
        [selected, setSelected] = useState<any>(null),
        [detailReturn, setDetailReturn] = useState<Page>("library"),
        [split, setSplit] = useState("Push"),
        [query, setQuery] = useState(""),
        [muscle, setMuscle] = useState("All"),
        [equipment, setEquipment] = useState("All"),
        [dark, setDark] = useState(true),
        [profile, setProfile] = useState({
            name: "",
            goal: "Body recomposition",
            weeklyTarget: 6,
        }),
        [weight, setWeight] = useState(""),
        [notice, setNotice] = useState(""),
        [elapsed, setElapsed] = useState(0),
        [rest, setRest] = useState(0),
        [customTemplates, setCustomTemplates] = useState<any[]>([]);
    const refresh = async () => {
        const rows = await allSessions();
        setSessions(rows.sort((a, b) => b.date.localeCompare(a.date)));
        setMeasurements(
            (await allMeasurements()).sort((a, b) =>
                a.date.localeCompare(b.date),
            ),
        );
        const unfinished = rows
            .filter((s) => !s.finishedAt)
            .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
        if (unfinished && !active) {
            setActive(unfinished);
            setPage("logger");
        }
    };
    useEffect(() => {
        refresh();
        getSetting("dark", true).then(setDark);
        getSetting("profile", {
            name: "",
            goal: "Body recomposition",
            weeklyTarget: 6,
        }).then(setProfile);
        getSetting<any[]>("customTemplates", []).then(setCustomTemplates);
    }, []);
    useEffect(() => {
        document.documentElement.dataset.theme = dark ? "dark" : "light";
        saveSetting("dark", dark);
    }, [dark]);
    useEffect(() => {
        if (!active || active.finishedAt) return;
        const t = setInterval(
            () =>
                setElapsed(
                    Math.floor(
                        (Date.now() - new Date(active.startedAt).getTime()) /
                            1000,
                    ),
                ),
            1000,
        );
        return () => clearInterval(t);
    }, [active]);
    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(""), 2600);
        return () => clearTimeout(t);
    }, [notice]);
    useEffect(() => {
        if (rest <= 0) return;
        const t = setInterval(() => setRest((v) => Math.max(0, v - 1)), 1000);
        return () => clearInterval(t);
    }, [rest > 0]);
    const completed = sessions.filter((s) => s.finishedAt);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const thisWeek = completed.filter((s) => new Date(s.date) >= weekStart);
    const volume = thisWeek.reduce(
        (sum, s) =>
            sum +
            s.exercises.reduce(
                (a, e) =>
                    a +
                    e.sets
                        .filter((x) => x.done)
                        .reduce(
                            (b, x) => b + (x.weight || 0) * (x.reps || 0),
                            0,
                        ),
                0,
            ),
        0,
    );
    const filtered = useMemo(
        () =>
            exercises.filter(
                (e) =>
                    e.split === split &&
                    `${e.name} ${e.primaryMuscles.join(" ")} ${e.equipment.join(" ")}`
                        .toLowerCase()
                        .includes(query.toLowerCase()) &&
                    (muscle === "All" ||
                        e.primaryMuscles.some((m: string) =>
                            m.toLowerCase().includes(muscle.toLowerCase()),
                        )) &&
                    (equipment === "All" ||
                        e.equipment.some((m: string) =>
                            m.toLowerCase().includes(equipment.toLowerCase()),
                        )),
            ),
        [split, query, muscle, equipment],
    );
    const startWorkout = (template: any) => {
        const ex: SessionExercise[] = template.items.map((it: any) => {
            const found = exercises.find((e) => e.name === it.name);
            return {
                exerciseId: found?.id || it.name,
                name: it.name,
                sets: Array.from({ length: it.sets }, () => ({
                    weight: null,
                    reps: null,
                    rir: 2,
                    done: false,
                })),
                notes: "",
            };
        });
        const s: Session = {
            id: uid(),
            templateName: template.name,
            split: template.split,
            date: today(),
            startedAt: new Date().toISOString(),
            notes: "",
            exercises: ex,
        };
        setActive(s);
        saveSession(s);
        setElapsed(0);
        setPage("logger");
    };
    const updateActive = (fn: (s: Session) => Session) =>
        setActive((prev) => {
            if (!prev) return prev;
            const next = fn(prev);
            void saveSession(next);
            return next;
        });
    const finishWorkout = async () => {
        if (!active) return;
        if (!active.exercises.some((e) => e.sets.some((x) => x.done))) {
            setNotice(
                "Selesaikan minimal satu set sebelum mengakhiri workout.",
            );
            return;
        }
        const done = { ...active, finishedAt: new Date().toISOString() };
        await saveSession(done);
        setActive(null);
        await refresh();
        setPage("history");
        setNotice("Workout tersimpan secara lokal.");
    };
    const saveCurrent = async () => {
        if (!active) return;
        await saveSession(active);
        setNotice("Progress workout tersimpan.");
    };
    const updateSet = (ei: number, si: number, patch: Partial<SetLog>) =>
        updateActive((s) => ({
            ...s,
            exercises: s.exercises.map((e, i) =>
                i !== ei
                    ? e
                    : {
                          ...e,
                          sets: e.sets.map((x, j) =>
                              j === si ? { ...x, ...patch } : x,
                          ),
                      },
            ),
        }));
    const nav = [
        { id: "home", label: "Home", icon: Home },
        { id: "library", label: "Library", icon: Library },
        { id: "planner", label: "Planner", icon: CalendarDays },
        { id: "history", label: "History", icon: Activity },
        { id: "analytics", label: "Progress", icon: BarChart3 },
    ];
    const weekData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 6 + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return {
            day: d.toLocaleDateString("id-ID", { weekday: "short" }),
            workouts: completed.filter((s) => s.date === key).length,
        };
    });
    const strengthData = useMemo(() => {
        const rows: any[] = [];
        completed
            .slice()
            .reverse()
            .forEach((s) =>
                s.exercises.forEach((e) =>
                    e.sets
                        .filter(
                            (x) =>
                                x.done && x.weight !== null && x.reps !== null,
                        )
                        .forEach((x) =>
                            rows.push({
                                date: s.date.slice(5),
                                weight: x.weight,
                                exercise: e.name,
                            }),
                        ),
                ),
            );
        return rows;
    }, [completed]);
    const exportData = async () => {
        const data = {
            schemaVersion: 1,
            exportedAt: new Date().toISOString(),
            sessions,
            measurements,
            profile,
            customTemplates,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `ppl-backup-${today()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    };
    const importData = (file: File) => {
        const r = new FileReader();
        r.onload = async () => {
            try {
                const d = JSON.parse(String(r.result));
                if (d.schemaVersion !== 1 || !Array.isArray(d.sessions))
                    throw Error("Format backup tidak dikenali");
                for (const s of d.sessions) await saveSession(s);
                if (Array.isArray(d.measurements)) {
                    for (const m of d.measurements) await saveMeasurement(m);
                }
                if (d.profile) {
                    setProfile(d.profile);
                    await saveSetting("profile", d.profile);
                }
                if (Array.isArray(d.customTemplates)) {
                    setCustomTemplates(d.customTemplates);
                    await saveSetting("customTemplates", d.customTemplates);
                }
                await refresh();
                setNotice("Backup berhasil diimpor.");
            } catch (e) {
                setNotice("Gagal import: file tidak valid.");
            }
        };
        r.readAsText(file);
    };
    const addBodyWeight = async () => {
        const n = Number(weight);
        if (!n || n < 20 || n > 400) {
            setNotice("Masukkan berat badan yang valid (20–400 kg).");
            return;
        }
        await saveMeasurement({ id: uid(), date: today(), weight: n });
        setWeight("");
        setMeasurements(await allMeasurements());
        setNotice("Berat badan dicatat.");
    };
    const title =
        page === "home"
            ? "Dashboard"
            : page === "library"
              ? "Exercise Library"
              : page === "planner"
                ? "Workout Planner"
                : page === "history"
                  ? "Workout History"
                  : page === "analytics"
                    ? "Progress Analytics"
                    : page === "settings"
                      ? "Settings"
                      : page === "logger"
                        ? "Active Workout"
                        : "Exercise Detail";
    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-mark">
                        <Dumbbell size={21} />
                    </div>
                    <div>
                        <b>
                            PPL <span>LIBRARY</span>
                        </b>
                        <small>TRAIN WITH INTENT</small>
                    </div>
                </div>
                <div className="side-label">WORKSPACE</div>
                {nav.map((n) => (
                    <button
                        key={n.id}
                        className={`nav-item ${page === n.id ? "active" : ""}`}
                        onClick={() => setPage(n.id as Page)}
                    >
                        <n.icon size={18} />
                        {n.label}
                    </button>
                ))}
                <div className="side-bottom">
                    <button
                        className={`nav-item ${page === "settings" ? "active" : ""}`}
                        onClick={() => setPage("settings")}
                    >
                        <Settings size={18} />
                        Settings
                    </button>
                    <div className="local-status">
                        <span className="live-dot" /> Data tersimpan di
                        perangkat
                    </div>
                </div>
            </aside>
            <main className="main">
                <header className="topbar">
                    <div className="mobile-brand">
                        <Dumbbell size={19} /> PPL LIBRARY
                    </div>
                    <div className="crumb">
                        WORKSPACE <span>/</span> {title.toUpperCase()}
                    </div>
                    <div className="top-actions">
                        <span className="local-pill">
                            <span className="live-dot" /> LOCAL STORAGE
                        </span>
                        <button
                            className="icon-btn"
                            aria-label="Toggle theme"
                            onClick={() => setDark(!dark)}
                        >
                            <Moon size={18} />
                        </button>
                        <button
                            className="avatar"
                            onClick={() => setPage("settings")}
                        >
                            {profile.name?.trim()?.[0]?.toUpperCase() || "U"}
                        </button>
                    </div>
                </header>
                {page === "home" && (
                    <section className="content">
                        <div className="page-heading">
                            <div>
                                <div className="eyebrow">
                                    YOUR TRAINING OVERVIEW
                                </div>
                                <h1>
                                    Stay consistent. <em>Get stronger.</em>
                                </h1>
                                <p>
                                    Ringkasan latihan dan progres personal Anda.
                                </p>
                            </div>
                            <button
                                className="primary-btn"
                                onClick={() => setPage("planner")}
                            >
                                <Play size={16} fill="currentColor" /> Start
                                workout
                            </button>
                        </div>
                        <div className="stat-grid">
                            <Stat
                                icon={Flame}
                                label="WORKOUT THIS WEEK"
                                value={`${thisWeek.length}`}
                                suffix={`/ ${profile.weeklyTarget}`}
                                tone="orange"
                            />
                            <Stat
                                icon={Dumbbell}
                                label="TOTAL COMPLETED"
                                value={completed.length}
                                suffix="sessions"
                            />
                            <Stat
                                icon={Activity}
                                label="WEEKLY VOLUME"
                                value={volume.toLocaleString("id-ID")}
                                suffix="kg × reps"
                            />
                            <Stat
                                icon={Trophy}
                                label="BODY WEIGHT"
                                value={
                                    measurements.length
                                        ? `${measurements[measurements.length - 1].weight}`
                                        : "—"
                                }
                                suffix="kg"
                            />
                        </div>
                        <div className="dashboard-grid">
                            <div className="panel schedule-panel">
                                <div className="panel-head">
                                    <div>
                                        <div className="eyebrow">
                                            YOUR SPLIT
                                        </div>
                                        <h2>This week</h2>
                                    </div>
                                    <button
                                        className="text-btn"
                                        onClick={() => setPage("planner")}
                                    >
                                        View planner <ChevronRight size={15} />
                                    </button>
                                </div>
                                <div className="schedule-list">
                                    {schedule.map((d, i) => {
                                        const t = templates.find(
                                            (x) => x.id === d.id,
                                        );
                                        return (
                                            <div
                                                className={`schedule-row ${d.id === "rest" ? "rest-row" : ""}`}
                                                key={d.day}
                                            >
                                                <span className="day-name">
                                                    {d.day}
                                                </span>
                                                <span
                                                    className={`split-dot ${t?.split.toLowerCase() || "rest"}`}
                                                />
                                                <span className="session-name">
                                                    {t?.name ||
                                                        "Rest & recovery"}
                                                </span>
                                                <span className="schedule-meta">
                                                    {d.id === "rest"
                                                        ? "RECOVERY"
                                                        : `${i + 1} / 6`}
                                                </span>
                                                <button
                                                    className="row-action"
                                                    disabled={!t}
                                                    onClick={() =>
                                                        t && startWorkout(t)
                                                    }
                                                    aria-label={`Start ${t?.name}`}
                                                >
                                                    <Play size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="panel week-panel">
                                <div className="panel-head">
                                    <div>
                                        <div className="eyebrow">
                                            LAST 7 DAYS
                                        </div>
                                        <h2>Consistency</h2>
                                    </div>
                                    <Activity size={18} className="muted" />
                                </div>
                                <div className="week-bars">
                                    {weekData.map((d, i) => (
                                        <div className="week-bar-col" key={i}>
                                            <div
                                                className={`week-bar ${d.workouts ? "filled" : ""}`}
                                                style={{
                                                    height: d.workouts ? 74 : 8,
                                                }}
                                            />
                                            <span>{d.day}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="week-legend">
                                    <span>
                                        <i /> Completed workout
                                    </span>
                                    <b>
                                        {weekData.reduce(
                                            (a, b) => a + b.workouts,
                                            0,
                                        )}{" "}
                                        sessions
                                    </b>
                                </div>
                            </div>
                        </div>
                        <div className="panel recent-panel">
                            <div className="panel-head">
                                <div>
                                    <div className="eyebrow">TRAINING LOG</div>
                                    <h2>Recent activity</h2>
                                </div>
                                <button
                                    className="text-btn"
                                    onClick={() => setPage("history")}
                                >
                                    All history <ChevronRight size={15} />
                                </button>
                            </div>
                            {completed.length === 0 ? (
                                <Empty
                                    icon={Activity}
                                    title="No workouts logged yet"
                                    text="Mulai dari template PPL A/B. Data performa akan muncul setelah sesi pertama disimpan."
                                    action="Open workout planner"
                                    onClick={() => setPage("planner")}
                                />
                            ) : (
                                completed.slice(0, 4).map((s) => (
                                    <div className="recent-row" key={s.id}>
                                        <div
                                            className={`recent-icon ${s.split.toLowerCase()}`}
                                        >
                                            <Dumbbell size={17} />
                                        </div>
                                        <div className="recent-info">
                                            <b>{s.templateName}</b>
                                            <small>
                                                {new Date(
                                                    s.date + "T12:00:00",
                                                ).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}{" "}
                                                · {s.exercises.length} exercises
                                            </small>
                                        </div>
                                        <span className="recent-sets">
                                            {s.exercises.reduce(
                                                (a, e) =>
                                                    a +
                                                    e.sets.filter((x) => x.done)
                                                        .length,
                                                0,
                                            )}{" "}
                                            sets
                                        </span>
                                        <Check
                                            size={16}
                                            className="success-icon"
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}
                {page === "library" && (
                    <section className="content">
                        <div className="page-heading">
                            <div>
                                <div className="eyebrow">
                                    MOVEMENT DATABASE · {exercises.length}{" "}
                                    EXERCISES
                                </div>
                                <h1>
                                    Exercise <em>library.</em>
                                </h1>
                                <p>
                                    Referensi gerakan berdasarkan katalog yang
                                    terdokumentasi.
                                </p>
                            </div>
                        </div>
                        <div className="split-tabs">
                            {["Push", "Pull", "Legs"].map((s) => (
                                <button
                                    key={s}
                                    className={split === s ? "selected" : ""}
                                    onClick={() => {
                                        setSplit(s);
                                        setMuscle("All");
                                        setEquipment("All");
                                    }}
                                >
                                    {s}
                                    <span>
                                        {
                                            exercises.filter(
                                                (e) => e.split === s,
                                            ).length
                                        }
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="filter-row">
                            <div className="search-box">
                                <Search size={17} />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search exercise or muscle..."
                                />
                                <kbd>⌕</kbd>
                            </div>
                            <select
                                value={muscle}
                                onChange={(e) => setMuscle(e.target.value)}
                            >
                                <option value="All">All target muscles</option>
                                {Array.from(
                                    new Set(
                                        exercises
                                            .filter((e) => e.split === split)
                                            .flatMap((e) => e.primaryMuscles),
                                    ),
                                )
                                    .sort()
                                    .map((m) => (
                                        <option key={m}>{m}</option>
                                    ))}
                            </select>
                            <select
                                value={equipment}
                                onChange={(e) => setEquipment(e.target.value)}
                            >
                                <option value="All">All equipment</option>
                                {Array.from(
                                    new Set(
                                        exercises
                                            .filter((e) => e.split === split)
                                            .flatMap((e) => e.equipment),
                                    ),
                                )
                                    .sort()
                                    .map((m) => (
                                        <option key={m}>{m}</option>
                                    ))}
                            </select>
                        </div>
                        <div className="library-summary">
                            <span>{filtered.length} movements found</span>
                            <span>
                                <Filter size={13} /> FILTERED BY{" "}
                                {split.toUpperCase()}
                            </span>
                        </div>
                        <div className="exercise-grid">
                            {filtered.map((e, i) => (
                                <button
                                    className="exercise-card"
                                    key={e.id}
                                    onClick={() => {
                                        setSelected(e);
                                        setDetailReturn("library");
                                        setPage("detail");
                                    }}
                                >
                                    <div
                                        className={`exercise-art ${split.toLowerCase()}`}
                                    >
                                        <span>
                                            {split.toUpperCase()} /{" "}
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <Dumbbell size={31} />
                                        <small>
                                            {e.equipment
                                                .slice(0, 2)
                                                .join(" · ")}
                                        </small>
                                    </div>
                                    <div className="exercise-card-body">
                                        <b>{e.name}</b>
                                        <p>{e.primaryMuscles.join(" · ")}</p>
                                        <div className="exercise-meta">
                                            <span>{e.sets} sets</span>
                                            <span>{e.reps} reps</span>
                                            <span>{e.rest}</span>
                                        </div>
                                    </div>
                                    <ChevronRight
                                        size={16}
                                        className="exercise-arrow"
                                    />
                                </button>
                            ))}
                        </div>
                        {filtered.length === 0 && (
                            <Empty
                                icon={Search}
                                title="No movements found"
                                text="Coba kata kunci atau filter lain."
                            />
                        )}
                    </section>
                )}
                {page === "detail" && selected && (
                    <section className="content">
                        <button
                            className="back-btn"
                            onClick={() => setPage(detailReturn)}
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <div className="detail-layout">
                            <div>
                                <div
                                    className={`detail-art ${selected.split.toLowerCase()}`}
                                >
                                    <Dumbbell size={64} />
                                    <span>
                                        {selected.split.toUpperCase()} MOVEMENT
                                    </span>
                                </div>
                                <div className="panel detail-tech">
                                    <div className="eyebrow">
                                        TECHNIQUE GUIDANCE
                                    </div>
                                    <h2>Teknik inti</h2>
                                    {(selected.split === "Push"
                                        ? [
                                              "Jaga torso dan posisi sendi tetap stabil.",
                                              "Kontrol fase eksentrik; hindari momentum.",
                                              "Gunakan range of motion yang nyaman dan tidak menimbulkan nyeri.",
                                          ]
                                        : selected.split === "Pull"
                                          ? [
                                                "Stabilkan torso dan hindari ayunan.",
                                                "Tarik dengan arah siku yang sesuai pola gerakan.",
                                                "Kontrol fase kembali dan pertahankan ROM nyaman.",
                                            ]
                                          : [
                                                "Pertahankan tumpuan kaki yang stabil dan kontrol tulang belakang.",
                                                "Gunakan ROM yang dapat dikendalikan tanpa kompensasi.",
                                                "Hentikan atau modifikasi jika muncul nyeri tajam.",
                                            ]
                                    ).map((x, i) => (
                                        <p className="cue" key={i}>
                                            <Check size={15} />
                                            {x}
                                        </p>
                                    ))}
                                </div>
                            </div>
                            <div className="detail-copy">
                                <div className="eyebrow">
                                    {selected.split.toUpperCase()} / EXERCISE
                                    DETAIL
                                </div>
                                <h1>{selected.name}</h1>
                                <p className="detail-desc">
                                    Panduan ringkas gerakan berdasarkan katalog
                                    latihan. Sesuaikan beban dengan kemampuan
                                    dan teknik aktual.
                                </p>
                                <div className="detail-stats">
                                    <div>
                                        <small>SETS</small>
                                        <b>{selected.sets}</b>
                                    </div>
                                    <div>
                                        <small>REP RANGE</small>
                                        <b>{selected.reps}</b>
                                    </div>
                                    <div>
                                        <small>REST</small>
                                        <b>{selected.rest}</b>
                                    </div>
                                </div>
                                <div className="detail-section">
                                    <h3>Primary muscles</h3>
                                    <div className="tag-list">
                                        {selected.primaryMuscles.map(
                                            (m: string) => (
                                                <span
                                                    className="muscle-tag primary"
                                                    key={m}
                                                >
                                                    {m}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </div>
                                <div className="detail-section">
                                    <h3>Secondary muscles</h3>
                                    <div className="tag-list">
                                        {selected.secondaryMuscles.map(
                                            (m: string) => (
                                                <span
                                                    className="muscle-tag"
                                                    key={m}
                                                >
                                                    {m}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </div>
                                <div className="detail-section">
                                    <h3>Equipment & setup</h3>
                                    <ul>
                                        {selected.equipment.map((x: string) => (
                                            <li key={x}>{x}</li>
                                        ))}
                                    </ul>
                                    <p className="subtle">
                                        Atur posisi kursi, bench, pin, atau
                                        handle sesuai anatomi dan instruksi
                                        mesin yang tersedia.
                                    </p>
                                </div>
                                <div className="detail-section">
                                    <h3>Recommended programming</h3>
                                    <p>
                                        {selected.sets} working sets ×{" "}
                                        {selected.reps} reps · Rest{" "}
                                        {selected.rest}.
                                    </p>
                                    <p className="subtle">
                                        Mulai mayoritas working sets sekitar 2–3
                                        RIR. Gunakan double progression; tambah
                                        beban setelah seluruh set mencapai batas
                                        atas dengan teknik baik.
                                    </p>
                                </div>
                                <a
                                    className="youtube-link"
                                    href={selected.tutorialUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Search tutorial on YouTube{" "}
                                    <ChevronRight size={16} />
                                </a>
                            </div>
                        </div>
                    </section>
                )}
                {page === "planner" && (
                    <section className="content">
                        <div className="page-heading">
                            <div>
                                <div className="eyebrow">PROGRAM STRUCTURE</div>
                                <h1>
                                    Workout <em>planner.</em>
                                </h1>
                                <p>
                                    Template A/B terdokumentasi · target sesi
                                    sekitar 60 menit.
                                </p>
                            </div>
                        </div>
                        <div className="panel planner-week">
                            <div className="panel-head">
                                <div>
                                    <div className="eyebrow">
                                        WEEKLY SCHEDULE
                                    </div>
                                    <h2>Senin — Minggu</h2>
                                </div>
                                <div className="planner-tools">
                                    <span className="pill">
                                        6 TRAINING DAYS
                                    </span>
                                    <button
                                        className="secondary-btn"
                                        onClick={() => {
                                            const name = prompt(
                                                "Nama workout custom",
                                            );
                                            if (!name?.trim()) return;
                                            const splitChoice = (
                                                prompt(
                                                    "Split: Push, Pull, atau Legs",
                                                    "Push",
                                                ) || "Push"
                                            ).trim();
                                            if (
                                                ![
                                                    "Push",
                                                    "Pull",
                                                    "Legs",
                                                ].includes(splitChoice)
                                            ) {
                                                setNotice("Split tidak valid.");
                                                return;
                                            }
                                            const raw = prompt(
                                                "Masukkan nama exercise dipisahkan koma",
                                            );
                                            if (!raw?.trim()) return;
                                            const items = raw
                                                .split(",")
                                                .map((x: string) => x.trim())
                                                .filter(Boolean)
                                                .map((n: string) => ({
                                                    name: n,
                                                    sets: 3,
                                                    reps: "8–12",
                                                }));
                                            const t = {
                                                id: "custom-" + uid(),
                                                name: name.trim(),
                                                split: splitChoice,
                                                items,
                                            };
                                            const next = [
                                                ...customTemplates,
                                                t,
                                            ];
                                            setCustomTemplates(next);
                                            saveSetting(
                                                "customTemplates",
                                                next,
                                            );
                                            setNotice("Custom workout dibuat.");
                                        }}
                                    >
                                        <Plus size={14} /> Custom workout
                                    </button>
                                </div>
                            </div>
                            <div className="planner-days">
                                {schedule.map((d, i) => {
                                    const t = templates.find(
                                        (x) => x.id === d.id,
                                    );
                                    return (
                                        <div
                                            className={`planner-day ${!t ? "off" : ""}`}
                                            key={d.day}
                                        >
                                            <span>
                                                {d.day
                                                    .slice(0, 3)
                                                    .toUpperCase()}
                                            </span>
                                            <b>{t?.name || "REST"}</b>
                                            <small>
                                                {t
                                                    ? `${t.items.length} exercises`
                                                    : "Recovery"}
                                            </small>
                                            {t && (
                                                <button
                                                    onClick={() =>
                                                        startWorkout(t)
                                                    }
                                                >
                                                    <Play
                                                        size={13}
                                                        fill="currentColor"
                                                    />{" "}
                                                    Start
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="template-heading">
                            <div>
                                <div className="eyebrow">PROGRAM TEMPLATES</div>
                                <h2>Choose your session</h2>
                            </div>
                            <span className="subtle">A / B ROTATION</span>
                        </div>
                        <div className="template-grid">
                            {[...templates, ...customTemplates].map((t) => (
                                <div className="panel template-card" key={t.id}>
                                    <div className="template-top">
                                        <div
                                            className={`recent-icon ${t.split.toLowerCase()}`}
                                        >
                                            <Dumbbell size={18} />
                                        </div>
                                        <span
                                            className={`split-label ${t.split.toLowerCase()}`}
                                        >
                                            {t.split.toUpperCase()}
                                        </span>
                                    </div>
                                    <h3>{t.name}</h3>
                                    <div className="template-items">
                                        {t.items.map(
                                            (
                                                it: {
                                                    name: string;
                                                    sets: number;
                                                    reps: string;
                                                },
                                                i: number,
                                            ) => (
                                                <div key={i}>
                                                    <span>
                                                        {String(i + 1).padStart(
                                                            2,
                                                            "0",
                                                        )}
                                                    </span>
                                                    {it.name}
                                                    <small>
                                                        {it.sets} × {it.reps}
                                                    </small>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    <div className="template-foot">
                                        <span>
                                            <Clock size={14} /> ~45–60 min
                                            target
                                        </span>
                                        <button
                                            className="primary-btn small"
                                            onClick={() => startWorkout(t)}
                                        >
                                            <Play
                                                size={13}
                                                fill="currentColor"
                                            />{" "}
                                            Start session
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="note-line">
                            Program merupakan template awal. Urutan dan pilihan
                            gerakan dapat disesuaikan. Durasi aktual bergantung
                            pada waktu istirahat dan transisi alat.
                        </p>
                    </section>
                )}
                {page === "logger" && active && (
                    <section className="content logger-content">
                        <div className="logger-header">
                            <button
                                className="back-btn"
                                onClick={() => {
                                    saveCurrent();
                                    setPage("planner");
                                }}
                            >
                                <ArrowLeft size={16} /> Exit workout
                            </button>
                            <div className="logger-clock">
                                <Timer size={16} />
                                {String(Math.floor(elapsed / 60)).padStart(
                                    2,
                                    "0",
                                )}
                                :{String(elapsed % 60).padStart(2, "0")}
                            </div>
                        </div>
                        <div className="page-heading logger-title">
                            <div>
                                <div className="eyebrow">
                                    ACTIVE SESSION · {active.date}
                                </div>
                                <h1>
                                    {active.templateName} <em>workout.</em>
                                </h1>
                                <p>
                                    Catat beban, repetisi, dan RIR aktual setiap
                                    set.
                                </p>
                            </div>
                            <button
                                className="secondary-btn"
                                onClick={() => {
                                    const name = prompt(
                                        "Nama exercise dari library",
                                    );
                                    if (!name) return;
                                    const found = exercises.find(
                                        (x) =>
                                            x.name.toLowerCase() ===
                                            name.trim().toLowerCase(),
                                    );
                                    if (!found) {
                                        setNotice(
                                            "Exercise tidak ditemukan di library.",
                                        );
                                        return;
                                    }
                                    updateActive((s) => ({
                                        ...s,
                                        exercises: [
                                            ...s.exercises,
                                            {
                                                exerciseId: found.id,
                                                name: found.name,
                                                sets: Array.from(
                                                    { length: 2 },
                                                    () => ({
                                                        weight: null,
                                                        reps: null,
                                                        rir: 2,
                                                        done: false,
                                                    }),
                                                ),
                                                notes: "",
                                            },
                                        ],
                                    }));
                                }}
                            >
                                <Plus size={14} /> Add exercise
                            </button>
                            <button
                                className="finish-btn"
                                onClick={finishWorkout}
                            >
                                <Check size={16} /> Finish workout
                            </button>
                        </div>
                        <div className="logger-progress">
                            <span>
                                {active.exercises.reduce(
                                    (a, e) =>
                                        a + e.sets.filter((s) => s.done).length,
                                    0,
                                )}{" "}
                                /{" "}
                                {active.exercises.reduce(
                                    (a, e) => a + e.sets.length,
                                    0,
                                )}{" "}
                                sets completed
                            </span>
                            <div>
                                <i
                                    style={{
                                        width: `${
                                            (100 *
                                                active.exercises.reduce(
                                                    (a, e) =>
                                                        a +
                                                        e.sets.filter(
                                                            (s) => s.done,
                                                        ).length,
                                                    0,
                                                )) /
                                            Math.max(
                                                1,
                                                active.exercises.reduce(
                                                    (a, e) => a + e.sets.length,
                                                    0,
                                                ),
                                            )
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="logger-list">
                            {active.exercises.map((e, ei) => (
                                <div
                                    className="panel logger-exercise"
                                    key={e.exerciseId}
                                >
                                    <div className="logger-ex-head">
                                        <div>
                                            <span className="eyebrow">
                                                EXERCISE{" "}
                                                {String(ei + 1).padStart(
                                                    2,
                                                    "0",
                                                )}
                                            </span>
                                            <h3>{e.name}</h3>
                                            <small>
                                                {exercises
                                                    .find(
                                                        (x) =>
                                                            x.id ===
                                                            e.exerciseId,
                                                    )
                                                    ?.primaryMuscles.join(
                                                        " · ",
                                                    ) || "Custom movement"}
                                            </small>
                                        </div>
                                        <div className="logger-head-actions">
                                            <button
                                                className="mini-icon"
                                                disabled={ei === 0}
                                                onClick={() =>
                                                    updateActive((s) => {
                                                        const a = [
                                                            ...s.exercises,
                                                        ];
                                                        [a[ei - 1], a[ei]] = [
                                                            a[ei],
                                                            a[ei - 1],
                                                        ];
                                                        return {
                                                            ...s,
                                                            exercises: a,
                                                        };
                                                    })
                                                }
                                                aria-label="Move exercise up"
                                            >
                                                <ArrowUp size={13} />
                                            </button>
                                            <button
                                                className="mini-icon"
                                                disabled={
                                                    ei ===
                                                    active.exercises.length - 1
                                                }
                                                onClick={() =>
                                                    updateActive((s) => {
                                                        const a = [
                                                            ...s.exercises,
                                                        ];
                                                        [a[ei + 1], a[ei]] = [
                                                            a[ei],
                                                            a[ei + 1],
                                                        ];
                                                        return {
                                                            ...s,
                                                            exercises: a,
                                                        };
                                                    })
                                                }
                                                aria-label="Move exercise down"
                                            >
                                                <ArrowDown size={13} />
                                            </button>
                                            <button
                                                className="text-btn"
                                                onClick={() => {
                                                    const found =
                                                        exercises.find(
                                                            (x) =>
                                                                x.id ===
                                                                e.exerciseId,
                                                        );
                                                    if (found) {
                                                        setSelected(found);
                                                        setDetailReturn(
                                                            "logger",
                                                        );
                                                        setPage("detail");
                                                    }
                                                }}
                                            >
                                                Technique{" "}
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="set-table">
                                        <div className="set-head">
                                            <span>SET</span>
                                            <span>KG</span>
                                            <span>REPS</span>
                                            <span>RIR</span>
                                            <span>DONE</span>
                                        </div>
                                        {e.sets.map((s, si) => (
                                            <div
                                                className={`set-row ${s.done ? "set-done" : ""}`}
                                                key={si}
                                            >
                                                <b>{si + 1}</b>
                                                <input
                                                    aria-label="Weight kg"
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    placeholder="—"
                                                    value={s.weight ?? ""}
                                                    onChange={(x) =>
                                                        updateSet(ei, si, {
                                                            weight:
                                                                x.target
                                                                    .value ===
                                                                ""
                                                                    ? null
                                                                    : Number(
                                                                          x
                                                                              .target
                                                                              .value,
                                                                      ),
                                                        })
                                                    }
                                                />
                                                <input
                                                    aria-label="Reps"
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    placeholder="—"
                                                    value={s.reps ?? ""}
                                                    onChange={(x) =>
                                                        updateSet(ei, si, {
                                                            reps:
                                                                x.target
                                                                    .value ===
                                                                ""
                                                                    ? null
                                                                    : Number(
                                                                          x
                                                                              .target
                                                                              .value,
                                                                      ),
                                                        })
                                                    }
                                                />
                                                <select
                                                    aria-label="Reps in reserve"
                                                    value={s.rir ?? 2}
                                                    onChange={(x) =>
                                                        updateSet(ei, si, {
                                                            rir: Number(
                                                                x.target.value,
                                                            ),
                                                        })
                                                    }
                                                >
                                                    {[0, 1, 2, 3, 4, 5].map(
                                                        (n) => (
                                                            <option
                                                                key={n}
                                                                value={n}
                                                            >
                                                                {n}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <button
                                                    className={`check-set ${s.done ? "checked" : ""}`}
                                                    onClick={() =>
                                                        updateSet(ei, si, {
                                                            done: !s.done,
                                                        })
                                                    }
                                                >
                                                    {s.done ? (
                                                        <Check size={15} />
                                                    ) : null}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="logger-actions">
                                        <button
                                            className="text-btn"
                                            onClick={() =>
                                                updateActive((s) => ({
                                                    ...s,
                                                    exercises: s.exercises.map(
                                                        (x, i) =>
                                                            i === ei
                                                                ? {
                                                                      ...x,
                                                                      sets: [
                                                                          ...x.sets,
                                                                          {
                                                                              weight: null,
                                                                              reps: null,
                                                                              rir: 2,
                                                                              done: false,
                                                                          },
                                                                      ],
                                                                  }
                                                                : x,
                                                    ),
                                                }))
                                            }
                                        >
                                            <Plus size={14} /> Add set
                                        </button>
                                        <button
                                            className="text-btn"
                                            onClick={() => setRest(90)}
                                        >
                                            <Timer size={14} /> Rest 90 sec
                                        </button>
                                        <button
                                            className="text-btn"
                                            onClick={() =>
                                                updateActive((s) => ({
                                                    ...s,
                                                    exercises:
                                                        s.exercises.filter(
                                                            (_, i) => i !== ei,
                                                        ),
                                                }))
                                            }
                                        >
                                            <Trash2 size={14} /> Remove
                                        </button>
                                        <button
                                            className="text-btn"
                                            onClick={() =>
                                                updateActive((s) => ({
                                                    ...s,
                                                    exercises: s.exercises.map(
                                                        (x, i) =>
                                                            i === ei
                                                                ? {
                                                                      ...x,
                                                                      notes:
                                                                          prompt(
                                                                              "Exercise note",
                                                                              x.notes,
                                                                          ) ||
                                                                          "",
                                                                  }
                                                                : x,
                                                    ),
                                                }))
                                            }
                                        >
                                            Add note
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {rest > 0 && (
                            <div className="rest-banner">
                                <Timer size={16} /> Rest timer ·{" "}
                                {String(Math.floor(rest / 60)).padStart(2, "0")}
                                :{String(rest % 60).padStart(2, "0")}{" "}
                                <button onClick={() => setRest(0)}>
                                    Dismiss
                                </button>
                            </div>
                        )}
                        <div className="panel workout-notes">
                            <label>Workout notes</label>
                            <textarea
                                value={active.notes}
                                onChange={(e) =>
                                    updateActive((s) => ({
                                        ...s,
                                        notes: e.target.value,
                                    }))
                                }
                                placeholder="Energy, technique, fatigue, or anything worth tracking..."
                            />
                            <button
                                className="secondary-btn"
                                onClick={saveCurrent}
                            >
                                Save progress
                            </button>
                        </div>
                    </section>
                )}
                {page === "history" && (
                    <section className="content">
                        <div className="page-heading">
                            <div>
                                <div className="eyebrow">SESSION ARCHIVE</div>
                                <h1>
                                    Workout <em>history.</em>
                                </h1>
                                <p>
                                    Riwayat sesi yang tersimpan di perangkat
                                    ini.
                                </p>
                            </div>
                        </div>
                        {completed.length === 0 ? (
                            <Empty
                                icon={Activity}
                                title="No workout history"
                                text="Selesaikan workout pertama untuk mulai membangun histori performa."
                                action="Go to planner"
                                onClick={() => setPage("planner")}
                            />
                        ) : (
                            <div className="history-list">
                                {completed.map((s) => (
                                    <div
                                        className="panel history-card"
                                        key={s.id}
                                    >
                                        <div
                                            className={`recent-icon ${s.split.toLowerCase()}`}
                                        >
                                            <Dumbbell size={18} />
                                        </div>
                                        <div className="history-main">
                                            <b>{s.templateName}</b>
                                            <small>
                                                {new Date(
                                                    s.date + "T12:00:00",
                                                ).toLocaleDateString("id-ID", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </small>
                                            <div className="history-exercises">
                                                {s.exercises
                                                    .map((e) => e.name)
                                                    .join(" · ")}
                                            </div>
                                        </div>
                                        <div className="history-metric">
                                            <b>
                                                {s.exercises.reduce(
                                                    (a, e) =>
                                                        a +
                                                        e.sets.filter(
                                                            (x) => x.done,
                                                        ).length,
                                                    0,
                                                )}
                                            </b>
                                            <small>SETS</small>
                                        </div>
                                        <button
                                            className="icon-btn danger"
                                            onClick={async () => {
                                                if (
                                                    confirm(
                                                        "Hapus workout ini?",
                                                    )
                                                ) {
                                                    await deleteSession(s.id);
                                                    await refresh();
                                                }
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
                {page === "analytics" && (
                    <section className="content">
                        <div className="page-heading">
                            <div>
                                <div className="eyebrow">PERFORMANCE DATA</div>
                                <h1>
                                    Progress <em>analytics.</em>
                                </h1>
                                <p>
                                    Grafik hanya menampilkan data workout yang
                                    benar-benar dicatat.
                                </p>
                            </div>
                        </div>
                        <div className="stat-grid">
                            <Stat
                                icon={Trophy}
                                label="SESSIONS LOGGED"
                                value={completed.length}
                                suffix="total"
                            />
                            <Stat
                                icon={Activity}
                                label="TOTAL WORKING SETS"
                                value={completed.reduce(
                                    (a, s) =>
                                        a +
                                        s.exercises.reduce(
                                            (b, e) =>
                                                b +
                                                e.sets.filter((x) => x.done)
                                                    .length,
                                            0,
                                        ),
                                    0,
                                )}
                                suffix="sets"
                            />
                            <Stat
                                icon={Weight}
                                label="BODY WEIGHT ENTRIES"
                                value={measurements.length}
                                suffix="records"
                            />
                            <Stat
                                icon={Flame}
                                label="WEEKLY WORKOUTS"
                                value={thisWeek.length}
                                suffix="sessions"
                            />
                        </div>
                        <div className="analytics-grid">
                            <div className="panel chart-panel">
                                <div className="panel-head">
                                    <div>
                                        <div className="eyebrow">
                                            TRAINING FREQUENCY
                                        </div>
                                        <h2>Last 7 days</h2>
                                    </div>
                                </div>
                                {completed.length ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={230}
                                    >
                                        <BarChart data={weekData}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="var(--border)"
                                            />
                                            <XAxis
                                                dataKey="day"
                                                tick={{
                                                    fill: "var(--muted)",
                                                    fontSize: 12,
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tick={{
                                                    fill: "var(--muted)",
                                                    fontSize: 12,
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: "var(--panel)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: 10,
                                                }}
                                            />
                                            <Bar
                                                dataKey="workouts"
                                                name="Workouts"
                                                fill="#a3e635"
                                                radius={[5, 5, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmpty />
                                )}
                            </div>
                            <div className="panel chart-panel">
                                <div className="panel-head">
                                    <div>
                                        <div className="eyebrow">
                                            BODY COMPOSITION
                                        </div>
                                        <h2>Body weight</h2>
                                    </div>
                                </div>
                                {measurements.length > 1 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={230}
                                    >
                                        <LineChart
                                            data={measurements
                                                .slice()
                                                .sort((a, b) =>
                                                    a.date.localeCompare(
                                                        b.date,
                                                    ),
                                                )}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="var(--border)"
                                            />
                                            <XAxis
                                                dataKey="date"
                                                tick={{
                                                    fill: "var(--muted)",
                                                    fontSize: 11,
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                domain={[
                                                    "dataMin - 1",
                                                    "dataMax + 1",
                                                ]}
                                                tick={{
                                                    fill: "var(--muted)",
                                                    fontSize: 11,
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: "var(--panel)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: 10,
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="weight"
                                                name="Weight (kg)"
                                                stroke="#a3e635"
                                                strokeWidth={2.5}
                                                dot={{ r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmpty text="Tambahkan minimal dua catatan berat badan untuk melihat tren." />
                                )}
                            </div>
                            <div className="panel chart-panel wide">
                                <div className="panel-head">
                                    <div>
                                        <div className="eyebrow">
                                            EXERCISE PERFORMANCE
                                        </div>
                                        <h2>Load progression</h2>
                                    </div>
                                </div>
                                {strengthData.length ? (
                                    <div className="strength-rows">
                                        {Array.from(
                                            new Set(
                                                strengthData.map(
                                                    (x) => x.exercise,
                                                ),
                                            ),
                                        ).map((name) => {
                                            const rows = strengthData.filter(
                                                (x) => x.exercise === name,
                                            );
                                            return (
                                                <div
                                                    className="strength-row"
                                                    key={name}
                                                >
                                                    <span>{name}</span>
                                                    <b>
                                                        {Math.max(
                                                            ...rows.map(
                                                                (x) => x.weight,
                                                            ),
                                                        )}{" "}
                                                        kg
                                                    </b>
                                                    <small>
                                                        {rows.length} logged
                                                        sets
                                                    </small>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <ChartEmpty text="Catat beban dan reps pada set yang diselesaikan untuk melihat perkembangan." />
                                )}
                            </div>
                        </div>
                        <div className="panel bodyweight-panel">
                            <div>
                                <div className="eyebrow">BODY METRICS</div>
                                <h2>Log body weight</h2>
                                <p className="subtle">
                                    Catat pada kondisi yang konsisten untuk
                                    membandingkan tren.
                                </p>
                            </div>
                            <div className="weight-entry">
                                <input
                                    type="number"
                                    min="20"
                                    max="400"
                                    step="0.1"
                                    placeholder="kg"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                />
                                <button
                                    className="primary-btn small"
                                    onClick={addBodyWeight}
                                >
                                    <Plus size={14} /> Add entry
                                </button>
                            </div>
                        </div>
                    </section>
                )}
                {page === "settings" && (
                    <section className="content">
                        <div className="page-heading">
                            <div>
                                <div className="eyebrow">
                                    PREFERENCES & DATA
                                </div>
                                <h1>
                                    Your <em>settings.</em>
                                </h1>
                                <p>
                                    Profil latihan dan pengelolaan data lokal.
                                </p>
                            </div>
                        </div>
                        <div className="settings-grid">
                            <div className="panel settings-card">
                                <div className="eyebrow">PERSONAL PROFILE</div>
                                <h2>Training profile</h2>
                                <label className="field-label">
                                    Display name
                                </label>
                                <input
                                    className="full-input"
                                    value={profile.name}
                                    placeholder="Your name"
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            name: e.target.value,
                                        })
                                    }
                                />
                                <label className="field-label">
                                    Primary goal
                                </label>
                                <select
                                    className="full-input"
                                    value={profile.goal}
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            goal: e.target.value,
                                        })
                                    }
                                >
                                    <option>Body recomposition</option>
                                    <option>Muscle hypertrophy</option>
                                    <option>Strength</option>
                                    <option>General fitness</option>
                                </select>
                                <label className="field-label">
                                    Weekly workout target
                                </label>
                                <select
                                    className="full-input"
                                    value={profile.weeklyTarget}
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            weeklyTarget: Number(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                >
                                    {[3, 4, 5, 6].map((n) => (
                                        <option value={n} key={n}>
                                            {n} sessions / week
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="primary-btn"
                                    onClick={async () => {
                                        await saveSetting("profile", profile);
                                        setNotice("Profile settings saved.");
                                    }}
                                >
                                    Save profile
                                </button>
                            </div>
                            <div className="panel settings-card">
                                <div className="eyebrow">APPEARANCE</div>
                                <h2>Interface</h2>
                                <div className="setting-row">
                                    <div>
                                        <b>Dark mode</b>
                                        <small>
                                            Optimized for low-light gym
                                            environments
                                        </small>
                                    </div>
                                    <button
                                        className={`toggle ${dark ? "on" : ""}`}
                                        onClick={() => setDark(!dark)}
                                    >
                                        <i />
                                    </button>
                                </div>
                                <div className="divider" />
                                <div className="eyebrow">DATA MANAGEMENT</div>
                                <h2>Backup & restore</h2>
                                <p className="subtle">
                                    Export workout sessions, body weight
                                    entries, and profile as JSON. Keep a copy
                                    outside this browser.
                                </p>
                                <button
                                    className="secondary-btn full"
                                    onClick={exportData}
                                >
                                    <Download size={16} /> Export data backup
                                </button>
                                <label className="secondary-btn full file-label">
                                    <FileUp size={16} /> Import backup
                                    <input
                                        type="file"
                                        accept="application/json,.json"
                                        onChange={(e) =>
                                            e.target.files?.[0] &&
                                            importData(e.target.files[0])
                                        }
                                    />
                                </label>
                                <div className="storage-note">
                                    <span className="live-dot" /> IndexedDB ·
                                    Local device storage
                                </div>
                            </div>
                        </div>
                        <div className="panel about-panel">
                            <div>
                                <b>PPL Training Library</b>
                                <small>Version 1.0.0 · Schema v1</small>
                            </div>
                            <span>Built for consistent training.</span>
                        </div>
                    </section>
                )}
                <footer className="footer">
                    PPL TRAINING LIBRARY <span>·</span> LOCAL-FIRST TRAINING
                    JOURNAL
                </footer>
            </main>
            <nav className="bottom-nav">
                {nav.map((n) => (
                    <button
                        key={n.id}
                        className={page === n.id ? "active" : ""}
                        onClick={() => setPage(n.id as Page)}
                    >
                        <n.icon size={19} />
                        <span>{n.label}</span>
                    </button>
                ))}
                <button
                    className={page === "settings" ? "active" : ""}
                    onClick={() => setPage("settings")}
                >
                    <Settings size={19} />
                    <span>Settings</span>
                </button>
            </nav>
            {notice && (
                <div className="toast">
                    <Check size={16} />
                    {notice}
                </div>
            )}
        </div>
    );
}
function Stat({ icon: Icon, label, value, suffix, tone = "" }: any) {
    return (
        <div className="panel stat-card">
            <div className={`stat-icon ${tone}`}>
                <Icon size={18} />
            </div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">
                {value}
                <small>{suffix}</small>
            </div>
        </div>
    );
}
function Empty({ icon: Icon, title, text, action, onClick }: any) {
    return (
        <div className="empty-state">
            <div className="empty-icon">
                <Icon size={23} />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
            {action && (
                <button className="secondary-btn" onClick={onClick}>
                    {action}
                    <ChevronRight size={15} />
                </button>
            )}
        </div>
    );
}
function ChartEmpty({
    text = "Belum ada data yang cukup untuk membuat grafik.",
}: any) {
    return (
        <div className="chart-empty">
            <BarChart3 size={27} />
            <p>{text}</p>
        </div>
    );
}
export default App;
