import { useState, useEffect, useRef } from 'react';
import {
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
import type { ContentBlock } from '@/components/content/BlockEditor';
import type { CharacterWithRole } from './types';
import { LessonBasicTab } from './LessonBasicTab';
import { LessonMetaTab } from './LessonMetaTab';
import { LessonRelationsTab } from './LessonRelationsTab';

export interface LessonFormProps {
  open: boolean;
  lesson: Lesson | null;
  isPending: boolean;
  onSubmit: (data: CreateLessonPayload | UpdateLessonPayload) => void | Promise<void>;
  onClose: () => void;
}

export function LessonForm({ open, lesson, isPending, onSubmit, onClose }: LessonFormProps) {
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

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

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
              <LessonBasicTab
                title={title}
                setTitle={setTitle}
                slug={slug}
                setSlug={setSlug}
                summary={summary}
                setSummary={setSummary}
                content={content}
                setContent={setContent}
                contentMode={contentMode}
                setContentMode={setContentMode}
                blocks={blocks}
                setBlocks={setBlocks}
                thumbnail={thumbnail}
                setThumbnail={setThumbnail}
                errors={errors}
                clearError={clearError}
              />
            )}

            {/* === TAB: Meta === */}
            {activeTab === 'meta' && (
              <LessonMetaTab
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                estimatedTime={estimatedTime}
                setEstimatedTime={setEstimatedTime}
                displayOrder={displayOrder}
                setDisplayOrder={setDisplayOrder}
                status={status}
                setStatus={setStatus}
                errors={errors}
                clearError={clearError}
              />
            )}

            {/* === TAB: Relations === */}
            {activeTab === 'relations' && (
              <LessonRelationsTab
                gradeIds={gradeIds}
                setGradeIds={setGradeIds}
                topicIds={topicIds}
                setTopicIds={setTopicIds}
                periodIds={periodIds}
                setPeriodIds={setPeriodIds}
                characters={characters}
                setCharacters={setCharacters}
                eventIds={eventIds}
                setEventIds={setEventIds}
                gradeOptions={gradeOptions as GradeOption[]}
                gradesLoading={gradesLoading}
                topicOptions={topicOptions as TaxonomyOption[]}
                topicsLoading={topicsLoading}
                periodOptions={periodOptions as TaxonomyOption[]}
                periodsLoading={periodsLoading}
                characterOptions={characterOptions as TaxonomyOption[]}
                charsLoading={charsLoading}
                eventOptions={eventOptions as TaxonomyOption[]}
                eventsLoading={eventsLoading}
              />
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
