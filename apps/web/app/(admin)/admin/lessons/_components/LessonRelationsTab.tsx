import type { Dispatch, SetStateAction } from 'react';
import type { GradeOption, TaxonomyOption } from '@/features/admin/api';
import { MultiCheckbox } from './MultiCheckbox';
import { CharacterMultiSelect } from './CharacterMultiSelect';
import type { CharacterWithRole } from './types';

export interface LessonRelationsTabProps {
  gradeIds: string[];
  setGradeIds: Dispatch<SetStateAction<string[]>>;
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
  gradeIds,
  setGradeIds,
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
      <MultiCheckbox
        label="Lớp học"
        options={gradeOptions.map((g) => ({
          id: g.id,
          name: `${g.name} (${g.code})`,
        }))}
        selected={gradeIds}
        onChange={setGradeIds}
        isLoading={gradesLoading}
      />

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
