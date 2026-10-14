'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  DataTable,
  ConfirmDialog,
  slugColumn,
  statusColumn,
  dateColumn,
  actionButtons,
} from '@/components/admin-crud';
import type { ColumnDef } from '@/components/admin-crud';
import { useAdminResource } from '@/components/admin-crud/useAdminResource';
import {
  useAdminLessons,
  useAdminLesson,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useGradeOptions,
  useTopicOptions,
  usePeriodOptions,
  useCharacterOptions,
  useEventOptions,
} from '@/features/admin/hooks';
import type {
  Lesson,
  CreateLessonPayload,
  UpdateLessonPayload,
  Difficulty,
  LessonStatus,
  GradeOption,
  TaxonomyOption,
} from '@/features/admin/api';
import { BlockEditor } from '@/components/content/BlockEditor';
import type { ContentBlock } from '@/components/content/BlockEditor';

// ─── Helpers ────────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  EASY: { bg: 'rgb(16 185 129 / 0.1)', text: '#059669', border: 'rgb(16 185 129 / 0.2)' },
  MEDIUM: { bg: 'rgb(245 158 11 / 0.1)', text: '#d97706', border: 'rgb(245 158 11 / 0.2)' },
  HARD: { bg: 'rgb(239 68 68 / 0.1)', text: '#dc2626', border: 'rgb(239 68 68 / 0.2)' },
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = DIFFICULTY_COLORS[difficulty] ?? DIFFICULTY_COLORS.EASY;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.15rem 0.55rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {difficulty === 'EASY' && '🟢'}
      {difficulty === 'MEDIUM' && '🟡'}
      {difficulty === 'HARD' && '🔴'}
      {DIFFICULTY_LABELS[difficulty] ?? difficulty}
    </span>
  );
}

// ─── Column definitions ────────────────────────────────────────

const lessonTitleColumn: ColumnDef<Lesson> = {
  key: 'title',
  header: 'Bài học',
  render: (item) => (
    <div style={{ maxWidth: 300 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {item.thumbnail && (
          <img
            src={item.thumbnail}
            alt=""
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        )}
        <div>
          <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{item.title}</div>
          {item.summary && (
            <div
              style={{
                color: 'var(--muted)',
                fontSize: '0.8rem',
                marginTop: '0.1rem',
                maxWidth: 240,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.summary}
            </div>
          )}
        </div>
      </div>
    </div>
  ),
};

const difficultyColumn: ColumnDef<Lesson> = {
  key: 'difficulty',
  header: 'Độ khó',
  render: (item) => <DifficultyBadge difficulty={item.difficulty} />,
};

const gradeTagsColumn: ColumnDef<Lesson> = {
  key: 'grades',
  header: 'Lớp',
  render: (item) => (
    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
      {item.grades.length > 0 ? (
        item.grades.slice(0, 3).map((g) => (
          <span
            key={g.gradeId}
            style={{
              padding: '0.1rem 0.4rem',
              borderRadius: 4,
              background: 'var(--surface-2)',
              fontSize: '0.75rem',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {g.grade.code || g.grade.name}
          </span>
        ))
      ) : (
        <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>—</span>
      )}
      {item.grades.length > 3 && (
        <span
          style={{
            padding: '0.1rem 0.4rem',
            borderRadius: 4,
            background: 'var(--surface-2)',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--muted)',
          }}
        >
          +{item.grades.length - 3}
        </span>
      )}
    </div>
  ),
};

const timeColumn: ColumnDef<Lesson> = {
  key: 'estimatedTime',
  header: 'Thời gian',
  nowrap: true,
  render: (item) => (
    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>⏱ {item.estimatedTime} phút</span>
  ),
};

const columns: ColumnDef<Lesson>[] = [
  lessonTitleColumn,
  slugColumn<Lesson>(),
  difficultyColumn,
  gradeTagsColumn,
  timeColumn,
  statusColumn<Lesson>(),
  dateColumn<Lesson>(),
];

// ─── Multi-select checkbox component ───────────────────────────

interface MultiCheckboxProps {
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  isLoading?: boolean;
}

function MultiCheckbox({ label, options, selected, onChange, isLoading }: MultiCheckboxProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleItem = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div>
      <label className="label" style={{ marginBottom: '0.35rem' }}>
        {label}
      </label>
      {isLoading ? (
        <div style={{ padding: '0.75rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
          Đang tải...
        </div>
      ) : (
        <>
          {options.length > 6 && (
            <input
              className="input"
              placeholder={`Tìm ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}
            />
          )}
          <div
            style={{
              maxHeight: 160,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.25rem',
            }}
          >
            {filtered.length === 0 && (
              <div
                style={{
                  padding: '0.5rem',
                  color: 'var(--muted)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                Không tìm thấy
              </div>
            )}
            {filtered.map((opt) => (
              <label
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.5rem',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'background 0.1s',
                  background: selected.includes(opt.id)
                    ? 'var(--brand-50, rgb(99 102 241 / 0.08))'
                    : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={() => toggleItem(opt.id)}
                  style={{ accentColor: 'var(--brand-500)' }}
                />
                <span>{opt.name}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Đã chọn: {selected.length}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Characters with roles multi-select ────────────────────────

interface CharacterWithRole {
  characterId: string;
  role: string;
}

interface CharacterMultiSelectProps {
  options: TaxonomyOption[];
  selected: CharacterWithRole[];
  onChange: (selected: CharacterWithRole[]) => void;
  isLoading?: boolean;
}

function CharacterMultiSelect({
  options,
  selected,
  onChange,
  isLoading,
}: CharacterMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedIds = selected.map((s) => s.characterId);

  const toggleCharacter = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selected.filter((s) => s.characterId !== id));
    } else {
      onChange([...selected, { characterId: id, role: '' }]);
    }
  };

  const updateRole = (characterId: string, role: string) => {
    onChange(selected.map((s) => (s.characterId === characterId ? { ...s, role } : s)));
  };

  return (
    <div>
      <label className="label" style={{ marginBottom: '0.35rem' }}>
        Nhân vật liên quan
      </label>
      {isLoading ? (
        <div style={{ padding: '0.75rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
          Đang tải...
        </div>
      ) : (
        <>
          {options.length > 6 && (
            <input
              className="input"
              placeholder="Tìm nhân vật..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}
            />
          )}
          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.25rem',
            }}
          >
            {filtered.length === 0 && (
              <div
                style={{
                  padding: '0.5rem',
                  color: 'var(--muted)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                Không tìm thấy
              </div>
            )}
            {filtered.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              const entry = selected.find((s) => s.characterId === opt.id);
              return (
                <div
                  key={opt.id}
                  style={{
                    padding: '0.35rem 0.5rem',
                    borderRadius: 4,
                    background: isSelected
                      ? 'var(--brand-50, rgb(99 102 241 / 0.08))'
                      : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCharacter(opt.id)}
                      style={{ accentColor: 'var(--brand-500)' }}
                    />
                    <span>{opt.name}</span>
                  </label>
                  {isSelected && (
                    <input
                      className="input"
                      placeholder="Vai trò (tuỳ chọn)"
                      value={entry?.role ?? ''}
                      onChange={(e) => updateRole(opt.id, e.target.value)}
                      style={{
                        marginTop: '0.25rem',
                        marginLeft: '1.5rem',
                        fontSize: '0.8rem',
                        padding: '0.25rem 0.5rem',
                        width: 'calc(100% - 1.5rem)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Đã chọn: {selected.length} nhân vật
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Lesson Form Dialog ────────────────────────────────────────

interface LessonFormProps {
  open: boolean;
  lesson: Lesson | null;
  isPending: boolean;
  onSubmit: (data: CreateLessonPayload | UpdateLessonPayload) => void | Promise<void>;
  onClose: () => void;
}

function LessonForm({ open, lesson, isPending, onSubmit, onClose }: LessonFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'meta' | 'relations'>('basic');

  // Fetch relation options
  const { data: gradeOptions = [], isLoading: gradesLoading } = useGradeOptions();
  const { data: topicOptions = [], isLoading: topicsLoading } = useTopicOptions();
  const { data: periodOptions = [], isLoading: periodsLoading } = usePeriodOptions();
  const { data: characterOptions = [], isLoading: charsLoading } = useCharacterOptions();
  const { data: eventOptions = [], isLoading: eventsLoading } = useEventOptions();

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [estimatedTime, setEstimatedTime] = useState('10');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [status, setStatus] = useState<LessonStatus>('DRAFT');
  const [gradeIds, setGradeIds] = useState<string[]>([]);
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [periodIds, setPeriodIds] = useState<string[]>([]);
  const [characters, setCharacters] = useState<CharacterWithRole[]>([]);
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Block editor state
  const [contentMode, setContentMode] = useState<'html' | 'blocks'>('html');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  // Initialize from lesson when editing
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (open) {
      if (lesson) {
        setTitle(lesson.title);
        setSlug(lesson.slug);
        setSummary(lesson.summary ?? '');
        setContent(lesson.content);
        setThumbnail(lesson.thumbnail ?? '');
        setDifficulty(lesson.difficulty);
        setEstimatedTime(String(lesson.estimatedTime));
        setDisplayOrder(String(lesson.displayOrder));
        setStatus(lesson.status);
        setGradeIds(lesson.grades.map((g) => g.gradeId));
        setTopicIds(lesson.topics.map((t) => t.topicId));
        setPeriodIds(lesson.periods.map((p) => p.periodId));
        setCharacters(
          lesson.characters.map((c) => ({ characterId: c.characterId, role: c.role ?? '' })),
        );
        setEventIds(lesson.events.map((e) => e.eventId));
        // Restore contentJson blocks if present
        // contentJson shape on server: { version: 1, blocks: [...] }
        const cj = lesson.contentJson;
        const cjBlocks = cj?.blocks;
        if (Array.isArray(cjBlocks) && cjBlocks.length > 0) {
          setContentMode('blocks');
          setBlocks(cjBlocks as ContentBlock[]);
        } else {
          setContentMode('html');
          setBlocks([]);
        }
      } else {
        setTitle('');
        setSlug('');
        setSummary('');
        setContent('');
        setThumbnail('');
        setDifficulty('EASY');
        setEstimatedTime('10');
        setDisplayOrder('0');
        setStatus('DRAFT');
        setGradeIds([]);
        setTopicIds([]);
        setPeriodIds([]);
        setCharacters([]);
        setEventIds([]);
        setContentMode('html');
        setBlocks([]);
      }
      setActiveTab('basic');
      setErrors({});
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open, lesson]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Tiêu đề không được để trống';
    if (title.trim().length < 5) errs.title = 'Tiêu đề tối thiểu 5 ký tự';
    if (contentMode === 'html' && !content.trim()) errs.content = 'Nội dung không được để trống';

    // Validate blocks when in block mode
    if (contentMode === 'blocks') {
      if (blocks.length === 0) {
        errs.content = 'Cần ít nhất 1 block nội dung';
      } else {
        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i];
          if (b.type === 'text' && !b.text.trim()) {
            errs.content = `Block văn bản ${i + 1}: nội dung không được để trống`;
            break;
          }
          if (b.type === 'image') {
            if (!b.url) {
              errs.content = `Block hình ảnh ${i + 1}: chưa upload ảnh`;
              break;
            }
            if (!b.alt.trim()) {
              errs.content = `Block hình ảnh ${i + 1}: Alt text không được để trống`;
              break;
            }
          }
          if (b.type === 'audio' && !b.url) {
            errs.content = `Block âm thanh ${i + 1}: chưa upload file âm thanh`;
            break;
          }
          if (b.type === 'video' && !b.youtubeId) {
            errs.content = `Block video ${i + 1}: chưa nhập YouTube ID hợp lệ`;
            break;
          }
        }
      }
    }

    if (estimatedTime && isNaN(Number(estimatedTime))) errs.estimatedTime = 'Phải là số';
    if (displayOrder && isNaN(Number(displayOrder))) errs.displayOrder = 'Phải là số';
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Switch to the tab that has the first error
      if (errs.title || errs.content) setActiveTab('basic');
      else if (errs.estimatedTime || errs.displayOrder) setActiveTab('meta');
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const dto: CreateLessonPayload = {
      title: title.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      summary: summary.trim() || null,
      content: contentMode === 'html' ? content : '',
      // contentJson must be { version: 1, blocks: [...] } to match ContentJsonSchema
      ...(contentMode === 'blocks' && blocks.length > 0
        ? { contentJson: { version: 1 as const, blocks: blocks as unknown[] } }
        : {}),

      thumbnail: thumbnail.trim() || null,
      difficulty,
      estimatedTime: Number(estimatedTime) || 10,
      displayOrder: Number(displayOrder) || 0,
      status,
      gradeIds,
      topicIds,
      periodIds,
      characters: characters
        .filter((c) => c.characterId)
        .map((c) => ({ characterId: c.characterId, role: c.role || null })),
      eventIds,
    };

    await onSubmit(dto);
  };

  if (!open) return null;

  const tabs: { key: typeof activeTab; label: string; icon: string }[] = [
    { key: 'basic', label: 'Cơ bản', icon: '📝' },
    { key: 'meta', label: 'Thông tin', icon: '⚙️' },
    { key: 'relations', label: 'Liên kết', icon: '🔗' },
  ];

  return (
    <dialog
      ref={dialogRef}
      style={{
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        padding: 0,
        background: 'transparent',
        maxWidth: 720,
        width: '95vw',
        position: 'fixed',
        margin: 0,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
            {lesson ? '✏️ Sửa bài học' : '➕ Thêm bài học'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: 'var(--muted)',
              lineHeight: 1,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0',
            borderBottom: '1px solid var(--border)',
            padding: '0 1.5rem',
            flexShrink: 0,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.6rem 1rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? 'var(--brand-600)' : 'var(--muted)',
                background: 'none',
                borderBottom:
                  activeTab === tab.key ? '2px solid var(--brand-500)' : '2px solid transparent',
                transition: 'all 0.15s ease',
                marginBottom: '-1px',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {/* === TAB: Basic === */}
            {activeTab === 'basic' && (
              <>
                {/* Title */}
                <div>
                  <label className="label" htmlFor="lesson-title">
                    Tiêu đề <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    id="lesson-title"
                    className={`input${errors.title ? 'error' : ''}`}
                    placeholder="Ví dụ: Chiến thắng Bạch Đằng năm 938"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.title;
                        return n;
                      });
                    }}
                  />
                  {errors.title && <p className="field-error">{errors.title}</p>}
                </div>

                {/* Slug */}
                <div>
                  <label className="label" htmlFor="lesson-slug">
                    Slug{' '}
                    <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.8rem' }}>
                      (để trống = tự động)
                    </span>
                  </label>
                  <input
                    id="lesson-slug"
                    className="input"
                    placeholder="chien-thang-bach-dang-938"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="label" htmlFor="lesson-summary">
                    Tóm tắt
                  </label>
                  <textarea
                    id="lesson-summary"
                    className="input"
                    rows={2}
                    placeholder="Mô tả ngắn gọn nội dung bài học..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    style={{ resize: 'vertical', minHeight: 60 }}
                  />
                </div>

                {/* Content */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <label className="label" style={{ margin: 0 }}>
                      Nội dung <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => setContentMode('html')}
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          background:
                            contentMode === 'html' ? 'var(--brand-500)' : 'var(--surface-2)',
                          color: contentMode === 'html' ? '#fff' : 'var(--muted)',
                        }}
                      >
                        HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => setContentMode('blocks')}
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          background:
                            contentMode === 'blocks' ? 'var(--brand-500)' : 'var(--surface-2)',
                          color: contentMode === 'blocks' ? '#fff' : 'var(--muted)',
                        }}
                      >
                        🧱 Block Editor
                      </button>
                    </div>
                  </div>

                  {contentMode === 'html' ? (
                    <>
                      <textarea
                        id="lesson-content"
                        className={`input${errors.content ? 'error' : ''}`}
                        rows={8}
                        placeholder="Nội dung bài học (HTML)..."
                        value={content}
                        onChange={(e) => {
                          setContent(e.target.value);
                          setErrors((prev) => {
                            const n = { ...prev };
                            delete n.content;
                            return n;
                          });
                        }}
                        style={{
                          resize: 'vertical',
                          minHeight: 120,
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                        }}
                      />
                      {errors.content && <p className="field-error">{errors.content}</p>}
                      <div
                        style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}
                      >
                        Hỗ trợ HTML (sẽ được sanitize)
                      </div>
                    </>
                  ) : (
                    <>
                      <BlockEditor
                        value={blocks}
                        onChange={(b) => {
                          setBlocks(b);
                          setErrors((prev) => {
                            const n = { ...prev };
                            delete n.content;
                            return n;
                          });
                        }}
                      />
                      {errors.content && (
                        <p
                          style={{
                            color: 'var(--error)',
                            fontSize: '0.8rem',
                            marginTop: '0.35rem',
                            fontWeight: 500,
                          }}
                        >
                          ⚠️ {errors.content}
                        </p>
                      )}
                      <div
                        style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.35rem' }}
                      >
                        Drag-drop blocks · Upload Cloudinary · YouTube ID tự động trích xuất
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="label" htmlFor="lesson-thumbnail">
                    URL Ảnh bìa
                  </label>
                  <input
                    id="lesson-thumbnail"
                    className="input"
                    type="url"
                    placeholder="https://example.com/thumbnail.jpg"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                  />
                  {thumbnail && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img
                        src={thumbnail}
                        alt="Thumbnail preview"
                        style={{
                          maxWidth: 160,
                          maxHeight: 90,
                          borderRadius: 6,
                          objectFit: 'cover',
                          border: '1px solid var(--border)',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* === TAB: Meta === */}
            {activeTab === 'meta' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {/* Difficulty */}
                  <div>
                    <label className="label" htmlFor="lesson-difficulty">
                      Độ khó
                    </label>
                    <select
                      id="lesson-difficulty"
                      className="input"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    >
                      <option value="EASY">🟢 Dễ</option>
                      <option value="MEDIUM">🟡 Trung bình</option>
                      <option value="HARD">🔴 Khó</option>
                    </select>
                  </div>

                  {/* Estimated Time */}
                  <div>
                    <label className="label" htmlFor="lesson-time">
                      Thời gian (phút)
                    </label>
                    <input
                      id="lesson-time"
                      className={`input${errors.estimatedTime ? 'error' : ''}`}
                      type="number"
                      min={1}
                      max={180}
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                    />
                    {errors.estimatedTime && <p className="field-error">{errors.estimatedTime}</p>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {/* Display Order */}
                  <div>
                    <label className="label" htmlFor="lesson-order">
                      Thứ tự hiển thị
                    </label>
                    <input
                      id="lesson-order"
                      className={`input${errors.displayOrder ? 'error' : ''}`}
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(e.target.value)}
                    />
                    {errors.displayOrder && <p className="field-error">{errors.displayOrder}</p>}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="label" htmlFor="lesson-status">
                      Trạng thái
                    </label>
                    <select
                      id="lesson-status"
                      className="input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as LessonStatus)}
                    >
                      <option value="DRAFT">📝 Nháp</option>
                      <option value="PUBLISHED">📢 Xuất bản</option>
                      <option value="ARCHIVED">📦 Lưu trữ</option>
                    </select>
                  </div>
                </div>

                {/* Status info */}
                {status === 'PUBLISHED' && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgb(59 130 246 / 0.08)',
                      border: '1px solid rgb(59 130 246 / 0.2)',
                      fontSize: '0.85rem',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>ℹ️</span>
                    <span>Để xuất bản, bài học cần có tiêu đề, nội dung và ít nhất 1 lớp.</span>
                  </div>
                )}
              </>
            )}

            {/* === TAB: Relations === */}
            {activeTab === 'relations' && (
              <>
                <MultiCheckbox
                  label="Lớp học"
                  options={(gradeOptions as GradeOption[]).map((g) => ({
                    id: g.id,
                    name: `${g.name} (${g.code})`,
                  }))}
                  selected={gradeIds}
                  onChange={setGradeIds}
                  isLoading={gradesLoading}
                />

                <MultiCheckbox
                  label="Chủ đề"
                  options={topicOptions as TaxonomyOption[]}
                  selected={topicIds}
                  onChange={setTopicIds}
                  isLoading={topicsLoading}
                />

                <MultiCheckbox
                  label="Giai đoạn lịch sử"
                  options={periodOptions as TaxonomyOption[]}
                  selected={periodIds}
                  onChange={setPeriodIds}
                  isLoading={periodsLoading}
                />

                <CharacterMultiSelect
                  options={characterOptions as TaxonomyOption[]}
                  selected={characters}
                  onChange={setCharacters}
                  isLoading={charsLoading}
                />

                <MultiCheckbox
                  label="Sự kiện lịch sử"
                  options={eventOptions as TaxonomyOption[]}
                  selected={eventIds}
                  onChange={setEventIds}
                  isLoading={eventsLoading}
                />
              </>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              {activeTab === 'basic' && '1/3'}
              {activeTab === 'meta' && '2/3'}
              {activeTab === 'relations' && '3/3'}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isPending}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
                style={{ minWidth: 100 }}
              >
                {isPending ? '⏳ Đang lưu...' : lesson ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        dialog::backdrop {
          background: rgb(0 0 0 / 0.45);
          backdrop-filter: blur(3px);
        }
      `}</style>
    </dialog>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function AdminLessonsPage() {
  const resource = useAdminResource<Lesson>();

  // Extend query to support lesson-specific status filter values
  const lessonsQuery = {
    page: resource.page,
    pageSize: resource.pageSize,
    search: resource.search || undefined,
    status: (resource.statusFilter || undefined) as LessonStatus | undefined,
  };

  const { data, isLoading, isError } = useAdminLessons(lessonsQuery);
  const createMutation = useCreateLesson();
  const updateMutation = useUpdateLesson();
  const deleteMutation = useDeleteLesson();

  // Fetch full lesson detail when editing
  const [editId, setEditId] = useState<string | null>(null);
  const { data: editLesson } = useAdminLesson(editId);

  const openEditWithDetail = useCallback((item: Lesson) => {
    setEditId(item.id);
  }, []);

  // Open modal once lesson detail is loaded
  useEffect(() => {
    if (editLesson && editId) {
      resource.openEdit(editLesson);
      setEditId(null);
    }
  }, [editLesson, editId, resource]);

  const handleSubmit = async (formData: CreateLessonPayload | UpdateLessonPayload) => {
    try {
      if (resource.editing) {
        await updateMutation.mutateAsync({
          id: resource.editing.id,
          dto: formData as UpdateLessonPayload,
        });
        toast.success('Cập nhật bài học thành công');
      } else {
        await createMutation.mutateAsync(formData as CreateLessonPayload);
        toast.success('Tạo bài học thành công');
      }
      resource.closeModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    }
  };

  const handleDelete = async () => {
    if (!resource.deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(resource.deleteTarget.id);
      toast.success(`Đã lưu trữ bài học "${resource.deleteTarget.title}"`);
      resource.setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
    }
  };

  return (
    <div>
      <DataTable<Lesson>
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        page={resource.page}
        pageSize={resource.pageSize}
        search={resource.search}
        statusFilter={resource.statusFilter}
        onPageChange={resource.setPage}
        onPageSizeChange={resource.setPageSize}
        onSearchChange={resource.setSearch}
        onStatusFilterChange={resource.setStatusFilter}
        statusOptions={[
          { value: 'DRAFT', label: 'Nháp' },
          { value: 'PUBLISHED', label: 'Đã xuất bản' },
          { value: 'ARCHIVED', label: 'Lưu trữ' },
        ]}
        entityLabel="Bài học"
        entityIcon="📖"
        searchPlaceholder="Tìm kiếm bài học..."
        onCreate={resource.openCreate}
        renderActions={actionButtons<Lesson>(openEditWithDetail, resource.confirmDelete)}
        idPrefix="lesson"
      />

      <LessonForm
        open={resource.modalOpen}
        lesson={resource.editing}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onClose={resource.closeModal}
      />

      <ConfirmDialog
        open={!!resource.deleteTarget}
        title="Lưu trữ bài học"
        message={`Bạn có chắc muốn lưu trữ bài học "${resource.deleteTarget?.title}"? Bài học sẽ chuyển sang trạng thái ARCHIVED.`}
        confirmLabel="Lưu trữ"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={resource.cancelDelete}
      />
    </div>
  );
}
