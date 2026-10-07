from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, FiniteFloat, model_validator

PriorityTier = Literal['low', 'medium', 'high']


class ScoringOption(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    scoreTier: PriorityTier


class ScoringRange(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True, strict=True)
    id: str = Field(min_length=1)
    min: FiniteFloat
    max: FiniteFloat | None
    scoreTier: PriorityTier

    @model_validator(mode='after')
    def validate_bounds(self):
        if self.max is not None and self.max <= self.min:
            raise ValueError('The upper bound must exceed the lower bound.')
        return self


class ScoringCriterion(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    type: Literal['number', 'text', 'select', 'multiselect']
    priority: PriorityTier
    guidance: str = ''
    options: list[ScoringOption] = Field(default_factory=list)
    ranges: list[ScoringRange] = Field(default_factory=list)
    unit: str = ''

    @model_validator(mode='after')
    def validate_criterion(self):
        match self.type:
            case 'number':
                if not self.ranges or self.options:
                    raise ValueError('Number criteria need ranges and cannot contain options.')
                ranges = sorted(self.ranges, key=lambda item: item.min)
                for previous, current in zip(ranges, ranges[1:]):
                    if previous.max is None or current.min < previous.max:
                        raise ValueError('Number ranges must not overlap.')
            case 'select' | 'multiselect':
                if not self.options or self.ranges:
                    raise ValueError('Selection criteria need options and cannot contain ranges.')
                if len({option.label.casefold() for option in self.options}) != len(self.options):
                    raise ValueError('Option labels must be distinct.')
            case 'text':
                if not self.guidance or self.options or self.ranges:
                    raise ValueError('Text criteria need guidance and cannot contain options or ranges.')
        for items in (self.options, self.ranges):
            if len({item.id for item in items}) != len(items):
                raise ValueError('Option and range IDs must be distinct.')
        return self


class ProgramConfigurationResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')
    programId: int = Field(gt=0)
    criteria: list[ScoringCriterion] = Field(default_factory=list)


class ProgramConfigurationUpdate(ProgramConfigurationResponse):
    criteria: list[ScoringCriterion] = Field(min_length=1)

    @model_validator(mode='after')
    def validate_criteria(self):
        if len({criterion.id for criterion in self.criteria}) != len(self.criteria):
            raise ValueError('Criterion IDs must be distinct.')
        if len({criterion.name.casefold() for criterion in self.criteria}) != len(self.criteria):
            raise ValueError('Criterion names must be distinct.')
        return self


class RescoreResponse(BaseModel):
    message: str
