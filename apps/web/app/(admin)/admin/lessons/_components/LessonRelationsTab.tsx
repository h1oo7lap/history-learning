import type { Dispatch, SetStateAction } from 'react';
import type { GradeOption, TaxonomyOption } from '@/features/admin/api';
import { MultiCheckbox } from './MultiCheckbox';
import { CharacterMultiSelect } from './CharacterMultiSelect';
import type { CharacterWithRole } from './types';

export interface LessonRelationsTabProps {
  gradeId: string;
  setGradeId: Dispatch<SetStateAction<string>>;
  topicIds: string[];
  setTopicIds: Dispatch<SetStateAction<string[]>>;
  periodIds: string[];
  setPeriodIds: Dispatch<SetStateAction<string[]>>;
  characters: CharacterWithRole[];
  setCharacters: Dispatch<SetStateAction<CharacterWithRole[]>>;
  eventIds: string[];
  setEventIds: Dispatch<SetStateAction<string[]>>;
  gradeOptions: GradeOption[];
  gradesLoading: boolean;
  topicOptions: TaxonomyOption[];
  topicsLoading: boolean;
  periodOptions: TaxonomyOption[];
  periodsLoading: boolean;
  characterOptions: TaxonomyOption[];
  charsLoading: boolean;
  eventOptions: TaxonomyOption[];
  eventsLoading: boolean;
}

export function LessonRelationsTab({
  gradeId,
  setGradeId,
  topicIds,
  setTopicIds,
  periodIds,
  setPeriodIds,
  characters,
  setCharacters,
  eventIds,
  setEventIds,
  gradeOptions,
  gradesLoading,
  topicOptions,
  topicsLoading,
  periodOptions,
  periodsLoading,
  characterOptions,
  charsLoading,
  eventOptions,
  eventsLoading,
}: LessonRelationsTabProps) {
  return (
    <>
      <div>
        <label className="label" htmlFor="lesson-grade-select">
          Lớp học <span style={{ color: 'var(--error)' }}>*</span>
        </label>
        {gradesLoading ? (
          <div className="skeleton" style={{ height: 38, borderRadius: 4 }} />
        ) : (
          <select
            id="lesson-grade-select"
            className="input"
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
          >
            <option value="">-- Chọn khối lớp --</option>
            {gradeOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.code})
              </option>
            ))}
          </select>
        )}
      </div>

      <MultiCheckbox
        label="Chủ đề"
        options={topicOptions}
        selected={topicIds}
        onChange={setTopicIds}
        isLoading={topicsLoading}
      />

      <MultiCheckbox
        label="Giai đoạn lịch sử"
        options={periodOptions}
        selected={periodIds}
        onChange={setPeriodIds}
        isLoading={periodsLoading}
      />

      <CharacterMultiSelect
        options={characterOptions}
        selected={characters}
        onChange={setCharacters}
        isLoading={charsLoading}
      />

      <MultiCheckbox
        label="Sự kiện lịch sử"
        options={eventOptions}
        selected={eventIds}
        onChange={setEventIds}
        isLoading={eventsLoading}
      />
    </>
  );
}
