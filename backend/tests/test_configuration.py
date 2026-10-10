import pytest
from copy import deepcopy
from unittest.mock import AsyncMock
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from models import Program, ProgramApplication, ScoringJob
from programs.configuration.api import get_configuration, save_configuration, rescore_applications
from programs.configuration.schemas import ProgramConfigurationUpdate


from factories import configuration


class TestConfiguration:
    @pytest.fixture(autouse=True)
    def setup(self, application_db):
        self.session = application_db.session
        self.db = application_db.db

    def prepare_db(self):
        self.db.get = AsyncMock(side_effect=self.session.get)

    async def test_save_roundtrip_preserves_scores_and_states(self):
        self.prepare_db()
        before = self.session.execute(select(ProgramApplication.id, ProgramApplication.score, ProgramApplication.status)).all()
        await save_configuration(1, ProgramConfigurationUpdate.model_validate(configuration()), self.db)
        self.session.expire_all()
        response = await get_configuration(1, self.db)
        assert response == configuration()
        after = self.session.execute(select(ProgramApplication.id, ProgramApplication.score, ProgramApplication.status)).all()
        assert after == before

    async def test_empty_configuration_and_missing_program(self):
        self.prepare_db()
        assert await get_configuration(1, self.db) == {'programId': 1, 'criteria': []}
        with pytest.raises(HTTPException) as error:
            await get_configuration(999, self.db)
        assert error.value.status_code == 404

    async def test_mismatched_program_id_rejected_without_save(self):
        self.prepare_db()
        with pytest.raises(HTTPException) as error:
            await save_configuration(2, ProgramConfigurationUpdate.model_validate(configuration()), self.db)
        assert error.value.status_code == 422
        assert self.session.get(Program, 2).configuration == {}

    async def test_rescore_requires_config_and_queues_without_erasing_scores(self):
        self.prepare_db()
        with pytest.raises(HTTPException) as error:
            await rescore_applications(1, self.db)
        assert error.value.status_code == 409
        await save_configuration(1, ProgramConfigurationUpdate.model_validate(configuration()), self.db)
        application = self.session.get(ProgramApplication, 1)
        application.normalized_data = {"experience": "Projects"}
        self.session.commit()
        response = await rescore_applications(1, self.db)
        assert response["queued"] == 1
        assert len(self.session.scalars(select(ScoringJob)).all()) == 1
        assert (await rescore_applications(1, self.db))["queued"] == 0
        assert application.score == 80
        assert application.status == "ready"

    def test_invalid_criteria_rejected(self, subtests):
        payload = configuration()
        invalid = []
        invalid.append({**payload, 'criteria': []})
        duplicated = deepcopy(payload)
        duplicated['criteria'] *= 2
        invalid.append(duplicated)
        for changes in ({'type': 'boolean'}, {'guidance': ''}, {'priority': 'critical'}, {'name': ' '}):
            item = deepcopy(payload)
            item['criteria'][0].update(changes)
            invalid.append(item)
        for item in invalid:
            with subtests.test(payload=item), pytest.raises(ValidationError):
                ProgramConfigurationUpdate.model_validate(item)

    def test_selection_validation(self):
        payload = configuration()
        criterion = payload['criteria'][0]
        criterion.update(type='select', guidance='', options=[{'id': 'now', 'label': 'Now', 'scoreTier': 'high'}])
        ProgramConfigurationUpdate.model_validate(payload)
        criterion['options'].append({'id': 'later', 'label': 'now', 'scoreTier': 'low'})
        with pytest.raises(ValidationError):
            ProgramConfigurationUpdate.model_validate(payload)

    def test_numeric_ranges_nonoverlapping_and_finite(self, subtests):
        payload = configuration()
        criterion = payload['criteria'][0]
        criterion.update(type='number', guidance='', ranges=[
            {'id': 'low', 'min': 0, 'max': 3, 'scoreTier': 'low'},
            {'id': 'high', 'min': 3, 'max': None, 'scoreTier': 'high'},
        ])
        ProgramConfigurationUpdate.model_validate(payload)
        for value in (2, float('inf'), 'three'):
            invalid = deepcopy(payload)
            invalid['criteria'][0]['ranges'][1]['min'] = value
            with subtests.test(value=value), pytest.raises(ValidationError):
                ProgramConfigurationUpdate.model_validate(invalid)
