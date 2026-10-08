import unittest
from copy import deepcopy
from unittest.mock import AsyncMock
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from models import Program, ProgramApplication, ScoringJob
from programs.configuration.api import get_configuration, save_configuration, rescore_applications
from programs.configuration.schemas import ProgramConfigurationUpdate
import test_applications


def configuration():
    return {
        'programId': 1,
        'criteria': [{'id': 'experience', 'name': 'Experience', 'type': 'text',
            'priority': 'high', 'guidance': 'Evaluate relevant projects.',
            'options': [], 'ranges': [], 'unit': ''}],
    }


class ConfigurationTests(unittest.IsolatedAsyncioTestCase):
    setUp = test_applications.ApplicationsQueryTests.setUp
    tearDown = test_applications.ApplicationsQueryTests.tearDown

    def prepare_db(self):
        self.db.get = AsyncMock(side_effect=self.session.get)

    async def test_save_roundtrip_preserves_scores_and_states(self):
        self.prepare_db()
        before = self.session.execute(select(ProgramApplication.id, ProgramApplication.score, ProgramApplication.status)).all()
        await save_configuration(1, ProgramConfigurationUpdate.model_validate(configuration()), self.db)
        self.session.expire_all()
        response = await get_configuration(1, self.db)
        self.assertEqual(response, configuration())
        after = self.session.execute(select(ProgramApplication.id, ProgramApplication.score, ProgramApplication.status)).all()
        self.assertEqual(after, before)

    async def test_empty_configuration_and_missing_program(self):
        self.prepare_db()
        self.assertEqual(await get_configuration(1, self.db), {'programId': 1, 'criteria': []})
        with self.assertRaises(HTTPException) as error:
            await get_configuration(999, self.db)
        self.assertEqual(error.exception.status_code, 404)

    async def test_mismatched_program_id_rejected_without_save(self):
        self.prepare_db()
        with self.assertRaises(HTTPException) as error:
            await save_configuration(2, ProgramConfigurationUpdate.model_validate(configuration()), self.db)
        self.assertEqual(error.exception.status_code, 422)
        self.assertEqual(self.session.get(Program, 2).configuration, {})

    async def test_rescore_requires_config_and_queues_without_erasing_scores(self):
        self.prepare_db()
        with self.assertRaises(HTTPException) as error:
            await rescore_applications(1, self.db)
        self.assertEqual(error.exception.status_code, 409)
        await save_configuration(1, ProgramConfigurationUpdate.model_validate(configuration()), self.db)
        application = self.session.get(ProgramApplication, 1)
        application.normalized_data = {"experience": "Projects"}
        self.session.commit()
        response = await rescore_applications(1, self.db)
        self.assertEqual(response["queued"], 1)
        self.assertEqual(len(self.session.scalars(select(ScoringJob)).all()), 1)
        self.assertEqual((await rescore_applications(1, self.db))["queued"], 0)
        self.assertEqual(application.score, 80)
        self.assertEqual(application.status, "ready")

    def test_invalid_criteria_rejected(self):
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
            with self.subTest(payload=item), self.assertRaises(ValidationError):
                ProgramConfigurationUpdate.model_validate(item)

    def test_selection_validation(self):
        payload = configuration()
        criterion = payload['criteria'][0]
        criterion.update(type='select', guidance='', options=[{'id': 'now', 'label': 'Now', 'scoreTier': 'high'}])
        ProgramConfigurationUpdate.model_validate(payload)
        criterion['options'].append({'id': 'later', 'label': 'now', 'scoreTier': 'low'})
        with self.assertRaises(ValidationError):
            ProgramConfigurationUpdate.model_validate(payload)

    def test_numeric_ranges_nonoverlapping_and_finite(self):
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
            with self.subTest(value=value), self.assertRaises(ValidationError):
                ProgramConfigurationUpdate.model_validate(invalid)
